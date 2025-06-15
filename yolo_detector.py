import sys
import cv2
import json
from ultralytics import YOLO
import numpy as np

# Path to the trained YOLOv8 model
YOLO_MODEL_PATH = 'car_parts_detector.pt'

# Detection parameters
CONFIDENCE_THRESHOLD = 0.25  # Increased from 0.1 for better accuracy
IOU_THRESHOLD = 0.45  # Slightly adjusted for better NMS
MIN_PART_SIZE = 20  # Minimum size of detected parts in pixels

def preprocess_image(image):
    """
    Preprocess image to improve detection accuracy
    """
    # Convert to RGB (YOLO expects RGB)
    if len(image.shape) == 2:  # If grayscale
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
    elif image.shape[2] == 4:  # If RGBA
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    elif image.shape[2] == 3 and image.dtype == np.uint8:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Normalize image
    image = image.astype(np.float32) / 255.0
    
    # Apply slight contrast enhancement
    mean = np.mean(image)
    std = np.std(image)
    if std > 0:
        image = (image - mean) / std * 0.2 + 0.5
        image = np.clip(image, 0, 1)
    
    # Convert back to uint8
    image = (image * 255).astype(np.uint8)
    
    return image

def filter_detections(detections, min_size=MIN_PART_SIZE):
    """
    Filter out detections that are too small or have low confidence
    """
    filtered = []
    for det in detections:
        # Calculate part size
        x1, y1, x2, y2 = det['bbox']
        width = x2 - x1
        height = y2 - y1
        
        # Filter based on size and confidence
        if (width >= min_size and height >= min_size and 
            det['confidence'] >= CONFIDENCE_THRESHOLD):
            filtered.append(det)
    
    return filtered

def debug_detection(input_path, output_path, json_output_path):
    """
    Debug version with detailed logging and improved detection
    """
    try:
        # Load the YOLOv8 model
        print(f"Loading YOLO model from: {YOLO_MODEL_PATH}")
        model = YOLO(YOLO_MODEL_PATH)
        
        # Print model info
        print(f"Model classes: {model.names}")
        print(f"Number of classes: {len(model.names)}")
        
        # Read and preprocess the input image
        print(f"Loading image from: {input_path}")
        image = cv2.imread(input_path)
        if image is None:
            raise ValueError("Failed to load input image")
        
        print(f"Original image shape: {image.shape}")
        
        # Preprocess image
        processed_image = preprocess_image(image)
        print(f"Preprocessed image shape: {processed_image.shape}")
        
        # Perform inference with optimized parameters
        print("Running inference...")
        results = model(processed_image, 
                       conf=CONFIDENCE_THRESHOLD, 
                       iou=IOU_THRESHOLD,
                       verbose=True)
        
        # Print raw results info
        print(f"Number of results: {len(results)}")
        
        detected_parts = []
        
        for idx, result in enumerate(results):
            print(f"Processing result {idx}")
            boxes = result.boxes
            
            if boxes is not None:
                print(f"Number of boxes detected: {len(boxes)}")
                
                for i, box in enumerate(boxes):
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    
                    # Calculate center point for SAM prompt
                    center_x = int((x1 + x2) / 2)
                    center_y = int((y1 + y2) / 2)
                    
                    # Get class name and confidence
                    class_id = int(box.cls[0].cpu().numpy())
                    confidence = float(box.conf[0].cpu().numpy())
                    class_name = model.names[class_id] if class_id < len(model.names) else f"class_{class_id}"
                    
                    print(f"Detection {i}: {class_name} (conf: {confidence:.3f}) at [{x1:.1f}, {y1:.1f}, {x2:.1f}, {y2:.1f}]")
                    
                    detected_parts.append({
                        "class_name": class_name,
                        "confidence": confidence,
                        "bbox": [float(x1), float(y1), float(x2), float(y2)],
                        "center_point": [center_x, center_y]
                    })
            else:
                print("No boxes detected in this result")
        
        # Filter detections
        filtered_parts = filter_detections(detected_parts)
        print(f"Total detected parts before filtering: {len(detected_parts)}")
        print(f"Total detected parts after filtering: {len(filtered_parts)}")
        
        # Save detection results as JSON with metadata
        output_data = {
            "detections": filtered_parts,
            "metadata": {
                "image_dimensions": {
                    "width": image.shape[1],
                    "height": image.shape[0]
                },
                "detection_parameters": {
                    "confidence_threshold": CONFIDENCE_THRESHOLD,
                    "iou_threshold": IOU_THRESHOLD,
                    "min_part_size": MIN_PART_SIZE
                },
                "model_info": {
                    "classes": model.names,
                    "num_classes": len(model.names)
                }
            }
        }
        
        with open(json_output_path, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        # Create annotated image
        if len(results) > 0:
            # Use original image for visualization
            annotated_image = results[0].plot(img=image)
            cv2.imwrite(output_path, annotated_image)
        else:
            # If no detections, save original image with text overlay
            annotated_image = image.copy()
            cv2.putText(annotated_image, "No detections found", (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imwrite(output_path, annotated_image)
        
        return filtered_parts
        
    except Exception as e:
        print(f"Error in debug_detection: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def test_with_pretrained_model(input_path):
    """
    Test with a pretrained YOLOv8 model to see if general object detection works
    """
    try:
        print("\n--- Testing with pretrained YOLOv8 model ---")
        # Use pretrained model
        model = YOLO('yolov8n.pt')  # This will download if not present
        
        image = cv2.imread(input_path)
        results = model(image, conf=0.3)
        
        print("Pretrained model detections:")
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0].cpu().numpy())
                    confidence = float(box.conf[0].cpu().numpy())
                    class_name = model.names[class_id]
                    print(f"  {class_name}: {confidence:.3f}")
            else:
                print("  No detections with pretrained model")
                
    except Exception as e:
        print(f"Error testing pretrained model: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python debug_yolo.py <input_image_path> <output_image_path> <json_output_path>")
        sys.exit(1)
    
    input_image_path = sys.argv[1]
    output_image_path = sys.argv[2]
    json_output_path = sys.argv[3]
    
    try:
        # Test with your custom model
        detected_parts = debug_detection(input_image_path, output_image_path, json_output_path)
        
        # Also test with pretrained model for comparison
        test_with_pretrained_model(input_image_path)
        
        print(f"\nFinal result: Detected {len(detected_parts)} parts")
        
        if len(detected_parts) == 0:
            print("\nPossible issues:")
            print("1. Custom model might not be trained properly")
            print("2. Image might not contain the car parts your model was trained on")
            print("3. Confidence threshold might be too high")
            print("4. Model file might be corrupted")
            print("5. Image preprocessing might be needed")
        
        sys.exit(0)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)