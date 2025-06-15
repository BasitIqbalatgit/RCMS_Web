#!/usr/bin/env python3
"""
Standalone YOLO Test Script
Usage: python test_yolo.py <path_to_image>
"""

import sys
import cv2
import os
from ultralytics import YOLO
import numpy as np

def analyze_model_classes(model):
    """Analyze and print detailed information about the model's classes"""
    print("\n" + "=" * 60)
    print("MODEL CLASS ANALYSIS")
    print("=" * 60)
    
    if not model.names:
        print("❌ No class information available in the model")
        return
    
    print(f"📊 Total number of classes: {len(model.names)}")
    print("\nDetectable parts:")
    for class_id, class_name in model.names.items():
        print(f"  - {class_name} (ID: {class_id})")
    
    # Check for common car parts
    common_parts = [
        'headlight', 'taillight', 'bumper', 'hood', 'door', 'window', 
        'wheel', 'tire', 'grille', 'mirror', 'windshield', 'fender'
    ]
    
    print("\nCoverage of common car parts:")
    for part in common_parts:
        found = any(part.lower() in name.lower() for name in model.names.values())
        print(f"  {'✅' if found else '❌'} {part}")

def test_detection_thresholds(model, image_path):
    """Test detection with different confidence thresholds"""
    print("\n" + "=" * 60)
    print("DETECTION THRESHOLD ANALYSIS")
    print("=" * 60)
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"❌ Could not load image: {image_path}")
        return
    
    thresholds = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5]
    results = {}
    
    for conf in thresholds:
        print(f"\nTesting confidence threshold: {conf:.2f}")
        detections = model(image, conf=conf, iou=0.5)
        
        if not detections or not detections[0].boxes:
            print(f"  No detections at confidence {conf:.2f}")
            continue
        
        boxes = detections[0].boxes
        class_counts = {}
        
        for box in boxes:
            class_id = int(box.cls[0].cpu().numpy())
            class_name = model.names[class_id]
            confidence = float(box.conf[0].cpu().numpy())
            
            if class_name not in class_counts:
                class_counts[class_name] = []
            class_counts[class_name].append(confidence)
        
        print(f"  Found {len(boxes)} detections:")
        for class_name, confidences in class_counts.items():
            avg_conf = sum(confidences) / len(confidences)
            print(f"    - {class_name}: {len(confidences)} instances (avg conf: {avg_conf:.3f})")
        
        results[conf] = class_counts
    
    return results

def test_custom_model(image_path):
    """Test your custom car parts model"""
    print("=" * 60)
    print("TESTING CUSTOM CAR PARTS MODEL")
    print("=" * 60)
    
    model_path = 'car_parts_detector.pt'
    
    if not os.path.exists(model_path):
        print(f"❌ ERROR: Model file '{model_path}' not found!")
        print("Make sure car_parts_detector.pt is in the same directory as this script")
        return False
    
    try:
        # Load custom model
        print(f"📁 Loading model: {model_path}")
        model = YOLO(model_path)
        print("✅ Model loaded successfully!")
        
        # Analyze model classes
        analyze_model_classes(model)
        
        # Test with different thresholds
        threshold_results = test_detection_thresholds(model, image_path)
        
        # Save annotated images for each threshold
        image = cv2.imread(image_path)
        for conf in [0.1, 0.3, 0.5]:  # Test with key thresholds
            results = model(image, conf=conf)
            if results and len(results) > 0:
                annotated = results[0].plot()
                output_path = f"detection_threshold_{conf:.1f}.jpg"
                cv2.imwrite(output_path, annotated)
                print(f"\n💾 Saved annotated image for confidence {conf:.1f}: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_pretrained_model(image_path):
    """Test with pretrained YOLOv8 model for comparison"""
    print("\n" + "=" * 60)
    print("TESTING PRETRAINED YOLOV8 MODEL (for comparison)")
    print("=" * 60)
    
    try:
        # Load pretrained model (will download if not present)
        print("📁 Loading pretrained YOLOv8n model...")
        model = YOLO('yolov8n.pt')
        print("✅ Pretrained model loaded!")
        
        # Load image
        image = cv2.imread(image_path)
        
        # Run inference
        print("🔍 Running inference with pretrained model...")
        results = model(image, conf=0.25, verbose=False)
        
        total_detections = 0
        car_related = []
        
        for result in results:
            if result.boxes is not None:
                total_detections += len(result.boxes)
                
                for box in result.boxes:
                    class_id = int(box.cls[0].cpu().numpy())
                    confidence = float(box.conf[0].cpu().numpy())
                    class_name = model.names[class_id]
                    
                    # Check if it's car-related
                    car_classes = ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'person']
                    if any(car_word in class_name.lower() for car_word in car_classes):
                        car_related.append((class_name, confidence))
                    
                    print(f"  🎯 Found: {class_name} ({confidence:.3f})")
        
        if total_detections == 0:
            print("  ❌ No objects detected by pretrained model")
            print("  💡 This might indicate an issue with the image itself")
        else:
            print(f"  ✅ Pretrained model found {total_detections} objects")
            if car_related:
                print(f"  🚗 Car-related objects: {car_related}")
            
            # Save annotated image
            output_path = "pretrained_model_output.jpg"
            annotated = results[0].plot()
            cv2.imwrite(output_path, annotated)
            print(f"  💾 Saved annotated image: {output_path}")
        
        return total_detections > 0
        
    except Exception as e:
        print(f"❌ ERROR with pretrained model: {e}")
        return False

def analyze_image(image_path):
    """Basic image analysis"""
    print("\n" + "=" * 60)
    print("IMAGE ANALYSIS")
    print("=" * 60)
    
    try:
        image = cv2.imread(image_path)
        if image is None:
            print("❌ Could not load image")
            return
        
        print(f"📐 Image dimensions: {image.shape[1]}x{image.shape[0]} pixels")
        print(f"📊 Image channels: {image.shape[2]}")
        print(f"💾 File size: {os.path.getsize(image_path)} bytes")
        
        # Check brightness
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        print(f"💡 Average brightness: {brightness:.1f}/255")
        
        if brightness < 50:
            print("  ⚠️  Image seems very dark")
        elif brightness > 200:
            print("  ⚠️  Image seems very bright")
        else:
            print("  ✅ Brightness looks good")
            
    except Exception as e:
        print(f"❌ Error analyzing image: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_yolo.py <path_to_image>")
        print("Example: python test_yolo.py car_image.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ ERROR: Image file '{image_path}' not found!")
        sys.exit(1)
    
    print("🚗 YOLO CAR PARTS DETECTION TEST")
    print(f"📁 Testing image: {image_path}")
    
    # Analyze image
    analyze_image(image_path)
    
    # Test custom model
    custom_success = test_custom_model(image_path)
    
    # Test pretrained model
    pretrained_success = test_pretrained_model(image_path)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if custom_success:
        print("✅ Your custom model IS detecting car parts!")
        print("💡 The issue might be with confidence thresholds in your API")
    elif pretrained_success:
        print("❌ Your custom model is NOT detecting car parts")
        print("✅ But the pretrained model can detect objects in this image")
        print("💡 Issue is likely with your custom model training or compatibility")
    else:
        print("❌ Neither model detected anything")
        print("💡 Issue might be with:")
        print("   - Image quality/format")
        print("   - Image contains no recognizable objects")
        print("   - YOLO installation issue")
    
    print("\n📁 Generated files:")
    for file in ["custom_model_output_0.1.jpg", "pretrained_model_output.jpg"]:
        if os.path.exists(file):
            print(f"  - {file}")

if __name__ == "__main__":
    main()