import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

interface ClassificationResult {
  result: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ClassificationResult>> {
  let imagePath: string | null = null;
  
  try {
    console.log('Starting image classification request...');
    
    // Get the form data from the request
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    
    if (!image) {
      console.error('No image provided in request');
      return NextResponse.json({ 
        result: '',
        error: 'No image provided' 
      }, { status: 400 });
    }
    
    console.log(`Received image: ${image.name}, size: ${image.size} bytes`);
    
    // Validate image type
    if (!image.type.startsWith('image/')) {
      console.error(`Invalid file type: ${image.type}`);
      return NextResponse.json({ 
        result: '',
        error: 'Invalid file type. Please upload an image file.' 
      }, { status: 400 });
    }
    
    // Create a temporary file path for the uploaded image
    const tempDir = join(process.cwd(), 'temp');
    console.log(`Temp directory: ${tempDir}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log('Temp directory created/verified');
    } catch (mkdirError) {
      console.error('Failed to create temp directory:', mkdirError);
      return NextResponse.json({ 
        result: '',
        error: 'Failed to create temporary directory' 
      }, { status: 500 });
    }
    
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);

    // Generate a unique filename using timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const extension = path.extname(image.name || '.jpg') || '.jpg';
    const imageName = `upload_${timestamp}_${random}${extension}`;
    imagePath = join(tempDir, imageName);
    
    console.log(`Writing image to: ${imagePath}`);
    
    // Write the file to the temporary location
    try {
      await fs.writeFile(imagePath, imageBuffer);
      console.log('Image file written successfully');
    } catch (writeError) {
      console.error('Failed to write image file:', writeError);
      return NextResponse.json({ 
        result: '',
        error: 'Failed to save uploaded image' 
      }, { status: 500 });
    }
    
    // Verify the file exists and is readable
    try {
      const stats = await fs.stat(imagePath);
      console.log(`File stats - size: ${stats.size}, exists: true`);
    } catch (statError) {
      console.error('File verification failed:', statError);
      return NextResponse.json({ 
        result: '',
        error: 'Failed to verify uploaded image' 
      }, { status: 500 });
    }
    
    // Check if Python script exists
    const pythonScriptPath = join(process.cwd(), 'car.py');
    try {
      await fs.access(pythonScriptPath);
      console.log(`Python script found at: ${pythonScriptPath}`);
    } catch (accessError) {
      console.error(`Python script not found at: ${pythonScriptPath}`);
      return NextResponse.json({ 
        result: '',
        error: 'Classification script not found' 
      }, { status: 500 });
    }
    
    // Check if model file exists
    const modelPath = join(process.cwd(), 'car_classifier_model.h5');
    try {
      await fs.access(modelPath);
      console.log(`Model file found at: ${modelPath}`);
    } catch (accessError) {
      console.error(`Model file not found at: ${modelPath}`);
      return NextResponse.json({ 
        result: '',
        error: 'Classification model not found. Please ensure car_classifier_model.h5 is in the project root.' 
      }, { status: 500 });
    }
    
    console.log(`Executing Python script with image: ${imagePath}`);
    
    // Run the Python script with the image path as an argument
    // Using absolute paths and proper escaping
    const command = `python "${pythonScriptPath}" "${imagePath}"`;
    console.log(`Command: ${command}`);
    
    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 30000, // 30 second timeout
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      
      console.log('Python script stdout:', stdout);
      if (stderr) {
        console.log('Python script stderr:', stderr);
      }
      
      // Check if we got a valid result
      const result = stdout.trim();
      if (!result) {
        throw new Error('Python script returned empty result');
      }
      
      console.log('Classification successful:', result);
      
      return NextResponse.json({ 
        result: result
      });
      
    } catch (execError: any) {
      console.error('Python script execution error:', execError);
      
      let errorMessage = 'Failed to classify image';
      if (execError.code === 'ENOENT') {
        errorMessage = 'Python not found. Please ensure Python is installed and in PATH.';
      } else if (execError.signal === 'SIGTERM') {
        errorMessage = 'Classification timed out. Please try with a smaller image.';
      } else if (execError.stderr) {
        console.error('Python stderr:', execError.stderr);
        errorMessage = `Classification failed: ${execError.stderr}`;
      }
      
      return NextResponse.json({ 
        result: '',
        error: errorMessage 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Unexpected error in classification:', error);
    return NextResponse.json({ 
      result: '',
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  } finally {
    // Clean up - remove the temporary file
    if (imagePath) {
      try {
        await fs.unlink(imagePath);
        console.log('Temporary file cleaned up successfully');
      } catch (cleanupError) {
        console.error('Failed to remove temporary file:', cleanupError);
      }
    }
  }
}