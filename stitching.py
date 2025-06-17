import json
import sys
import os
import cv2
import numpy as np

def load_image(path):
    if path.startswith('/'):
        path = path[1:]
    abs_path = os.path.join(os.getcwd(), 'public', path)
    img = cv2.imread(abs_path)
    if img is None:
        raise ValueError(f"Could not load image: {abs_path}")
    if img.size == 0:
        raise ValueError(f"Loaded image is empty: {abs_path}")
    return img

def get_segmented_part_info(segmentedParts, className):
    """Get the coordinates and dimensions from the segmented part."""
    for part in segmentedParts:
        if part['class_name'] == className:
            # Extract coordinates from the segmented part
            return {
                'x': part['x'],
                'y': part['y'],
                'w': part['w'],
                'h': part['h'],
                'angle': part.get('angle', 0)  # Default to 0 if angle not provided
            }
    return None

def analyze_segmented_part(base_img, x, y, w, h):
    """Analyze the segmented part in the base image to get its properties."""
    try:
        # Extract the ROI from base image
        roi = base_img[int(y):int(y+h), int(x):int(x+w)]
        if roi.size == 0:
            raise ValueError("Empty ROI")
            
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Find contours to get the actual part shape
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            raise ValueError("No contours found in segmented part")
            
        # Get the largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Get rotated rectangle
        rect = cv2.minAreaRect(largest_contour)
        box = cv2.boxPoints(rect)
        box = np.array(box, dtype=np.int32)
        
        # Get angle and dimensions
        angle = rect[2]
        width = rect[1][0]
        height = rect[1][1]
        
        # Adjust angle to be between -90 and 0 degrees
        if width < height:
            angle = angle + 90
            width, height = height, width
            
        print(f"Analyzed part properties:")
        print(f"  Original dimensions: {w}x{h}")
        print(f"  Actual dimensions: {width:.1f}x{height:.1f}")
        print(f"  Angle: {angle:.1f} degrees")
        print(f"  Box points: {box.tolist()}")
        
        return {
            'width': width,
            'height': height,
            'angle': angle,
            'contour': largest_contour,
            'box': box
        }
        
    except Exception as e:
        print(f"Error analyzing segmented part: {str(e)}")
        print(f"ROI shape: {roi.shape if 'roi' in locals() else 'Not created'}")
        print(f"Binary shape: {binary.shape if 'binary' in locals() else 'Not created'}")
        print(f"Number of contours: {len(contours) if 'contours' in locals() else 'Not found'}")
        raise

