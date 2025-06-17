import cv2
import numpy as np
import json
import sys
import os

def load_image(path):
    if path.startswith('/'):
        path = path[1:]
    abs_path = os.path.join(os.getcwd(), 'public', path)
    img = cv2.imread(abs_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Could not load image: {abs_path}")
    if img.size == 0:
        raise ValueError(f"Loaded image is empty: {abs_path}")
    return img

def get_segmented_part_info(segmentedParts, className):
    """Get the coordinates and dimensions from the segmented part."""
    for part in segmentedParts:
        if part['class_name'] == className:
            return {
                'x': part['x'],
                'y': part['y'],
                'w': part['w'],
                'h': part['h'],
                'angle': part.get('angle', 0)
            }
    return None

def resize_with_aspect_ratio(image, target_width, target_height):
    """Resize image while preserving aspect ratio, centering it in the target dimensions."""
    h, w = image.shape[:2]
    aspect = w / h
    target_aspect = target_width / target_height
    
    if aspect > target_aspect:
        new_width = target_width
        new_height = int(target_width / aspect)
    else:
        new_height = target_height
        new_width = int(target_height * aspect)
    
    resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((target_height, target_width, image.shape[2]), dtype=np.uint8)
    x_offset = (target_width - new_width) // 2
    y_offset = (target_height - new_height) // 2
    canvas[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = resized
    
    print(f"Resized image: original {w}x{h}, new {new_width}x{new_height}, placed at offsets ({x_offset}, {y_offset})")
    return canvas

def create_foreground_mask(image):
    """Create a foreground mask using GrabCut and HSV thresholding."""
    try:
        # Initialize GrabCut
        mask = np.zeros(image.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        rect = (5, 5, image.shape[1]-5, image.shape[0]-5)
        cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
        grabcut_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype(np.uint8)
        
        # HSV-based mask for white/light gray backgrounds
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        white_lower = np.array([0, 0, 200])
        white_upper = np.array([180, 30, 255])
        white_mask = cv2.inRange(hsv, white_lower, white_upper)
        light_gray_lower = np.array([0, 0, 180])
        light_gray_upper = np.array([180, 20, 220])
        light_gray_mask = cv2.inRange(hsv, light_gray_lower, light_gray_upper)
        background_mask = cv2.bitwise_or(white_mask, light_gray_mask)
        hsv_mask = cv2.bitwise_not(background_mask) // 255
        
        # Combine masks
        combined_mask = cv2.bitwise_and(grabcut_mask, hsv_mask)
        
        # Clean up mask
        kernel = np.ones((3,3), np.uint8)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
        combined_mask = cv2.GaussianBlur(combined_mask, (5, 5), 0)
        
        return combined_mask
    except Exception as e:
        print(f"Error creating foreground mask: {str(e)}")
        raise

def stitch_part_with_bounding_box_fit(base_img, reference_img, part_info, output_dir, class_name, scale_factor=0.5, target_aspect=4/3):
    """
    Place reference image using exact bounding box dimensions from segmentation coordinates.
    Uses the width and height from the bounding box, scaled by scale_factor, and adjusts to match target_aspect.
    """
    try:
        base_height, base_width = base_img.shape[:2]
        ref_height, ref_width = reference_img.shape[:2]
        
        # Extract exact bounding box coordinates and dimensions from segmented part
        bbox_x = float(part_info['x'])
        bbox_y = float(part_info['y'])
        bbox_width = float(part_info['w'])
        bbox_height = float(part_info['h'])
        
        print(f"Bounding Box Analysis:")
        print(f"  Base image: {base_width}x{base_height}")
        print(f"  Reference image: {ref_width}x{ref_height}")
        print(f"  Bounding box: x={bbox_x}, y={bbox_y}, w={bbox_width}, h={bbox_height}")
        
        # Calculate the scaled bounding box dimensions
        target_width = int(bbox_width * scale_factor)
        target_height = int(bbox_height * scale_factor)
        
        # Apply headlight-specific adjustments before general aspect ratio adjustment
        if class_name == "Headlight - -L-":
            # For left headlight, use different scaling and positioning
            # Since left headlight has more width/height, use a smaller scale factor
            left_scale_factor = scale_factor * 0.6  # Reduce scale by 20% for left headlight
            target_width = int(bbox_width * left_scale_factor)
            target_height = int(bbox_height * left_scale_factor)
            
            # Preserve aspect ratio of the left headlight image
            left_aspect = ref_width / ref_height
            if target_width / target_height > left_aspect:
                target_width = int(target_height * left_aspect)
            else:
                target_height = int(target_width / left_aspect)
            
            print(f"  Left headlight: scale={left_scale_factor:.2f}, size={target_width}x{target_height}")
            
        elif class_name == "Headlight - -R-":
            # For right headlight, use different scaling and positioning
            # Since right headlight is smaller, use a larger scale factor
            right_scale_factor = scale_factor * 1.2  # Increase scale by 20% for right headlight
            target_width = int(bbox_width * right_scale_factor)
            target_height = int(bbox_height * right_scale_factor)
            
            # Preserve aspect ratio of the right headlight image
            right_aspect = ref_width / ref_height
            if target_width / target_height > right_aspect:
                target_width = int(target_height * right_aspect)
            else:
                target_height = int(target_width / right_aspect)
            
            print(f"  Right headlight: scale={right_scale_factor:.2f}, size={target_width}x{target_height}")
        else:
            # For other parts, use the general aspect ratio adjustment
            if target_width / target_height > target_aspect:
                # Too wide: reduce width to match aspect ratio
                target_width = int(target_height * target_aspect)
            else:
                # Too tall: reduce height to match aspect ratio
                target_height = int(target_width / target_aspect)
        
        print(f"  Target bounding box (scaled by {scale_factor}, adjusted to aspect): {target_width}x{target_height}")
        
        # Check if bounding box fits within image bounds
        if bbox_x + target_width > base_width:
            print(f"  Warning: Scaled bounding box extends beyond image width")
            # Adjust x to keep bounding box within image
            adjusted_x = max(0, base_width - target_width)
            print(f"  Adjusted x from {bbox_x} to {adjusted_x}")
        else:
            adjusted_x = int(bbox_x)
            
        if bbox_y + target_height > base_height:
            print(f"  Warning: Scaled bounding box extends beyond image height")
            # Adjust y to keep bounding box within image
            adjusted_y = max(0, base_height - target_height)
            print(f"  Adjusted y from {bbox_y} to {adjusted_y}")
        else:
            adjusted_y = int(bbox_y)
        
        # Ensure coordinates are non-negative
        adjusted_x = max(0, adjusted_x)
        adjusted_y = max(0, adjusted_y)
        
        # Apply position adjustments based on part class
        if class_name == "Headlight - -L-":
            # Adjust positioning for left headlight
            adjusted_x = max(0, adjusted_x - 0)  # Move more to the left
            adjusted_y = max(0, adjusted_y + 2)   # Move slightly up
            print(f"  Left headlight position adjusted: ({adjusted_x}, {adjusted_y})")
            
        elif class_name == "Headlight - -R-":
            # Adjust positioning for right headlight
            adjusted_x = min(base_width - target_width, adjusted_x + 0)  # Move slightly to the right
            adjusted_y = max(0, adjusted_y + 1)   # Move slightly down
            print(f"  Right headlight position adjusted: ({adjusted_x}, {adjusted_y})")
        
        # Re-check bounds after adjustments
        if adjusted_x + target_width > base_width:
            adjusted_x = max(0, base_width - target_width)
        if adjusted_y + target_height > base_height:
            adjusted_y = max(0, base_height - target_height)
        
        print(f"  Final placement: ({adjusted_x}, {adjusted_y}) with scaled bounding box {target_width}x{target_height}")
        
        # Step 1: Resize reference image to fit the scaled bounding box dimensions
        print(f"  Resizing reference image from {ref_width}x{ref_height} to {target_width}x{target_height}")
        resized_ref = cv2.resize(reference_img, (target_width, target_height), interpolation=cv2.INTER_AREA)

        # Handle transparency for PNG images
        if resized_ref.shape[2] == 4:
            # PNG with alpha channel - use proper alpha blending
            print(f"  Processing PNG with transparency using alpha blending")
            
            # Extract alpha channel and normalize it
            alpha = resized_ref[:, :, 3].astype(np.float32) / 255.0
            
            # Convert RGBA to BGR for processing
            resized_ref_bgr = cv2.cvtColor(resized_ref, cv2.COLOR_RGBA2BGR)
            
            # Create a copy of the base image
            result_img = base_img.copy()
            
            # Extract the bounding box region from base image
            bbox_region = result_img[adjusted_y:adjusted_y+target_height, adjusted_x:adjusted_x+target_width]
            
            # Convert regions to float for blending
            bbox_region_float = bbox_region.astype(np.float32)
            ref_region_float = resized_ref_bgr.astype(np.float32)
            
            # Convert alpha to 3-channel for blending
            alpha_3ch = np.stack([alpha, alpha, alpha], axis=2)
            
            # Blend using alpha: result = background * (1 - alpha) + foreground * alpha
            blended = bbox_region_float * (1 - alpha_3ch) + ref_region_float * alpha_3ch
            
            # Convert back to uint8 and ensure values are in valid range
            blended = np.clip(blended, 0, 255).astype(np.uint8)
            
            # Place the blended result back into the base image
            result_img[adjusted_y:adjusted_y+target_height, adjusted_x:adjusted_x+target_width] = blended
            
            print(f"  Successfully placed PNG with transparency using alpha blending")
            
        else:
            # No transparency - use direct placement
            print(f"  Using full reference image without transparency")
            
            # Convert to BGR if needed
            if resized_ref.shape[2] == 1:
                # Grayscale to BGR
                resized_ref = cv2.cvtColor(resized_ref, cv2.COLOR_GRAY2BGR)
            elif resized_ref.shape[2] == 3:
                # Already 3 channels, ensure it's BGR
                print(f"  Image already has 3 channels")
            
            # Create a copy of the base image
            result_img = base_img.copy()
            
            # Place the reference image directly into the bounding box region
            result_img[adjusted_y:adjusted_y+target_height, adjusted_x:adjusted_x+target_width] = resized_ref
            
            print(f"  Successfully placed reference image without background removal")
        
        return result_img
        
    except Exception as e:
        print(f"Error in stitch_part_with_bounding_box_fit: {str(e)}")
        raise

def main():
    try:
        # Read input
        if len(sys.argv) != 2:
            raise ValueError("Input JSON path required")
        
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)
        
        # Load base image
        print("Loading segmented base image...")
        base_img = load_image(data['segmentedImage'])
        print(f"Base image loaded. Shape: {base_img.shape}")
        
        # Process each reference image
        for ref in data['references']:
            print(f"\nProcessing {ref['className']}...")
            
            # Find matching segmented part
            segmented_part = get_segmented_part_info(data['segmentedParts'], ref['className'])
            if not segmented_part:
                print(f"Warning: No segmented part found for {ref['className']}")
                continue
            
            # Load reference image
            ref_img = load_image(ref['imagePath'])
            if ref_img is None:
                print(f"Warning: Could not load reference image for {ref['className']}")
                continue
            
            print(f"Reference image loaded. Shape: {ref_img.shape}")
            
            # Stitch the reference image with scaling
            # Use adaptive scaling based on part size
            part_area = segmented_part['w'] * segmented_part['h']
            base_area = base_img.shape[0] * base_img.shape[1]
            area_ratio = part_area / base_area
            
            # Adaptive scaling: larger parts get smaller scale factors
            if area_ratio > 0.1:  # Large parts (>10% of base image)
                scale_factor = 0.4
            elif area_ratio > 0.05:  # Medium parts (5-10% of base image)
                scale_factor = 0.6
            else:  # Small parts (<5% of base image)
                scale_factor = 0.8
            
            # Additional adjustment for very small parts to make them more visible
            if area_ratio < 0.2:  # Parts smaller than 20% of base image
                scale_factor = min(1.0, scale_factor * 1.5)  # Increase scale by 50% but cap at 100%
            
            print(f"  Part area ratio: {area_ratio:.3f}, using scale factor: {scale_factor}")
            
            base_img = stitch_part_with_bounding_box_fit(base_img, ref_img, segmented_part, data['outputDir'].lstrip('/'), ref['className'], scale_factor=scale_factor)
        
        # Save the final stitched image
        output_dir = os.path.join(os.getcwd(), 'public', data['outputDir'].lstrip('/'))
        os.makedirs(output_dir, exist_ok=True)
        
        result_path = os.path.join(output_dir, 'result.jpg')
        print(f"\nSaving stitched image to: {result_path}")
        cv2.imwrite(result_path, base_img)
        
        # Create output.json
        output_data = {
            'success': True,
            'stitchedImageUrl': f"{data['outputDir']}/result.jpg",
            'message': 'Reference images placed at exact segmented part coordinates with scaling'
        }
        
        output_json_path = os.path.join(output_dir, 'output.json')
        with open(output_json_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print("Stitching completed successfully!")
        print(f"Output saved to: {output_json_path}")
        
    except Exception as e:
        print(f"Error in main: {str(e)}")
        
        # Create error output file
        try:
            if 'data' in locals() and 'outputDir' in data:
                output_dir = os.path.join(os.getcwd(), 'public', data['outputDir'].lstrip('/'))
                os.makedirs(output_dir, exist_ok=True)
                
                error_output = {
                    'success': False,
                    'error': str(e)
                }
                
                output_json_path = os.path.join(output_dir, 'output.json')
                with open(output_json_path, 'w') as f:
                    json.dump(error_output, f, indent=2)
        except Exception as write_error:
            print(f"Failed to write error output: {write_error}")
        
        sys.exit(1)

if __name__ == '__main__':
    main()