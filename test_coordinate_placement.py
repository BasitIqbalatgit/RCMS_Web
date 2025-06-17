#!/usr/bin/env python3
"""
Test script to demonstrate the new coordinate-based placement approach:
1. Place reference image at exact coordinates (no resizing)
2. Resize to fit the bounding box
"""

import json
import cv2
import numpy as np
import os
from stitching import stitch_part_simple, load_image

def test_coordinate_placement():
    """
    Test the new coordinate placement approach with a sample JSON file.
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
        
        print("=== Testing Coordinate-Based Placement ===")
        print(f"Base image: {data['segmentedImage']}")
        print(f"Number of references: {len(data['references'])}")
        print(f"Number of segmented parts: {len(data['segmentedParts'])}")
        
        # Load base image
        base_img = load_image(data['segmentedImage'])
        if base_img is None:
            print("Could not load base image")
            return
        
        print(f"Base image shape: {base_img.shape}")
        
        # Test with first reference
        if data['references']:
            ref = data['references'][0]
            print(f"\nTesting with reference: {ref['className']}")
            
            # Find matching segmented part
            segmented_part = None
            for part in data['segmentedParts']:
                if part['class_name'] == ref['className']:
                    segmented_part = part
                    break
            
            if segmented_part:
                print(f"Found segmented part: {segmented_part}")
                
                # Load reference image
                ref_img = load_image(ref['imagePath'])
                if ref_img is not None:
                    print(f"Reference image shape: {ref_img.shape}")
                    
                    # Test the new placement approach
                    result_img = stitch_part_simple(base_img.copy(), ref_img, segmented_part)
                    
                    # Save test result
                    test_output = "test_coordinate_placement_result.jpg"
                    cv2.imwrite(test_output, result_img)
                    print(f"Test result saved to: {test_output}")
                    
                    # Show coordinates used
                    x, y, w, h = segmented_part['x'], segmented_part['y'], segmented_part['w'], segmented_part['h']
                    print(f"Coordinates used:")
                    print(f"  x: {x}, y: {y}")
                    print(f"  width: {w}, height: {h}")
                    print(f"  Reference image: {ref_img.shape[1]}x{ref_img.shape[0]}")
                    print(f"  Target area: {w}x{h}")
                else:
                    print("Could not load reference image")
            else:
                print(f"No segmented part found for {ref['className']}")
        
        print("\n=== Test completed ===")
        
    except Exception as e:
        print(f"Test error: {str(e)}")

if __name__ == "__main__":
    test_coordinate_placement() 