def prepare_reference_image(ref_img, target_width, target_height, angle):
    """Prepare reference image to fit within the segmented part coordinates while maintaining aspect ratio."""
    try:
        ref_height, ref_width = ref_img.shape[:2]
        
        # Calculate aspect ratios
        ref_aspect = ref_width / ref_height
        target_aspect = target_width / target_height
        
        # Calculate scaling to fit within target dimensions while preserving aspect ratio
        if ref_aspect > target_aspect:
            # Reference is wider than target, fit to width
            scale = target_width / ref_width
            new_width = target_width
            new_height = int(ref_height * scale)
        else:
            # Reference is taller than target, fit to height
            scale = target_height / ref_height
            new_height = target_height
            new_width = int(ref_width * scale)
        
        # Resize image maintaining aspect ratio
        resized = cv2.resize(ref_img, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Create canvas of target size
        canvas = np.zeros((target_height, target_width, 3), dtype=np.uint8)
        
        # Calculate centering offsets
        x_offset = (target_width - new_width) // 2
        y_offset = (target_height - new_height) // 2
        
        # Place resized image in center of canvas
        canvas[y_offset:y_offset+new_height, x_offset:x_offset+new_width] = resized
        
        # Apply rotation if needed
        if abs(angle) > 1:  # Only rotate if angle is meaningful
            center = (target_width // 2, target_height // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            canvas = cv2.warpAffine(canvas, rotation_matrix, (target_width, target_height))
        
        print(f"Reference image prepared:")
        print(f"  Original size: {ref_width}x{ref_height}")
        print(f"  Scaled size: {new_width}x{new_height}")
        print(f"  Target size: {target_width}x{target_height}")
        print(f"  Scale factor: {scale:.3f}")
        print(f"  Centering offsets: ({x_offset}, {y_offset})")
        print(f"  Rotation angle: {angle:.1f} degrees")
        
        return canvas
        
    except Exception as e:
        print(f"Error preparing reference image: {str(e)}")
        raise

def stitch_part(base_img, reference_img, part_info):
    try:
        base_height, base_width = base_img.shape[:2]
        ref_height, ref_width = reference_img.shape[:2]
        
        # Extract exact coordinates and dimensions from segmented part
        x = float(part_info['x'])
        y = float(part_info['y'])
        w = float(part_info['w'])
        h = float(part_info['h'])
        
        # Calculate target dimensions
        target_width = int(w)
        target_height = int(h)
        
        print(f"Stitching dimensions:")
        print(f"  Base image: {base_width}x{base_height}")
        print(f"  Reference image: {ref_width}x{ref_height}")
        print(f"  Segmented part: {w}x{h} at ({x}, {y})")
        print(f"  Target size: {target_width}x{target_height}")
        
        # Prepare reference image to fit within segmented part
        prepared_ref = prepare_reference_image(
            reference_img, 
            target_width, 
            target_height,
            part_info.get('angle', 0)
        )
        
        # Ensure coordinates are within bounds
        x = min(max(0, int(x)), base_width - target_width)
        y = min(max(0, int(y)), base_height - target_height)
        
        # Create ROI with exact dimensions
        roi = base_img[y:y+target_height, x:x+target_width]
        if roi.size == 0:
            raise ValueError(f"ROI is empty at ({x}, {y}) with size {target_width}x{target_height}")
        
        # Create a mask for blending
        mask = np.zeros((target_height, target_width), dtype=np.float32)
        cv2.rectangle(mask, (0, 0), (target_width, target_height), 1.0, -1)
        mask = cv2.GaussianBlur(mask, (15, 15), 10)  # Larger kernel for smoother edges
        
        # Convert images to float32 for blending
        roi_float = roi.astype(np.float32)
        ref_float = prepared_ref.astype(np.float32)
        
        # Blend using the mask
        blended = np.zeros_like(roi_float)
        for c in range(3):  # Blend each channel separately
            blended[..., c] = roi_float[..., c] * (1 - mask) + ref_float[..., c] * mask
        
        # Convert back to uint8 and ensure values are in valid range
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        
        # Place blended result back into base image
        base_img[y:y+target_height, x:x+target_width] = blended
        
        return base_img
        
    except Exception as e:
        print(f"Error in stitch_part: {str(e)}")
        raise

def stitch_images(base_image_path, references, segmented_parts):
    try:
        print("Loading base image...")
        base_img = cv2.imread(base_image_path)
        if base_img is None:
            raise ValueError(f"Failed to load base image: {base_image_path}")
        print(f"Base image loaded. Shape: {base_img.shape}")
        
        for ref in references:
            part_class = ref['className']
            ref_path = ref['imagePath']
            
            part_info = next((p for p in segmented_parts if p['class_name'] == part_class), None)
            if not part_info:
                print(f"Warning: No segmented part found for {part_class}")
                continue
            
            print(f"\nProcessing {part_class}...")
            print(f"Loading reference image: {ref_path}")
            ref_img = cv2.imread(ref_path)
            if ref_img is None:
                raise ValueError(f"Failed to load reference image: {ref_path}")
            
            # Stitch the prepared image
            base_img = stitch_part(base_img, ref_img, part_info)
            print(f"Successfully stitched {part_class}")
        
        return base_img
    except Exception as e:
        print(f"\nStitching failed: {str(e)}")
        raise
        
def main():
    try:
        # Read input
        if len(sys.argv) != 2:
            raise ValueError("Input JSON path required")
        
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)
        
        # Load base image
        print("Loading base image...")
        base_img = load_image(data['segmentedImage'])
        print(f"Base image loaded. Shape: {base_img.shape}")
        
        # Process each reference
        for ref in data['references']:
            print(f"\nProcessing {ref['className']}...")
            
            # Find matching segmented part
            segmented_part = None
            for part in data['segmentedParts']:
                if part['class_name'] == ref['className']:
                    segmented_part = part
                    break
            
            if not segmented_part:
                print(f"Warning: No segmented part found for {ref['className']}")
                continue
            
            # Get coordinates from segmented part
            info = {
                'x': segmented_part['x'],
                'y': segmented_part['y'],
                'w': segmented_part['w'],
                'h': segmented_part['h'],
                'angle': segmented_part.get('angle', 0)
            }
            
            print(f"Loading reference image: {ref['imagePath']}")
            ref_img = load_image(ref['imagePath'])
            print(f"Reference image loaded. Shape: {ref_img.shape}")
            print(f"Using segmented part coordinates: {info}")
            
            base_img = stitch_part(base_img, ref_img, info)
            print("Part stitched successfully")
        
        # Save result
        output_dir = os.path.join(os.getcwd(), 'public', data['outputDir'].lstrip('/'))
        os.makedirs(output_dir, exist_ok=True)
        
        result_path = os.path.join(output_dir, 'result.jpg')
        print(f"\nSaving result to: {result_path}")
        cv2.imwrite(result_path, base_img)
        
        # Save output
        output = {
            'success': True,
            'stitchedImageUrl': f"{data['outputDir']}/result.jpg"
        }
        
        with open(os.path.join(output_dir, 'output.json'), 'w') as f:
            json.dump(output, f)
        
        print("Stitching complete")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        if 'data' in locals():
            output_dir = os.path.join(os.getcwd(), 'public', data['outputDir'].lstrip('/'))
            with open(os.path.join(output_dir, 'output.json'), 'w') as f:
                json.dump({'success': False, 'error': str(e)}, f)
        sys.exit(1)

if __name__ == '__main__':
    main() 