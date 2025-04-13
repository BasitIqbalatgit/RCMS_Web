import tensorflow as tf
import numpy as np
import cv2
import os
import sys
import argparse

# Load the model
MODEL_PATH = 'car_classifier_model.h5'

# Check if the model file exists
if not os.path.exists(MODEL_PATH):
    print(f"Error: Model file not found at {os.path.abspath(MODEL_PATH)}")
    sys.exit(1)

model = tf.keras.models.load_model(MODEL_PATH)

# Function to preprocess the image
def preprocess_image(image_path, img_size=128):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Invalid image file")
    img = cv2.resize(img, (img_size, img_size))
    img = img / 255.0
    return np.expand_dims(img, axis=0)

# Function to classify the image
def classify_image(image_path):
    image = preprocess_image(image_path)
    prediction = model.predict(image)
    return "This is a car." if prediction[0][0] > 0.5 else "This is not a car."

# Main function to be run from the command line with the image file as an argument
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Classify whether an image contains a car or not.')
    parser.add_argument('image_path', type=str, help='Path to the image file')

    args = parser.parse_args()

    try:
        result = classify_image(args.image_path)
        print(result)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
