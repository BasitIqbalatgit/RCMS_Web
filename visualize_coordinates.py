#!/usr/bin/env python3
"""
Visualization script to show how coordinates from segmentation are used
to place reference images on the segmented image.
"""

import json
import cv2
import numpy as np
import os

def visualize_coordinates(input_json_path):
    """
    Visualize the coordinates where parts were segmented and where reference images will be placed.
    """
    try:
        # Load the input data
        with open(input_json_path, 'r') as f:
            data = json.load(f)
        
        # Load the segmented base image
        base_img_path = os.path.join(os.getcwd(), 'public', data['segmentedImage'].lstrip('/'))
        base_img = cv2.imread(base_img_path)
        
        if base_img is None:
            print(f"Could not load base image: {base_img_path}")
            return
        
        # Create a copy for visualization
        vis_img = base_img.copy()
        
        print("=== COORDINATE VISUALIZATION ===")
        print(f"Base image: {base_img.shape[1]}x{base_img.shape[0]}")
        print()
        
        # Draw rectangles for each segmented part
        for i, part in enumerate(data['segmentedParts']):
            x, y, w, h = part['x'], part['y'], part['w'], part['h']
            
            # Convert to integers for drawing
            x1, y1 = int(x), int(y)
            x2, y2 = int(x + w), int(y + h)
            
            # Draw rectangle around segmented area
            cv2.rectangle(vis_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Add text label
            label = f"{part['class_name']} ({x1},{y1})"
            cv2.putText(vis_img, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            # Add coordinate info
            coord_text = f"w={int(w)}, h={int(h)}"
            cv2.putText(vis_img, coord_text, (x1, y2+20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)
            
            print(f"Part {i+1}: {part['class_name']}")
            print(f"  Coordinates: x={x:.1f}, y={y:.1f}, w={w:.1f}, h={h:.1f}")
            print(f"  Rectangle: ({x1}, {y1}) to ({x2}, {y2})")
            print(f"  Area: {int(w * h)} pixels")
            print()
        
        # Save visualization
        output_dir = os.path.dirname(input_json_path)
        vis_path = os.path.join(output_dir, 'coordinate_visualization.jpg')
        cv2.imwrite(vis_path, vis_img)
        
        print(f"Visualization saved to: {vis_path}")
        print("Green rectangles show where reference images will be placed")
        print("Coordinates are extracted from the segmentation process")
        
        return vis_path
        
    except Exception as e:
        print(f"Error in visualization: {str(e)}")
        return None

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python visualize_coordinates.py <input_json_path>")
        sys.exit(1)
    
    input_json = sys.argv[1]
    visualize_coordinates(input_json) 