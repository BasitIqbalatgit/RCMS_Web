

# import torch
# from segment_anything import sam_model_registry, SamPredictor
# import cv2
# import numpy as np
# from ultralytics import YOLO
# import os
# import matplotlib.pyplot as plt

# def show_mask(mask, ax, random_color=False):
#     if random_color:
#         color = np.concatenate([np.random.random(3), np.array([0.6])], axis=0)
#     else:
#         color = np.array([30/255, 144/255, 255/255, 0.6])
#     h, w = mask.shape[-2:]
#     mask_image = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
#     ax.imshow(mask_image)

# def show_box(box, ax):
#     x0, y0, x1, y1 = box
#     ax.add_patch(plt.Rectangle((x0, y0), x1 - x0, y1 - y0, edgecolor='lime', facecolor=(0,0,0,0), lw=2))

# # --- Configuration ---
# YOLO_MODEL_PATH = 'car_parts_detector.pt'  # Path to your trained YOLOv8 model
# SAM_CHECKPOINT_PATH = 'sam_vit_l_0b3195.pth'  # <--- REPLACE WITH THE ACTUAL PATH TO THE DOWNLOADED .pth FILE
# SAM_MODEL_TYPE = 'vit_l'  # Choose 'vit_h', 'vit_l', or 'vit_b' based on your downloaded model
# IMAGE_PATH = 'flip_90honda_cars-9-_jpg.rf.63135513bb056e860719edeb8531a5ed.jpg'  # Path to your input image
# OUTPUT_DIR = 'segmented_parts'  # Directory to save segmented car parts
# MASKED_OUTPUT_DIR = 'masked_images' # Directory to save images with overlaid masks
# ZOOMED_OUTPUT_DIR = 'zoomed_parts' # Directory to save zoomed segmented parts
# EXPAND_PIXELS = 5  # Number of pixels to expand the bounding box for SAM
# MORPH_KERNEL_SIZE = 5  # Kernel size for morphological operations (if applied)
# MIN_MASK_AREA_FOR_ZOOM = 1000  # Minimum area (in pixels) to NOT zoom

# # --- Setup ---
# device = "cpu"  # Force CPU usage
# os.makedirs(OUTPUT_DIR, exist_ok=True)
# os.makedirs(MASKED_OUTPUT_DIR, exist_ok=True)
# os.makedirs(ZOOMED_OUTPUT_DIR, exist_ok=True)

# # Load YOLO model
# try:
#     yolo_model = YOLO(YOLO_MODEL_PATH)
# except FileNotFoundError:
#     print(f"Error: YOLO model not found at {YOLO_MODEL_PATH}")
#     exit()

# # Load SAM model
# try:
#     sam = sam_model_registry[SAM_MODEL_TYPE](checkpoint=SAM_CHECKPOINT_PATH)
#     sam.to(device)
#     predictor = SamPredictor(sam)
# except FileNotFoundError:
#     print(f"Error: SAM checkpoint not found at {SAM_CHECKPOINT_PATH}")
#     exit()
# except KeyError:
#     print(f"Error: Invalid SAM model type '{SAM_MODEL_TYPE}'. Choose from 'vit_h', 'vit_l', 'vit_b'.")
#     exit()

# # Load image
# try:
#     image = cv2.imread(IMAGE_PATH)
#     image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
# except FileNotFoundError:
#     print(f"Error: Image not found at {IMAGE_PATH}")
#     exit()

# # --- Detection and Segmentation ---
# yolo_results = yolo_model.predict(image)

# for i, result in enumerate(yolo_results):
#     boxes_yolo = result.boxes.xyxy.cpu().numpy().astype(int)
#     names = result.names
#     confidences = result.boxes.conf.cpu().numpy()
#     class_ids = result.boxes.cls.cpu().numpy().astype(int)

#     # Prepare for SAM prediction on the full image
#     predictor.set_image(image_rgb)

#     for j, (x_min_yolo, y_min_yolo, x_max_yolo, y_max_yolo) in enumerate(boxes_yolo):
#         # Slightly expand the bounding box for SAM
#         x_min_sam = max(0, x_min_yolo - EXPAND_PIXELS)
#         y_min_sam = max(0, y_min_yolo - EXPAND_PIXELS)
#         x_max_sam = min(image_rgb.shape[1], x_max_yolo + EXPAND_PIXELS)
#         y_max_sam = min(image_rgb.shape[0], y_max_yolo + EXPAND_PIXELS)

#         input_box = np.array([x_min_sam, y_min_sam, x_max_sam, y_max_sam])
#         masks, _, _ = predictor.predict(
#             box=input_box,
#             multimask_output=False
#         )
#         segmented_mask = masks[0]

