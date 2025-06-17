#!/usr/bin/env python3
"""
Simple test to check if stitching function works correctly.
"""

import json
import cv2
import numpy as np
import os
from stitching import stitch_part_with_bounding_box_fit, load_image

def test_simple_stitching():
    """
    Test the stitching function with simple data.
    """
    try:
        print("=== Simple Stitching Test ===")
        
        # Create a simple test image
        base_img = np.ones((150, 194, 3), dtype=np.uint8) * 128  # Gray image
        print(f"Created base image: {base_img.shape}")
        
        # Create a simple reference image
        ref_img = np.ones((100, 100, 3), dtype=np.uint8) * 255  # White image
        print(f"Created reference image: {ref_img.shape}")
        
        # Create test part info
        part_info = {
            'x': 50.0,
            'y': 25.0,
            'w': 80.0,
            'h': 60.0
        }
        
        print(f"Test part info: {part_info}")
        
        # Test the function
        result = stitch_part_with_bounding_box_fit(
            base_img, 
            ref_img, 
            part_info, 
            "test_output", 
            "test_part"
        )
        
        print(f"Function completed successfully!")
        print(f"Result shape: {result.shape}")
        
        # Save test result
        cv2.imwrite("test_simple_result.jpg", result)
        print("Test result saved to: test_simple_result.jpg")
        
        return True
        
    except Exception as e:
        print(f"Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_simple_stitching()
    if success:
        print("✅ Test passed!")
    else:
        print("❌ Test failed!") 