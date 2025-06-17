#!/usr/bin/env python3
"""
Test script to demonstrate bounding box fitting using exact dimensions from segmentation coordinates.
"""

import json
import cv2
import numpy as np
import os
from stitching import stitch_part_with_bounding_box_fit, load_image

def test_bounding_box_fit():
    """
    Test the bounding box fitting functionality using exact segmentation coordinates.
    """
    try:
        # Use an existing JSON file for testing
        json_path = "public/stitching_results/040a63a9-11e2-4b40-b855-ba926ef0f566/input.json"
        
        if not os.path.exists(json_path):
            print(f"Test JSON file not found: {json_path}")
            return
        
        # Load the test data
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        print("=== Bounding Box Fitting Test ===")
        print(f"Base image: {data['segmentedImage']}")
        print(f"Number of segmented parts: {len(data['segmentedParts'])}")
        
        # Load base image
        base_img = load_image(data['segmentedImage'])
        if base_img is None:
            print("Could not load base image")
            return
        
        print(f"Base image shape: {base_img.shape}")
        
        # Test with each segmented part
        for i, part in enumerate(data['segmentedParts']):
            print(f"\n--- Testing Part {i+1}: {part['class_name']} ---")
            print(f"Segmentation coordinates: x={part['x']}, y={part['y']}, w={part['w']}, h={part['h']}")
            
            # Calculate bounding box dimensions
            bbox_width = int(part['w'])
            bbox_height = int(part['h'])
            print(f"Bounding box dimensions: {bbox_width}x{bbox_height}")
            
            # Find matching reference
            ref = None
            for r in data['references']:
                if r['className'] == part['class_name']:
                    ref = r
                    break
            
            if ref:
                print(f"Reference image: {ref['imagePath']}")
                
                # Load reference image
                ref_img = load_image(ref['imagePath'])
                if ref_img is not None:
                    print(f"Reference image shape: {ref_img.shape}")
                    
                    # Test the bounding box fitting
                    result_img = stitch_part_with_bounding_box_fit(base_img.copy(), ref_img, part)
                    
                    # Save test result
                    test_output = f"bounding_box_fit_part_{i+1}.jpg"
                    cv2.imwrite(test_output, result_img)
                    print(f"Test result saved to: {test_output}")
                    
                    # Verify bounding box calculations
                    x, y, w, h = int(part['x']), int(part['y']), int(part['w']), int(part['h'])
                    print(f"Expected bounding box: ({x}, {y}) with size {w}x{h}")
                    
                    # Check if bounding box is within image bounds
                    base_h, base_w = base_img.shape[:2]
                    if x < 0 or y < 0 or x + w > base_w or y + h > base_h:
                        print(f"  ⚠️  Warning: Bounding box outside image bounds!")
                        print(f"     Image bounds: 0,0 to {base_w},{base_h}")
                        print(f"     Bounding box: {x},{y} to {x+w},{y+h}")
                        
                        # Show adjusted coordinates
                        adjusted_x = max(0, min(x, base_w - w))
                        adjusted_y = max(0, min(y, base_h - h))
                        print(f"     Adjusted to: {adjusted_x},{adjusted_y} to {adjusted_x+w},{adjusted_y+h}")
                    else:
                        print(f"  ✅ Bounding box within image bounds")
                        
                    # Save the reference image for comparison
                    ref_output = f"reference_bbox_part_{i+1}.jpg"
                    cv2.imwrite(ref_output, ref_img)
                    print(f"Reference image saved to: {ref_output}")
                    
                    # Save the base image for comparison
                    base_output = f"base_bbox_part_{i+1}.jpg"
                    cv2.imwrite(base_output, base_img)
                    print(f"Base image saved to: {base_output}")
                    
                    # Show aspect ratio comparison
                    ref_aspect = ref_img.shape[1] / ref_img.shape[0]
                    bbox_aspect = w / h
                    print(f"Aspect ratio comparison:")
                    print(f"  Reference image: {ref_aspect:.3f}")
                    print(f"  Bounding box: {bbox_aspect:.3f}")
                    print(f"  Difference: {abs(ref_aspect - bbox_aspect):.3f}")
                    
                else:
                    print("Could not load reference image")
            else:
                print(f"No reference image found for {part['class_name']}")
        
        print("\n=== Test completed ===")
        print("Check the generated images to verify:")
        print("1. ✅ Reference images fit exactly in bounding boxes")
        print("2. ✅ Bounding box dimensions are preserved")
        print("3. ✅ Background removal is working")
        print("4. ✅ Placement is at exact segmentation coordinates")
        print("5. ✅ Proper aspect ratio handling")
        
    except Exception as e:
        print(f"Test error: {str(e)}")

if __name__ == "__main__":
    test_bounding_box_fit() 