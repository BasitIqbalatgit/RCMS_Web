// utils/sam-integration.ts
export interface YOLODetection {
    class_name: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x1, y1, x2, y2]
    center_point: [number, number]; // [x, y]
}

export interface SAMPrompt {
    type: 'point' | 'box';
    data: number[] | number[][];
    label?: number; // 1 for foreground, 0 for background
}

export interface SAMInput {
    image_path: string;
    prompts: SAMPrompt[];
    output_path: string;
    detection_metadata?: {
        class_name: string;
        confidence: number;
        detection_id: string;
    };
}

/**
 * Convert YOLO detections to SAM prompts
 */
export function convertYOLOToSAMPrompts(detections: YOLODetection[]): SAMInput[] {
    return detections.map((detection, index) => {
        const prompts: SAMPrompt[] = [];
        
        // Add point prompt (center of bounding box)
        prompts.push({
            type: 'point',
            data: detection.center_point,
            label: 1 // foreground
        });
        
        // Add box prompt (bounding box coordinates)
        prompts.push({
            type: 'box',
            data: detection.bbox
        });
        
        return {
            image_path: '', // Will be filled by the calling function
            prompts,
            output_path: '', // Will be filled by the calling function
            detection_metadata: {
                class_name: detection.class_name,
                confidence: detection.confidence,
                detection_id: `detection_${index}`
            }
        };
    });
}

/**
 * Filter detections by confidence threshold
 */
export function filterDetectionsByConfidence(
    detections: YOLODetection[], 
    minConfidence: number = 0.5
): YOLODetection[] {
    return detections.filter(detection => detection.confidence >= minConfidence);
}

/**
 * Group detections by class name
 */
export function groupDetectionsByClass(detections: YOLODetection[]): Record<string, YOLODetection[]> {
    return detections.reduce((groups, detection) => {
        const className = detection.class_name;
        if (!groups[className]) {
            groups[className] = [];
        }
        groups[className].push(detection);
        return groups;
    }, {} as Record<string, YOLODetection[]>);
}

/**
 * Calculate intersection over union (IoU) for two bounding boxes
 */
export function calculateIoU(bbox1: [number, number, number, number], bbox2: [number, number, number, number]): number {
    const [x1_1, y1_1, x2_1, y2_1] = bbox1;
    const [x1_2, y1_2, x2_2, y2_2] = bbox2;
    
    // Calculate intersection
    const x1 = Math.max(x1_1, x1_2);
    const y1 = Math.max(y1_1, y1_2);
    const x2 = Math.min(x2_1, x2_2);
    const y2 = Math.min(y2_1, y2_2);
    
    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    
    // Calculate union
    const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
    const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
    const unionArea = area1 + area2 - intersectionArea;
    
    return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Remove overlapping detections using Non-Maximum Suppression
 */
export function applyNMS(detections: YOLODetection[], iouThreshold: number = 0.5): YOLODetection[] {
    // Sort by confidence (highest first)
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const result: YOLODetection[] = [];
    
    for (const detection of sorted) {
        let shouldKeep = true;
        
        for (const kept of result) {
            const iou = calculateIoU(detection.bbox, kept.bbox);
            if (iou > iouThreshold && detection.class_name === kept.class_name) {
                shouldKeep = false;
                break;
            }
        }
        
        if (shouldKeep) {
            result.push(detection);
        }
    }
    
    return result;
}

/**
 * Validate detection coordinates are within image bounds
 */
export function validateDetections(
    detections: YOLODetection[], 
    imageWidth: number, 
    imageHeight: number
): YOLODetection[] {
    return detections.filter(detection => {
        const [x1, y1, x2, y2] = detection.bbox;
        const [cx, cy] = detection.center_point;
        
        // Check if bounding box is within image bounds
        const validBbox = x1 >= 0 && y1 >= 0 && x2 <= imageWidth && y2 <= imageHeight && x1 < x2 && y1 < y2;
        
        // Check if center point is within image bounds
        const validCenter = cx >= 0 && cy >= 0 && cx < imageWidth && cy < imageHeight;
        
        return validBbox && validCenter;
    });
}

/**
 * Prepare SAM batch processing input
 */
export function prepareSAMBatch(
    detections: YOLODetection[],
    originalImagePath: string,
    outputDirectory: string
): SAMInput[] {
    const samInputs = convertYOLOToSAMPrompts(detections);
    
    return samInputs.map((input, index) => ({
        ...input,
        image_path: originalImagePath,
        output_path: `${outputDirectory}/sam_output_${index}_${input.detection_metadata?.class_name}.png`
    }));
}