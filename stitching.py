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
                'contour': part.get('mask_contour', [])
            }
    return None

def fit_to_mask(reference_img, contour, base_img_shape):
    """
    Resize and crop reference image to fit the mask contour.
    """
    try:
        # Get bounding rectangle of the contour to determine target size
        contour_np = np.array(contour)
        x, y, w, h = cv2.boundingRect(contour_np)
        
        # Create a mask from the contour
        mask = np.zeros(base_img_shape[:2], dtype=np.uint8)
        cv2.fillPoly(mask, [contour_np], 255)
        
        # Resize reference image to bounding rectangle size
        ref_h, ref_w = reference_img.shape[:2]
        resized_ref = cv2.resize(reference_img, (w, h), interpolation=cv2.INTER_AREA)
        
        # Create a canvas for the reference image
        canvas = np.zeros(base_img_shape[:2] + (reference_img.shape[2],), dtype=np.uint8)
        x_offset = x
        y_offset = y
        canvas[y_offset:y_offset+h, x_offset:x_offset+w] = resized_ref
        
        # Apply the contour mask to keep only the area within the contour
        if canvas.shape[2] == 4:  # RGBA
            alpha = canvas[:, :, 3] / 255.0
            canvas = cv2.cvtColor(canvas, cv2.COLOR_RGBA2BGR)
            alpha_3ch = np.stack([alpha, alpha, alpha], axis=2)
        else:
            alpha_3ch = np.stack([mask / 255.0, mask / 255.0, mask / 255.0], axis=2)
        
        # Mask the canvas to keep only the contour area
        masked_ref = canvas * alpha_3ch
        
        return masked_ref, x, y, alpha_3ch
    except Exception as e:
        print(f"Error in fit_to_mask: {str(e)}")
        raise

def stitch_part_with_mask(base_img, reference_img, part_info, output_dir, class_name):
    """
    Place reference image using the mask contour coordinates.
    """
    try:
        contour = part_info.get('contour', [])
        x = int(part_info['x'])
        y = int(part_info['y'])
        w = int(part_info['w'])
        h = int(part_info['h'])

        if contour and len(contour) >= 3:
            # Get bounding rect of the contour (in image coordinates)
            contour_np = np.array(contour)
            cx, cy, cw, ch = cv2.boundingRect(contour_np)
            # Shift contour to bounding rect origin
            shifted_contour = contour_np - [cx, cy]
            # Create mask for the contour region
            mask = np.zeros((ch, cw), dtype=np.uint8)
            cv2.fillPoly(mask, [shifted_contour.astype(np.int32)], 255)
            # Resize reference image to fit the contour bounding box
            resized_ref = cv2.resize(reference_img, (cw, ch), interpolation=cv2.INTER_AREA)
            # Prepare for alpha blending
            if resized_ref.shape[2] == 4:
                ref_rgb = cv2.cvtColor(resized_ref, cv2.COLOR_RGBA2BGR)
                alpha = resized_ref[:, :, 3].astype(np.float32) / 255.0
            else:
                ref_rgb = resized_ref
                alpha = np.ones((ch, cw), dtype=np.float32)
            mask_f = mask.astype(np.float32) / 255.0
            alpha = alpha * mask_f
            region = base_img[cy:cy+ch, cx:cx+cw].astype(np.float32)
            alpha_3ch = np.stack([alpha, alpha, alpha], axis=2)
            blended = region * (1 - alpha_3ch) + ref_rgb.astype(np.float32) * alpha_3ch
            blended = np.clip(blended, 0, 255).astype(np.uint8)
            result_img = base_img.copy()
            result_img[cy:cy+ch, cx:cx+cw] = blended
            return result_img

        # Fallback: just use bounding box
        resized_ref = cv2.resize(reference_img, (w, h), interpolation=cv2.INTER_AREA)
        result_img = base_img.copy()
        if resized_ref.shape[2] == 4:
            alpha = resized_ref[:, :, 3].astype(np.float32) / 255.0
            ref_rgb = cv2.cvtColor(resized_ref, cv2.COLOR_RGBA2BGR)
            bbox_region = result_img[y:y+h, x:x+w].astype(np.float32)
            ref_region = ref_rgb.astype(np.float32)
            alpha_3ch = np.stack([alpha, alpha, alpha], axis=2)
            blended = bbox_region * (1 - alpha_3ch) + ref_region * alpha_3ch
            blended = np.clip(blended, 0, 255).astype(np.uint8)
            result_img[y:y+h, x:x+w] = blended
        else:
            result_img[y:y+h, x:x+w] = resized_ref
        return result_img

    except Exception as e:
        print(f"Error in stitch_part_with_mask: {str(e)}")
        raise

def main():
    try:
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
            
            # Stitch using mask contour
            base_img = stitch_part_with_mask(base_img, ref_img, segmented_part, data['outputDir'].lstrip('/'), ref['className'])
        
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
            'message': 'Reference images placed using mask contours'
        }
        
        output_json_path = os.path.join(output_dir, 'output.json')
        with open(output_json_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print("Stitching completed successfully!")
        print(f"Output saved to: {output_json_path}")
        
    except Exception as e:
        print(f"Error in main: {str(e)}")
        output_dir = os.path.join(os.getcwd(), 'public', data['outputDir'].lstrip('/')) if 'data' in locals() else '.'
        os.makedirs(output_dir, exist_ok=True)
        error_output = {'success': False, 'error': str(e)}
        output_json_path = os.path.join(output_dir, 'output.json')
        with open(output_json_path, 'w') as f:
            json.dump(error_output, f, indent=2)
        sys.exit(1)

if __name__ == '__main__':
    main()