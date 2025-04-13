// import { NextRequest, NextResponse } from 'next/server';
// import { exec } from 'child_process';
// import { promises as fs } from 'fs';
// import { join } from 'path';
// import path from 'path';
// import util from 'util';

// const execPromise = util.promisify(exec);

// interface ClassificationResult {
//   result: string;
//   error?: string;
// }

// export async function POST(request: NextRequest): Promise<NextResponse<ClassificationResult>> {
//   try {
//     // Get the form data from the request
//     const formData = await request.formData();
//     const image = formData.get('image') as File | null;
    
//     if (!image) {
//       return NextResponse.json({ 
//         result: '',
//         error: 'No image provided' 
//       }, { status: 400 });
//     }
    
//     // Create a temporary file path for the uploaded image
//     const tempDir = join(process.cwd(), 'temp');
//     await fs.mkdir(tempDir, { recursive: true }); // Create the directory if it doesn't exist
    
//     const imageBuffer = Buffer.from(await image.arrayBuffer());

//     // Generate a unique filename using timestamp + random number
//     const timestamp = Date.now();
//     const random = Math.floor(Math.random() * 10000);
//     const imageName = `upload_${timestamp}_${random}${path.extname(image.name || '.jpg')}`;
//     const imagePath = join(tempDir, imageName);
    
//     // Write the file to the temporary location
//     await fs.writeFile(imagePath, imageBuffer);
    
//     // Run the Python script with the image path as an argument
//     const { stdout, stderr } = await execPromise(`python car.py "${imagePath}"`);
    
//     if (stderr && !stderr.includes('WARNING')) {
//       console.error('Python script error:', stderr);
//     }
    
//     // Clean up - remove the temporary file
//     try {
//       await fs.unlink(imagePath);
//     } catch (cleanupError) {
//       console.error('Failed to remove temporary file:', cleanupError);
//     }
    
//     // Return the result from the Python script
//     return NextResponse.json({ 
//       result: stdout.trim()
//     });
    
//   } catch (error) {
//     console.error('Classification error:', error);
//     return NextResponse.json({ 
//       result: '',
//       error: 'Failed to process image' 
//     }, { status: 500 });
//   }
// }



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
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    
    if (!image) {
      return NextResponse.json({ 
        result: '',
        error: 'No image provided' 
      }, { status: 400 });
    }
    
    // Create a temporary file path for the uploaded image
    const tempDir = join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true }); // Create the directory if it doesn't exist
    
    const imageBuffer = Buffer.from(await image.arrayBuffer());

    // Generate a unique filename using timestamp + random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const imageName = `upload_${timestamp}_${random}${path.extname(image.name || '.jpg')}`;
    const imagePath = join(tempDir, imageName);
    
    // Write the file to the temporary location
    await fs.writeFile(imagePath, imageBuffer);
    
    // Run the Python script with the image path as an argument
    const { stdout, stderr } = await execPromise(`python car.py "${imagePath}"`);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Python script error:', stderr);
    }
    
    // Clean up - remove the temporary file
    try {
      await fs.unlink(imagePath);
    } catch (cleanupError) {
      console.error('Failed to remove temporary file:', cleanupError);
    }
    
    // Return the result from the Python script
    return NextResponse.json({ 
      result: stdout.trim()
    });
    
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json({ 
      result: '',
      error: 'Failed to process image' 
    }, { status: 500 });
  }
}
