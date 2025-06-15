// /api/operator/detect-and-segment/route.ts
import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { 
    convertYOLOToSAMPrompts, 
    filterDetectionsByConfidence, 
    applyNMS, 
    validateDetections,
    type YOLODetection,
    type SAMInput 
} from '@/utils/sam-integration';

type SegmentedPart = {
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number];
    center_point: [number, number];
    mask_url: string;
    detection_id: string;
};

type ResponseData = {
    detectedParts?: YOLODetection[];
    segmentedParts?: SegmentedPart[];
    originalImageUrl?: string;
    annotatedImageUrl?: string;
    metadata?: {
        total_detections: number;
        total_segments: number;
        image_dimensions: { width: number; height: number };
        processing_time: number;
    };
    error?: string;
};

const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';

export async function POST(req: NextRequest): Promise<NextResponse<ResponseData>> {
    const timestamp = Date.now();
    const tempFiles: string[] = [];

    try {
        // Parse request
        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const minConfidence = parseFloat(formData.get('min_confidence') as string || '0.1');
        const enableNMS = formData.get('enable_nms') === 'true';
        const runSAM = formData.get('run_sam') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        // Setup directories
        const dirs = {
            temp: path.join(process.cwd(), 'tmp'),
            uploads: path.join(process.cwd(), 'uploads'),
            outputs: path.join(process.cwd(), 'public', 'outputs'),
            segments: path.join(process.cwd(), 'public', 'segments')
        };

        for (const dir of Object.values(dirs)) {
            await fs.mkdir(dir, { recursive: true });
        }

        // File paths
        const buffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const inputImagePath = path.join(dirs.temp, `input-${timestamp}-${sanitizedFileName}`);
        const outputImagePath = path.join(dirs.outputs, `annotated-${timestamp}.jpg`);
        const detectionsJsonPath = path.join(dirs.temp, `detections-${timestamp}.json`);

        tempFiles.push(inputImagePath, detectionsJsonPath);
        await fs.writeFile(inputImagePath, buffer);

        // Step 1: Run YOLO Detection
        console.log('🔍 Running YOLO detection...');
        const yoloProcess = spawn(PYTHON_EXECUTABLE, [
            path.join(process.cwd(), 'yolo_detector.py'),
            inputImagePath,
            outputImagePath,
            detectionsJsonPath,
        ]);

        await new Promise<void>((resolve, reject) => {
            let stderr = '';
            yoloProcess.stderr.on('data', (data) => stderr += data.toString());
            yoloProcess.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`YOLO failed with code ${code}: ${stderr}`));
            });
        });

        // Read YOLO results
        const detectionsData = await fs.readFile(detectionsJsonPath, 'utf-8');
        const parsedData = JSON.parse(detectionsData);
        let detectedParts: YOLODetection[] = parsedData.detections || [];

        // Apply post-processing
        if (parsedData.metadata?.image_dimensions) {
            const { width, height } = parsedData.metadata.image_dimensions;
            detectedParts = validateDetections(detectedParts, width, height);
        }

        detectedParts = filterDetectionsByConfidence(detectedParts, minConfidence);

        if (enableNMS) {
            detectedParts = applyNMS(detectedParts, 0.5);
        }

        console.log(`✅ YOLO completed: ${detectedParts.length} parts detected`);

        // Step 2: Run SAM Segmentation (if requested)
        let segmentedParts: SegmentedPart[] = [];
        
        if (runSAM && detectedParts.length > 0) {
            console.log('🎯 Running SAM segmentation...');
            
            // Prepare SAM inputs
            const samInputs = convertYOLOToSAMPrompts(detectedParts);
            
            for (let i = 0; i < samInputs.length; i++) {
                const detection = detectedParts[i];
                const maskPath = path.join(dirs.segments, `mask-${timestamp}-${i}-${detection.class_name}.png`);
                const samJsonPath = path.join(dirs.temp, `sam-${timestamp}-${i}.json`);
                
                tempFiles.push(samJsonPath);
                
                // Prepare SAM input JSON
                const samInput = {
                    image_path: inputImagePath,
                    prompts: samInputs[i].prompts,
                    output_path: maskPath,
                    detection_metadata: samInputs[i].detection_metadata
                };
                
                await fs.writeFile(samJsonPath, JSON.stringify(samInput, null, 2));
                
                // Run SAM (assuming you have a sam_segmentation.py script)
                try {
                    const samProcess = spawn(PYTHON_EXECUTABLE, [
                        path.join(process.cwd(), 'sam_segmentation.py'),
                        samJsonPath
                    ]);
                    
                    await new Promise<void>((resolve, reject) => {
                        let stderr = '';
                        samProcess.stderr.on('data', (data) => stderr += data.toString());
                        samProcess.on('close', (code) => {
                            if (code === 0) resolve();
                            else reject(new Error(`SAM failed for detection ${i}: ${stderr}`));
                        });
                    });
                    
                    // Add to segmented parts
                    segmentedParts.push({
                        ...detection,
                        mask_url: `/segments/mask-${timestamp}-${i}-${detection.class_name}.png`,
                        detection_id: `detection_${i}`
                    });
                    
                } catch (samError) {
                    console.warn(`SAM segmentation failed for detection ${i}:`, samError);
                }
            }
            
            console.log(`✅ SAM completed: ${segmentedParts.length} parts segmented`);
        }

        // Save original image for reference
        const originalImageUrl = `/uploads/original-${timestamp}-${sanitizedFileName}`;
        const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(publicUploadsDir, { recursive: true });
        await fs.writeFile(path.join(publicUploadsDir, `original-${timestamp}-${sanitizedFileName}`), buffer);

        const processingTime = Date.now() - timestamp;

        return NextResponse.json({
            detectedParts,
            segmentedParts,
            originalImageUrl,
            annotatedImageUrl: `/outputs/annotated-${timestamp}.jpg`,
            metadata: {
                total_detections: detectedParts.length,
                total_segments: segmentedParts.length,
                image_dimensions: parsedData.metadata?.image_dimensions || { width: 0, height: 0 },
                processing_time
            }
        });

    } catch (error) {
        console.error('Detection/Segmentation error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to process image',
            },
            { status: 500 }
        );
    } finally {
        // Cleanup
        for (const tempFile of tempFiles) {
            try {
                await fs.unlink(tempFile);
            } catch (cleanupError) {
                console.warn('Cleanup warning:', cleanupError);
            }
        }
    }
}