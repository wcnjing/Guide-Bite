# Guide-Bite 📸


## Features

- 📷 Allows users to take a photo of a menu and identify menu items
- 🖼️ They can also choose to pick images from library
- 🤖 Send to Roboflow for classification & object detection
- 📊 Display annotated results

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Make sure your `.env` file is in the root directory with:**
   ```
   EXPO_PUBLIC_ROBOFLOW_API_KEY=GEUcDhM17G5ZZY0O1GwZ
   EXPO_PUBLIC_ROBOFLOW_WORKSPACE=beyondbinary2026
   EXPO_PUBLIC_ROBOFLOW_WORKFLOW=classify-and-conditionally-detect-3
   ```

3. **Start the app:**
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator

## How It Works

1. User takes a photo or picks one from their library
2. Image is converted to base64
3. Sent to Roboflow workflow API endpoint
4. Workflow runs:
   - Classification model (detects if it's pasta)
   - If top class matches, runs object detection
5. Results are displayed:
   - Top classification class & confidence
   - Detected objects (if any)
   - Annotated output image (if available)

## App Structure

- **Camera/Image Picker**: Uses Expo's built-in components
- **API Integration**: Sends base64 images to Roboflow workflow
- **Results Display**: Shows classification, detections, and annotated images
- **Error Handling**: User-friendly alerts for issues

## Figma Prototype

https://www.figma.com/design/7zwhtyumsJmkx1cHfmXVIH/Order?node-id=0-1&t=hCfDOwVm8FHGxtZ1-1 

## Permissions

The app requires:
- Camera access (to take photos)
- Photo library access (to pick existing images)

These are requested automatically on first launch.

## Troubleshooting

**"No access to camera"**: Grant camera permissions in your device settings

**"Failed to process image"**: Check your API key and network connection

**No results showing**: Check the console for API response errors

## Roboflow workflow

1. Classification model: `beyond-binary-2026/2`
2. Conditional check: If top class = "pasta"
3. Object detection: RF-DETR Nano model
4. Visualizations: Bounding boxes + labels

