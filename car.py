import cv2
import numpy as np
import os
import sys
import argparse

def load_car_classifier_model():
    """
    Load the pre-trained car classifier model
    """
    try:
        import tensorflow as tf
        from tensorflow.keras.models import load_model
        
        # Load the model
        model_path = 'car_classifier_model.h5'
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        model = load_model(model_path)
        return model
    except ImportError:
        raise ImportError("TensorFlow is required to load the model")
    except Exception as e:
        raise Exception(f"Error loading model: {str(e)}")

def preprocess_image_for_model(image_path, target_size=(224, 224)):
    """
    Preprocess image for the car classifier model
    """
    try:
        # Read and resize image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image file")
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to target size
        img_resized = cv2.resize(img_rgb, target_size)
        
        # Normalize pixel values to [0, 1]
        img_normalized = img_resized.astype(np.float32) / 255.0
        
        # Add batch dimension
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        return img_batch
    except Exception as e:
        raise Exception(f"Error preprocessing image: {str(e)}")

def classify_car_with_model(image_path, model):
    """
    Classify car using the loaded model
    """
    try:
        # Preprocess the image
        processed_image = preprocess_image_for_model(image_path)
        
        # Make prediction
        prediction = model.predict(processed_image, verbose=0)
        
        # Assuming binary classification (car vs not car)
        # If your model has different output format, adjust accordingly
        if len(prediction.shape) > 1:
            # If prediction is 2D, take the first row
            prediction = prediction[0]
        
        # Get the probability of being a car
        car_probability = prediction[0] if len(prediction) == 1 else prediction[1]
        
        # Determine classification
        is_car = car_probability > 0.5
        confidence = car_probability if is_car else 1 - car_probability
        
        if is_car:
            return f"This is a car (confidence: {confidence:.2f})"
        else:
            return f"This is not a car (confidence: {confidence:.2f})"
            
    except Exception as e:
        raise Exception(f"Error in model classification: {str(e)}")

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
        
        # Try to use TensorFlow model first
        try:
            print("Loading car classifier model...", file=sys.stderr)
            model = load_car_classifier_model()
            print("Model loaded successfully, performing classification...", file=sys.stderr)
            result = classify_car_with_model(args.image_path, model)
        except ImportError:
            print("TensorFlow not available, using simple detection", file=sys.stderr)
            result = simple_car_detection(args.image_path)
        except Exception as e:
            print(f"Model loading failed: {str(e)}, falling back to simple detection", file=sys.stderr)
            result = simple_car_detection(args.image_path)
        
        # Print result (this is captured by the Node.js script)
        print(result)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(f"Error: {str(e)}")  # Also print to stdout for Node.js
        sys.exit(1)