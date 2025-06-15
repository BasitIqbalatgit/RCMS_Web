// /api/operator/detect-parts/route.ts
import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';

type DetectedPart = {
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
    center_point: [number, number]; // [x, y] for SAM prompt
};

type ResponseData = {
    parts?: DetectedPart[];
    originalImageUrl?: string;
    annotatedImageUrl?: string;
    metadata?: {
        total_detections: number;
        image_dimensions: { width: number; height: number };
        model_info?: any;
        detection_parameters?: any;
    };
    error?: string;
};

// Use 'python' instead of 'python3' for Windows compatibility
const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';

export async function POST(req: NextRequest): Promise<NextResponse<ResponseData>> {
    const timestamp = Date.now();
    let tempFilePath: string | null = null;
    let detectionsJsonPath: string | null = null;
    let originalImagePath: string | null = null;

    try {
        // Get the form data from the request
        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const minConfidence = parseFloat(formData.get('min_confidence') as string || '0.25'); // Match Python script default

        if (!file) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' 
            }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: 'File too large. Maximum size is 10MB.' 
            }, { status: 400 });
        }

        // Convert the File to a buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Create directory structure
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const outputsDir = path.join(process.cwd(), 'public', 'outputs');
        const tempDir = path.join(process.cwd(), 'tmp');
        
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.mkdir(outputsDir, { recursive: true });
        await fs.mkdir(tempDir, { recursive: true });

        // File paths
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        tempFilePath = path.join(tempDir, `${timestamp}-${sanitizedFileName}`);
        originalImagePath = path.join(uploadsDir, `original-${timestamp}-${sanitizedFileName}`);
        const outputImagePath = path.join(outputsDir, `annotated-${timestamp}.jpg`);
        detectionsJsonPath = path.join(tempDir, `detections-${timestamp}.json`);

        // Save the uploaded image
        await fs.writeFile(tempFilePath, buffer);
        await fs.writeFile(originalImagePath, buffer);

        // Run the Python YOLO detection script
        const pythonProcess = spawn(PYTHON_EXECUTABLE, [
            path.join(process.cwd(), 'yolo_detector.py'),
            tempFilePath,
            outputImagePath,
            detectionsJsonPath,
        ]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
            console.log('YOLO stdout:', data.toString()); // Add logging
        });

        pythonProcess.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
            console.log('YOLO stderr:', data.toString()); // Add logging
        });

        // Wait for the Python process to complete
        await new Promise<void>((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('YOLO process completed successfully');
                    resolve();
                } else {
                    console.error('YOLO process failed:', { code, stdout, stderr });
                    reject(new Error(`Python script exited with code ${code}. STDOUT: ${stdout}. STDERR: ${stderr}`));
                }
            });
        });

        // Read the detection results
        console.log('Reading detection results from:', detectionsJsonPath);
        const detectionsData = await fs.readFile(detectionsJsonPath, 'utf-8');
        const parsedData = JSON.parse(detectionsData);

        // Extract detected parts and metadata
        const detectedParts: DetectedPart[] = parsedData.detections || [];
        const metadata = parsedData.metadata || {};

        console.log(`Found ${detectedParts.length} parts in detection results`);

        // Generate public URLs
        const originalImageUrl = `/uploads/original-${timestamp}-${sanitizedFileName}`;
        const annotatedImageUrl = `/outputs/annotated-${timestamp}.jpg`;

        // Copy original image to public uploads folder for access
        const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(publicUploadsDir, { recursive: true });
        await fs.copyFile(originalImagePath, path.join(publicUploadsDir, `original-${timestamp}-${sanitizedFileName}`));

        // Log successful detection
        console.log(`✅ Detection completed: ${detectedParts.length} parts found`);
        console.log(`📁 Files created: ${originalImageUrl}, ${annotatedImageUrl}`);

        // Return response with the correct format
        return NextResponse.json({
            parts: detectedParts, // Changed from detectedParts to parts to match frontend expectation
            originalImageUrl,
            annotatedImageUrl,
            metadata: {
                total_detections: detectedParts.length,
                image_dimensions: metadata.image_dimensions || { width: 0, height: 0 },
                model_info: metadata.model_info,
                processing_time: Date.now() - timestamp,
                timestamp,
                detection_parameters: metadata.detection_parameters
            }
        });

    } catch (error) {
        console.error('Detection error:', error);
        
        // Enhanced error logging
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to detect parts',
                timestamp
            },
            { status: 500 }
        );
    } finally {
        // Cleanup temporary files
        try {
            if (tempFilePath && await fs.access(tempFilePath).then(() => true).catch(() => false)) {
                await fs.unlink(tempFilePath);
            }
            if (detectionsJsonPath && await fs.access(detectionsJsonPath).then(() => true).catch(() => false)) {
                await fs.unlink(detectionsJsonPath);
            }
        } catch (cleanupError) {
            console.warn('Cleanup warning:', cleanupError);
        }
    }
}