#         # Post-processing (Morphological Closing)
#         mask_processed = segmented_mask.astype(np.uint8) * 255
#         kernel = np.ones((MORPH_KERNEL_SIZE, MORPH_KERNEL_SIZE), np.uint8)
#         mask_processed = cv2.morphologyEx(mask_processed, cv2.MORPH_CLOSE, kernel)

#         # Ensure mask has the same size as cropped_image
#         cropped_width = x_max_sam - x_min_sam
#         cropped_height = y_max_sam - y_min_sam
#         resized_mask = cv2.resize(mask_processed, (cropped_width, cropped_height), interpolation=cv2.INTER_LINEAR)
#         final_mask = resized_mask > 127 # Threshold to get binary mask (0 or 255)

#         # Extract the segmented car part
#         cropped_image = image_rgb[y_min_sam:y_max_sam, x_min_sam:x_max_sam].copy()
#         masked_car_part = cv2.bitwise_and(cropped_image, cropped_image, mask=final_mask.astype(np.uint8) * 255)
#         masked_car_part_bgr = cv2.cvtColor(masked_car_part, cv2.COLOR_RGB2BGR)

#         # Create a transparent background for the segmented part (optional)
#         segmented_output = np.zeros_like(masked_car_part_bgr, dtype=np.uint8)
#         segmented_output[final_mask] = masked_car_part_bgr[final_mask]

#         # Save the segmented part (original size)
#         class_name = names[class_ids[j]].replace(" ", "_")  # Sanitize class name for filename
#         confidence_str = f"{confidences[j]:.2f}".replace(".", "_")
#         output_filename = os.path.join(OUTPUT_DIR, f"segmented_{class_name}_{confidence_str}_{i}_{j}.png")
#         cv2.imwrite(output_filename, segmented_output)
#         print(f"Saved segmented {names[class_ids[j]]} to {output_filename}")

#         # Calculate mask area
#         mask_area = np.sum(final_mask)

#         # Save zoomed segmented part if mask area is small
#         if mask_area < MIN_MASK_AREA_FOR_ZOOM and mask_area > 0:
#             zoom_factor = 3  # Adjust zoom factor as needed
#             zoomed_width = int(cropped_width * zoom_factor)
#             zoomed_height = int(cropped_height * zoom_factor)
#             zoomed_segmented = cv2.resize(segmented_output, (zoomed_width, zoomed_height), interpolation=cv2.INTER_LINEAR)
#             zoomed_filename = os.path.join(ZOOMED_OUTPUT_DIR, f"zoomed_{class_name}_{confidence_str}_{i}_{j}.png")
#             cv2.imwrite(zoomed_filename, zoomed_segmented)
#             print(f"Saved zoomed segmented {names[class_ids[j]]} to {zoomed_filename}")

#         # Show mask on the original image
#         plt.figure(figsize=(10, 10))
#         plt.imshow(image_rgb)
#         show_mask(masks[0], plt.gca())
#         show_box(input_box, plt.gca())
#         plt.title(f"Segmented {names[class_ids[j]]} (Confidence: {confidence_str})")
#         plt.axis('off')
#         masked_image_filename = os.path.join(MASKED_OUTPUT_DIR, f"masked_{class_name}_{confidence_str}_{i}_{j}.png")
#         plt.savefig(masked_image_filename)
#         plt.close()
#         print(f"Saved masked image to {masked_image_filename}")

# print(f"\nSegmented car parts saved to the '{OUTPUT_DIR}' directory.")
# print(f"Masked images saved to the '{MASKED_OUTPUT_DIR}' directory.")
# print(f"Zoomed segmented parts (if small) saved to the '{ZOOMED_OUTPUT_DIR}' directory.")



import sys
import cv2
from ultralytics import YOLO

# Path to the trained YOLOv8 model
YOLO_MODEL_PATH = 'car_parts_detector.pt'

def segment_image(input_path, output_path):
    # Load the YOLOv8 model
    model = YOLO(YOLO_MODEL_PATH)

    # Read the input image
    image = cv2.imread(input_path)
    if image is None:
        raise ValueError("Failed to load input image")

    # Perform inference
    results = model(image)

    # Draw bounding boxes or segmentation masks on the image
    annotated_image = results[0].plot()  # This annotates the image with detections

    # Save the annotated image
    cv2.imwrite(output_path, annotated_image)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python yoloTest.py <input_image_path> <output_image_path>")
        sys.exit(1)

    input_image_path = sys.argv[1]
    output_image_path = sys.argv[2]

    try:
        segment_image(input_image_path, output_image_path)
        sys.exit(0)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)