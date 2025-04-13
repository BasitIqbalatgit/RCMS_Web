import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';

type ResponseData = {
  segmentedImageUrl?: string;
  error?: string;
};

// Use 'python' instead of 'python3' for Windows compatibility
const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';

export async function POST(req: NextRequest): Promise<NextResponse<ResponseData>> {
  try {
    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert the File to a temporary file on disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(process.cwd(), 'tmp', `${Date.now()}-${file.name}`);
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true }); // Ensure tmp directory exists
    await fs.writeFile(tempFilePath, buffer);

    const outputImagePath = path.join(process.cwd(), 'public', 'segmented_output.jpg');

    // Run the Python script
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [
      path.join(process.cwd(), 'yoloTest.py'),
      tempFilePath,
      outputImagePath,
    ]);

    let errorOutput = '';
    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    await new Promise<void>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      });
    });

    // Clean up temporary file
    await fs.unlink(tempFilePath);

    // Return the URL of the segmented image
    return NextResponse.json({ segmentedImageUrl: '/segmented_output.jpg' });
  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to segment image',
      },
      { status: 500 }
    );
  }
} 