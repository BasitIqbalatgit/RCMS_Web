import sys
import cv2
import json
import numpy as np
from segment_anything import SamPredictor, sam_model_registry
import torch
import os

# Path to the SAM model
SAM_MODEL_PATH = 'sam_vit_l_0b3195.pth'

def process_image(image_path, detections, output_dir, predictor):
    """
    Process a single image with multiple detections
    """
    print(f"Processing image: {image_path}")
    
    # Load image
    print("Loading image...")
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image from {image_path}")
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    print(f"Image loaded successfully, shape: {image.shape}")
    
    # Save original image
    original_path = os.path.join(output_dir, 'original.jpg')
    cv2.imwrite(original_path, image)
    
    # Create a copy of the original image for the modified version
    modified_image = image.copy()
    
    # Set image for SAM
    print("Setting image in SAM predictor...")
    predictor.set_image(image_rgb)
    print("Image set in predictor")
    
    print(f"Processing {len(detections)} detections")
    segmented_parts = []
    combined_mask = np.zeros(image.shape[:2], dtype=bool)
    
    for i, detection in enumerate(detections):
        print(f"\nProcessing detection {i+1}/{len(detections)}")
        class_name = detection['class_name']
        center_point = np.array([detection['center_point']])
        bbox = detection['bbox']
        
        print(f"Class: {class_name}")
        print(f"Center point: {center_point}")
        print(f"Bounding box: {bbox}")
        
        # Use both point and box prompts for better segmentation
        print("Running SAM prediction...")
        masks, scores, logits = predictor.predict(
            point_coords=center_point,
            point_labels=np.array([1]),  # 1 for foreground point
            box=np.array(bbox),  # Add box prompt
            multimask_output=True,
        )
        print(f"Got {len(masks)} masks, best score: {max(scores):.3f}")
        
        # Choose the best mask (highest score)
        best_mask_idx = np.argmax(scores)
        mask = masks[best_mask_idx]
        
        # Verify mask is not empty
        mask_area = np.sum(mask)
        print(f"Mask area: {mask_area} pixels")
        if mask_area < 100:  # If mask is too small, it might be invalid
            print(f"Warning: Mask for {class_name} is very small, might be invalid")
            continue
        
        # Add to combined mask
        combined_mask = np.logical_or(combined_mask, mask)
        
        # Create masked image for this part
        masked_image = image.copy()
        masked_image[~mask] = 0  # Set background to black
        
        # Save individual segmented part
        part_filename = f"{class_name}_{i}_{detection['confidence']:.2f}.jpg"
        part_path = os.path.join(output_dir, part_filename)
        print(f"Saving segmented part to: {part_path}")
        cv2.imwrite(part_path, masked_image)
        
        # Also save just the mask
        mask_filename = f"{class_name}_{i}_mask.jpg"
        mask_path = os.path.join(output_dir, mask_filename)
        print(f"Saving mask to: {mask_path}")
        cv2.imwrite(mask_path, (mask * 255).astype(np.uint8))
        
        segmented_parts.append({
            "class_name": class_name,
            "confidence": detection['confidence'],
            "bbox": bbox,
            "center_point": detection['center_point'],
            "segmented_image_path": part_path,
            "mask_path": mask_path,
            "mask_area": int(mask_area)
        })
        print(f"Completed processing detection {i+1}")
    
    if not segmented_parts:
        print("Warning: No valid parts were segmented!")
        # If no parts were segmented, just copy the original image
        modified_image = image.copy()
    else:
        # Create modified image by removing segmented parts
        # Convert the combined mask to 3 channels
        mask_3channel = np.stack([combined_mask] * 3, axis=-1)
        # Set segmented areas to black in the modified image
        modified_image[mask_3channel] = 0
    
    # Save the modified image
    modified_path = os.path.join(output_dir, 'modified.jpg')
    print(f"\nSaving modified image to: {modified_path}")
    cv2.imwrite(modified_path, modified_image)
    
    # Save segmentation results
    results_path = os.path.join(output_dir, 'segmentation_results.json')
    print(f"Saving segmentation results to: {results_path}")
    with open(results_path, 'w') as f:
        json.dump(segmented_parts, f, indent=2)
    
    print(f"Successfully segmented {len(segmented_parts)} parts")
    return segmented_parts

def main():
    if len(sys.argv) != 2:
        print("Usage: python sam_segmentation.py <sam_input_json_path>", file=sys.stderr)
        sys.exit(1)

    sam_input_path = sys.argv[1]
    print(f"Reading SAM input from: {sam_input_path}")

    try:
        # Read SAM input configuration
        with open(sam_input_path, 'r') as f:
            sam_inputs = json.load(f)

        if not isinstance(sam_inputs, list):
            sam_inputs = [sam_inputs]  # Handle single input case

        # Group inputs by image path to avoid processing the same image multiple times
        image_groups = {}
        for sam_input in sam_inputs:
            image_path = sam_input['image_path']
            if image_path not in image_groups:
                image_groups[image_path] = []
            image_groups[image_path].append({
                'class_name': sam_input['detection_metadata']['class_name'],
                'confidence': sam_input['detection_metadata']['confidence'],
                'center_point': sam_input['prompts'][0]['data'],
                'bbox': sam_input['prompts'][1]['data']
            })

        print(f"Found {len(image_groups)} unique images to process")

        # Load SAM model once
        print("Loading SAM model...")
        sam = sam_model_registry["vit_l"](checkpoint=SAM_MODEL_PATH)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        sam.to(device=device)
        predictor = SamPredictor(sam)
        print("SAM model loaded successfully")

        # Process each unique image
        for image_path, detections in image_groups.items():
            output_dir = os.path.dirname(sam_inputs[0]['output_path'])
            os.makedirs(output_dir, exist_ok=True)

            # Save detections to a temporary JSON file
            detections_json_path = os.path.join(output_dir, 'temp_detections.json')
            with open(detections_json_path, 'w') as f:
                json.dump(detections, f)

            # Process the image with all its detections
            process_image(image_path, detections, output_dir, predictor)

            # Clear CUDA memory after each image if available
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        print("\nAll images processed successfully")
        sys.exit(0)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Clean up CUDA memory if available
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    main() 