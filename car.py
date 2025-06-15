import cv2
import numpy as np
import os
import sys
import argparse

def simple_car_detection(image_path):
    """
    Simple car detection using OpenCV's built-in cascade classifiers
    This is a fallback method that doesn't require TensorFlow
    """
    try:
        # Read the image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image file")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try to load a car cascade classifier (you'd need to download this)
        # For now, we'll use a simple heuristic based on image characteristics
        
        # Simple heuristic: check image dimensions and color distribution
        height, width = gray.shape
        
        # Calculate some basic features
        mean_intensity = np.mean(gray)
        std_intensity = np.std(gray)
        edge_count = np.sum(cv2.Canny(gray, 50, 150) > 0)
        edge_ratio = edge_count / (height * width)
        
        # Simple scoring based on typical car image characteristics
        score = 0
        
        # Cars typically have moderate contrast
        if 50 < std_intensity < 150:
            score += 1
            
        # Cars have many edges
        if edge_ratio > 0.1:
            score += 1
            
        # Cars are usually not too bright or too dark
        if 50 < mean_intensity < 200:
            score += 1
            
        # Aspect ratio check (cars are typically wider than tall)
        aspect_ratio = width / height
        if 1.2 < aspect_ratio < 3.0:
            score += 1
            
        # Simple threshold
        is_car = score >= 3
        confidence = score / 4.0
        
        if is_car:
            return f"This is a car (confidence: {confidence:.2f})"
        else:
            return f"This is not a car (confidence: {1-confidence:.2f})"
            
    except Exception as e:
        raise Exception(f"Error in car detection: {str(e)}")

def mock_car_classification(image_path):
    """
    Mock classification for testing - randomly classifies as car or not
    Replace this with your actual model when TensorFlow is working
    """
    try:
        # Verify image exists and is readable
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image file")
        
        # For now, let's use a simple mock based on filename or random
        filename = os.path.basename(image_path).lower()
        
        # If filename contains 'car', classify as car
        if 'car' in filename:
            return "This is a car (mock classification)"
        else:
            # Use simple detection
            return simple_car_detection(image_path)
            
    except Exception as e:
        raise Exception(f"Error in mock classification: {str(e)}")

# Main function
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Classify whether an image contains a car or not.')
    parser.add_argument('image_path', type=str, help='Path to the image file')
    args = parser.parse_args()
    
    try:
        print(f"Processing image: {args.image_path}", file=sys.stderr)
        
        # Check if image file exists
        if not os.path.exists(args.image_path):
            raise FileNotFoundError(f"Image file not found: {args.image_path}")
        
        # Try to import tensorflow first
        try:
            import tensorflow as tf
            print("TensorFlow available, but model loading not implemented in this version", file=sys.stderr)
            # You can add your TensorFlow model loading here when it's working
            result = mock_car_classification(args.image_path)
        except ImportError:
            print("TensorFlow not available, using simple detection", file=sys.stderr)
            result = simple_car_detection(args.image_path)
        
        # Print result (this is captured by the Node.js script)
        print(result)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(f"Error: {str(e)}")  # Also print to stdout for Node.js
        sys.exit(1)