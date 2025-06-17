export interface SegmentedPart {
  class_name: string;
  confidence: number;
  segmented_image_path: string;
  mask_path: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SegmentedResult {
  segmentedImageUrl: string;
  segmentedParts: SegmentedPart[];
}

export interface PartDetection {
  class_name: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SelectedReferenceImage {
  className: string;
  imagePath: string;
} 