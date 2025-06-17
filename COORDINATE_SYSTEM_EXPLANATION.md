# Coordinate System for Reference Image Placement

## Overview

The system uses a **two-step approach** to place reference images on segmented parts:

1. **Step 1**: Place reference image at exact coordinates (no resizing or orientation changes)
2. **Step 2**: Resize the placed image to fit the bounding box

This ensures precise placement of replacement parts exactly where the original parts were detected and removed.

## How It Works

### 1. Segmentation Process
When parts are detected and segmented, the system stores the exact coordinates of each part:

```json
{
  "class_name": "Headlight - -L-",
  "x": 140.73422241210938,
  "y": 74.65431213378906,
  "w": 180.0629119873047,
  "h": 99.58917236328125
}
```

### 2. Two-Step Placement Process

#### Step 1: Exact Coordinate Placement
- **No resizing**: Reference image is placed at exact coordinates without any size changes
- **No orientation changes**: Image maintains its original orientation
- **Precise positioning**: Uses the exact `x`, `y` coordinates from segmentation

```python
# Place reference image at exact coordinates (no resizing)
result_img[base_start_y:base_start_y+copy_height, base_start_x:base_start_x+copy_width] = \
    reference_img[ref_start_y:ref_start_y+copy_height, ref_start_x:ref_start_x+copy_width]
```

#### Step 2: Bounding Box Resizing
- **Fit to bounding box**: Resize the reference image to fit the exact `w`, `h` dimensions
- **Maintain aspect ratio**: Uses high-quality interpolation (INTER_AREA)
- **Replace segmented area**: The resized image replaces the segmented part area

```python
# Resize reference image to fit the exact bounding box
resized_ref = cv2.resize(reference_img, (target_width, target_height), interpolation=cv2.INTER_AREA)

# Replace the region with the resized reference image
result_img[y:y+target_height, x:x+target_width] = resized_ref
```

### 3. Coordinate Extraction
The stitching process extracts these coordinates:
- **x, y**: Top-left corner of the segmented part
- **w, h**: Width and height of the segmented part

### 4. Example Process
```
Reference Image: 207x126 pixels
Segmented Part: x=140.73, y=74.65, w=180.06, h=99.59

Step 1: Place at exact coordinates (140.73, 74.65)
Step 2: Resize to fit bounding box (180.06 x 99.59)
```

## Benefits of This Approach

### ✅ **Precision**
- Uses exact coordinates from segmentation
- No approximation or estimation
- Maintains spatial accuracy

### ✅ **Quality**
- No initial resizing that could distort the image
- High-quality final resizing using INTER_AREA interpolation
- Preserves image details

### ✅ **Simplicity**
- Clear two-step process
- Easy to understand and debug
- Predictable results

### ✅ **Flexibility**
- Works with any reference image size
- Handles different aspect ratios
- Adapts to various segmented part dimensions

## Implementation Details

### Key Functions

#### `stitch_part_simple()`
```python
def stitch_part_simple(base_img, reference_img, part_info):
    # Step 1: Place at exact coordinates (no resizing)
    # Step 2: Resize to fit bounding box
```

### Coordinate Handling
- **Bounds checking**: Ensures coordinates stay within image boundaries
- **Integer conversion**: Converts float coordinates to integers for pixel operations
- **Error handling**: Validates coordinates before processing

### Image Processing
- **Copy operations**: Uses numpy array slicing for efficient placement
- **Resizing**: Uses OpenCV's resize with INTER_AREA interpolation
- **Memory management**: Creates copies to avoid modifying original images

## Test Results

The test script demonstrates the approach:
```
Base image: 194x150 pixels
Reference image: 207x126 pixels
Segmented coordinates: x=140.73, y=74.65, w=180.06, h=99.59
Target area: 180x99 pixels

Result: Successfully placed and resized reference image
```

## Usage

1. **Segmentation**: Parts are detected and coordinates are stored
2. **Reference Selection**: Appropriate reference images are selected
3. **Placement**: Reference images are placed using the two-step process
4. **Output**: Final stitched image with replacement parts

This approach ensures that replacement parts are placed exactly where the original parts were located, providing accurate and realistic results for car modification visualization.

## Example Visualization

For the example with headlights:

```
Part 1: Headlight - -L-
  Coordinates: x=140.7, y=74.7, w=180.1, h=99.6
  Rectangle: (140, 74) to (320, 174)
  Area: 17932 pixels

Part 2: Headlight - -R-
  Coordinates: x=14.9, y=74.5, w=52.9, h=99.3
  Rectangle: (14, 74) to (67, 173)
  Area: 5258 pixels
```

## Key Benefits

1. **Precise Placement**: Reference images are placed exactly where the original parts were
2. **Automatic Sizing**: Reference images are scaled to fit the exact segmented dimensions
3. **Consistent Results**: Same coordinates always produce the same placement
4. **No Manual Adjustment**: No need to manually position or align images

## Process Flow

1. **Detection**: Parts are detected in the original image
2. **Segmentation**: Parts are segmented and coordinates are stored
3. **Removal**: Segmented parts are removed from the base image
4. **Placement**: Reference images are placed at the exact segmented coordinates
5. **Blending**: Smooth blending ensures natural-looking results

## Technical Details

### Coordinate System
- Origin: Top-left corner of the image (0, 0)
- X-axis: Left to right (increasing)
- Y-axis: Top to bottom (increasing)
- Units: Pixels

### Image Processing
- Reference images are resized to fit the segmented dimensions
- Aspect ratio is preserved during resizing
- Smooth blending masks create natural transitions
- Bounds checking ensures coordinates stay within image limits

### Data Structure
```typescript
interface SegmentedPart {
  class_name: string;
  x: number;        // X coordinate of top-left corner
  y: number;        // Y coordinate of top-left corner
  w: number;        // Width of segmented part
  h: number;        // Height of segmented part
  confidence: number;
  segmented_image_path: string;
  mask_path: string;
}
```

## Visualization

You can visualize the coordinates using:
```bash
python visualize_coordinates.py <input_json_path>
```

This creates an image showing green rectangles around the areas where reference images will be placed, along with coordinate information. 