import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface SegmentedPart {
  class_name: string;
  confidence: number;
  segmented_image_path: string;
  mask_path: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const segmentedImage = formData.get('segmentedImage') as string;
    const segmentedPartsStr = formData.get('segmentedParts') as string;
    
    console.log('Received stitching request with:', {
      hasSegmentedImage: !!segmentedImage,
      hasSegmentedParts: !!segmentedPartsStr
    });
    
    if (!segmentedPartsStr) {
      return NextResponse.json(
        { success: false, error: 'Segmented parts data is required' },
        { status: 400 }
      );
    }

    let segmentedParts: SegmentedPart[];
    try {
      segmentedParts = JSON.parse(segmentedPartsStr);
      
      // Validate segmented parts data
      if (!Array.isArray(segmentedParts)) {
        throw new Error('Segmented parts must be an array');
      }
      
      // Validate each part
      segmentedParts.forEach((part, index) => {
        if (!part.class_name || 
            typeof part.x !== 'number' || 
            typeof part.y !== 'number' || 
            typeof part.w !== 'number' || 
            typeof part.h !== 'number') {
          console.error('Invalid part data at index', index, part);
          throw new Error(`Invalid part data for ${part.class_name || 'unknown part'}`);
        }
      });
      
      console.log('Validated segmented parts:', {
        count: segmentedParts.length,
        parts: segmentedParts.map(p => ({
          class_name: p.class_name,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h
        }))
      });
      
    } catch (error) {
      console.error('Error parsing segmented parts:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid segmented parts data format' },
        { status: 400 }
      );
    }
    
    // Create output directory
    const sessionId = uuidv4();
    const outputDir = path.join(process.cwd(), 'public', 'stitching_results', sessionId);
    fs.mkdirSync(outputDir, { recursive: true });

    // Prepare input data
    const inputData = {
      segmentedImage,
      segmentedParts,
      references: [] as { className: string; imagePath: string }[],
      outputDir: `/stitching_results/${sessionId}`
    };

    // Get reference images and match them with segmented parts
    const referenceMap = new Map<string, string>();
    let index = 0;
    while (formData.has(`reference_${index}`)) {
      const imagePath = formData.get(`reference_${index}`) as string;
      const className = formData.get(`class_${index}`) as string;
      referenceMap.set(className, imagePath);
      index++;
    }

    // Match references with segmented parts
    segmentedParts.forEach(part => {
      const imagePath = referenceMap.get(part.class_name);
      if (imagePath) {
        inputData.references.push({
          className: part.class_name,
          imagePath
        });
      }
    });

    console.log('Prepared input data:', {
      hasSegmentedImage: !!inputData.segmentedImage,
      segmentedPartsCount: inputData.segmentedParts.length,
      referencesCount: inputData.references.length,
      references: inputData.references.map(ref => ({
        className: ref.className,
        imagePath: ref.imagePath
      }))
    });

    // Save input data
    const inputPath = path.join(outputDir, 'input.json');
    fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

    // Run stitching script
    const scriptPath = path.join(process.cwd(), 'stitching.py');
    
    return new Promise((resolve) => {
      const process = spawn('python', [scriptPath, inputPath]);
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Stitching output:', data.toString());
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
        console.error('Stitching error:', data.toString());
      });

      process.on('close', (code) => {
        console.log(`Stitching process exited with code: ${code}`);
        console.log(`Process output: ${output}`);
        console.log(`Process error: ${error}`);
        
        if (code !== 0) {
          console.error('Stitching failed:', error);
          resolve(NextResponse.json(
            { success: false, error: error || 'Stitching process failed' },
            { status: 500 }
          ));
          return;
        }

        try {
          const outputPath = path.join(outputDir, 'output.json');
          console.log(`Looking for output file at: ${outputPath}`);
          
          if (!fs.existsSync(outputPath)) {
            console.error('Output file does not exist');
            resolve(NextResponse.json(
              { success: false, error: 'Stitching output file not found' },
              { status: 500 }
            ));
            return;
          }
          
          const outputContent = fs.readFileSync(outputPath, 'utf-8');
          console.log(`Output file content: ${outputContent}`);
          
          const result = JSON.parse(outputContent);

          if (!result.success) {
            resolve(NextResponse.json(
              { success: false, error: result.error || 'Stitching failed' },
              { status: 500 }
            ));
            return;
          }

          console.log(`Stitching successful, returning: ${JSON.stringify(result)}`);
          resolve(NextResponse.json({
            success: true,
            stitchedImageUrl: result.stitchedImageUrl,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error reading result:', error);
          resolve(NextResponse.json(
            { success: false, error: 'Failed to process results' },
            { status: 500 }
          ));
        }
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 