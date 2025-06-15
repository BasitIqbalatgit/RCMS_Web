// /api/operator/segment/route.ts
import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { convertYOLOToSAMPrompts, type YOLODetection } from '@/utils/sam-integration';

interface ResponseData {
    success: boolean;
    timestamp: string;
    segmentedImageUrl: string;
    segmentedParts: {
        class_name: string;
        confidence: number;
        segmented_image_path: string;
        mask_path: string;
    }[];
    error?: string;
}

type SegmentedPart = {
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number];
    center_point: [number, number];
    segmented_image_path: string;
    mask_path: string;
    mask_area: number;
};

const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';

export async function POST(req: NextRequest): Promise<NextResponse<ResponseData>> {
    const timestamp = Date.now();
    let tempFilePath = '';
    let samInputPath = '';
    let outputDir = '';

    try {
        // Get the form data from the request
        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const selectedPartsStr = formData.get('selectedParts') as string;
        const detectedPartsStr = formData.get('detectedParts') as string;

        if (!file || !selectedPartsStr || !detectedPartsStr) {
            return NextResponse.json({ 
                success: false,
                timestamp: '',
                segmentedImageUrl: '',
                segmentedParts: [],
                error: 'Missing required data: image, selectedParts, or detectedParts' 
            }, { status: 400 });
        }

        // Parse the parts data
        const selectedParts: string[] = JSON.parse(selectedPartsStr);
        const detectedParts: YOLODetection[] = JSON.parse(detectedPartsStr);

        // Filter detected parts to only include selected ones
        const partsToSegment = detectedParts.filter(part => 
            selectedParts.includes(part.class_name)
        );

        if (partsToSegment.length === 0) {
            return NextResponse.json({ 
                success: false,
                timestamp: '',
                segmentedImageUrl: '',
                segmentedParts: [],
                error: 'No valid parts selected for segmentation' 
            }, { status: 400 });
        }

        // Setup directories and file paths
        const buffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        tempFilePath = path.join(process.cwd(), 'tmp', `${timestamp}-${sanitizedFileName}`);
        outputDir = path.join(process.cwd(), 'public', 'segments', `${timestamp}`);
        samInputPath = path.join(process.cwd(), 'tmp', `${timestamp}-sam-input.json`);
        
        // Create necessary directories
        await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(tempFilePath, buffer);

        // Prepare SAM inputs
        const samInputs = partsToSegment.map(part => ({
            image_path: tempFilePath,
            output_path: path.join(outputDir, 'segmentation_results.json'),
            prompts: [
                { type: 'point', data: part.center_point },
                { type: 'box', data: part.bbox }
            ],
            detection_metadata: {
                class_name: part.class_name,
                confidence: part.confidence
            }
        }));

        // Save SAM input configuration
        await fs.writeFile(samInputPath, JSON.stringify(samInputs));

        // Run SAM segmentation
        const samScriptPath = path.join(process.cwd(), 'sam_segmentation.py');
        const samProcess = spawn(PYTHON_EXECUTABLE, [samScriptPath, samInputPath]);

        let samError = '';
        samProcess.stderr.on('data', (data) => {
            samError += data.toString();
            console.error(`SAM Error: ${data}`);
        });

        await new Promise<void>((resolve, reject) => {
            samProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`SAM process failed with code ${code}: ${samError}`));
                }
            });
        });

        // Clean up temporary files
        try {
            await fs.unlink(tempFilePath);
            await fs.unlink(samInputPath);
        } catch (err) {
            console.error('Error cleaning up temporary files:', err);
        }

        // Read segmentation results
        const resultsPath = path.join(outputDir, 'segmentation_results.json');
        const resultsData = await fs.readFile(resultsPath, 'utf-8');
        const segmentedParts = JSON.parse(resultsData);

        // Convert absolute paths to relative URLs
        const responseData = {
            success: true,
            timestamp: timestamp.toString(),
            segmentedImageUrl: `/segments/${timestamp}/modified.jpg`,
            segmentedParts: segmentedParts.map((part: any) => ({
                ...part,
                segmented_image_path: `/segments/${timestamp}/${path.basename(part.segmented_image_path)}`,
                mask_path: `/segments/${timestamp}/${path.basename(part.mask_path)}`
            }))
        };

        console.log('Sending response data:', {
            success: responseData.success,
            timestamp: responseData.timestamp,
            hasSegmentedImageUrl: !!responseData.segmentedImageUrl,
            segmentedPartsCount: responseData.segmentedParts.length,
            segmentedParts: responseData.segmentedParts.map((part: any) => ({
                class_name: part.class_name,
                confidence: part.confidence,
                segmented_image_path: part.segmented_image_path,
                mask_path: part.mask_path
            }))
        });

        return NextResponse.json(responseData);

    } catch (err) {
        console.error('Error during segmentation:', err);
        return NextResponse.json({ 
            success: false,
            timestamp: '',
            segmentedImageUrl: '',
            segmentedParts: [],
            error: err instanceof Error ? err.message : 'An error occurred during segmentation'
        }, { status: 500 });
    }
}