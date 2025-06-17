#!/usr/bin/env python3
"""
Test script to verify YOLO coordinate usage for reference image placement.
"""

import json
import cv2
import numpy as np
import os
from stitching import stitch_part_simple, load_image

def test_yolo_coordinates():
    """
    Test that YOLO coordinates are used correctly for placing reference images.
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
        
        print("=== Testing YOLO Coordinate Usage ===")
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
            print(f"YOLO coordinates: x={part['x']}, y={part['y']}, w={part['w']}, h={part['h']}")
            
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
                    
                    # Test the coordinate placement
                    result_img = stitch_part_simple(base_img.copy(), ref_img, part)
                    
                    # Save test result
                    test_output = f"test_yolo_coordinates_part_{i+1}.jpg"
                    cv2.imwrite(test_output, result_img)
                    print(f"Test result saved to: {test_output}")
                    
                    # Verify coordinates were used correctly
                    x, y, w, h = int(part['x']), int(part['y']), int(part['w']), int(part['h'])
                    print(f"Expected placement: ({x}, {y}) with size {w}x{h}")
                    
                    # Check if coordinates are within image bounds
                    base_h, base_w = base_img.shape[:2]
                    if x < 0 or y < 0 or x + w > base_w or y + h > base_h:
                        print(f"  ⚠️  Warning: Coordinates outside image bounds!")
                        print(f"     Image bounds: 0,0 to {base_w},{base_h}")
                        print(f"     Part bounds: {x},{y} to {x+w},{y+h}")
                    else:
                        print(f"  ✅ Coordinates within image bounds")
                else:
                    print("Could not load reference image")
            else:
                print(f"No reference image found for {part['class_name']}")
        
        print("\n=== Test completed ===")
        
    except Exception as e:
        print(f"Test error: {str(e)}")

if __name__ == "__main__":
    test_yolo_coordinates() 