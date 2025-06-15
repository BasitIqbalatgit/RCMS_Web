import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const timestamp = params.id;
        const segmentsDir = path.join(process.cwd(), 'public', 'segments', timestamp);
        
        // Check if the directory exists
        try {
            await fs.access(segmentsDir);
        } catch {
            return NextResponse.json(
                { error: 'Segmentation data not found' },
                { status: 404 }
            );
        }

        // Read the segmentation results
        const resultsPath = path.join(segmentsDir, 'segmentation_results.json');
        const resultsData = await fs.readFile(resultsPath, 'utf-8');
        const segmentedParts = JSON.parse(resultsData);

        // Construct the response
        const response = {
            originalImageUrl: `/segments/${timestamp}/original.jpg`,
            modifiedImageUrl: `/segments/${timestamp}/modified.jpg`,
            segmentedParts: segmentedParts.map((part: any) => ({
                ...part,
                segmented_image_path: part.segmented_image_path.replace(path.join(process.cwd(), 'public'), ''),
                mask_path: part.mask_path.replace(path.join(process.cwd(), 'public'), '')
            })),
            timestamp
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching segmentation data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch segmentation data' },
            { status: 500 }
        );
    }
} 