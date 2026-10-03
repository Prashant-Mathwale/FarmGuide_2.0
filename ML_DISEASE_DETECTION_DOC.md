# FarmGuide 2.0 — Disease Detection ML Model Documentation

This document provides a comprehensive breakdown of the Machine Learning capabilities for plant disease detection within the FarmGuide 2.0 platform.

---

## 🏛️ Executive Summary

FarmGuide 2.0 utilizes a Convolutional Neural Network (CNN) model designed to analyze multispectral imagery of plant foliage. The model can accurately classify **38 distinct conditions** across **14 different crop varieties**. This encompasses **26 specific plant diseases** and 12 distinct healthy baseline states.

---

## 🦠 Detectable Diseases and Crops

Below is the complete, categorized list of crops supported by the model, along with the specific diseases and health states it is trained to identify:

### 🍎 Apple
* **Apple Scab** (`Apple___Apple_scab`)
* **Black Rot** (`Apple___Black_rot`)
* **Cedar Apple Rust** (`Apple___Cedar_apple_rust`)
* **Healthy** (`Apple___healthy`)

### 🫐 Blueberry
* **Healthy** (`Blueberry___healthy`)

### 🍒 Cherry (including sour)
* **Powdery Mildew** (`Cherry_(including_sour)___Powdery_mildew`)
* **Healthy** (`Cherry_(including_sour)___healthy`)

### 🌽 Corn (Maize)
* **Cercospora Leaf Spot / Gray Leaf Spot** (`Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot`)
* **Common Rust** (`Corn_(maize)___Common_rust_`)
* **Northern Leaf Blight** (`Corn_(maize)___Northern_Leaf_Blight`)
* **Healthy** (`Corn_(maize)___healthy`)

### 🍇 Grape
* **Black Rot** (`Grape___Black_rot`)
* **Esca (Black Measles)** (`Grape___Esca_(Black_Measles)`)
* **Leaf Blight (Isariopsis Leaf Spot)** (`Grape___Leaf_blight_(Isariopsis_Leaf_Spot)`)
* **Healthy** (`Grape___healthy`)

### 🍊 Orange
* **Huanglongbing (Citrus Greening)** (`Orange___Haunglongbing_(Citrus_greening)`)

### 🍑 Peach
* **Bacterial Spot** (`Peach___Bacterial_spot`)
* **Healthy** (`Peach___healthy`)

### 🫑 Pepper (Bell)
* **Bacterial Spot** (`Pepper,_bell___Bacterial_spot`)
* **Healthy** (`Pepper,_bell___healthy`)

### 🥔 Potato
* **Early Blight** (`Potato___Early_blight`)
* **Late Blight** (`Potato___Late_blight`)
* **Healthy** (`Potato___healthy`)

### 🍓 Raspberry
* **Healthy** (`Raspberry___healthy`)

### 🫘 Soybean
* **Healthy** (`Soybean___healthy`)

### 🎃 Squash
* **Powdery Mildew** (`Squash___Powdery_mildew`)

### 🍓 Strawberry
* **Leaf Scorch** (`Strawberry___Leaf_scorch`)
* **Healthy** (`Strawberry___healthy`)

### 🍅 Tomato
* **Bacterial Spot** (`Tomato___Bacterial_spot`)
* **Early Blight** (`Tomato___Early_blight`)
* **Late Blight** (`Tomato___Late_blight`)
* **Leaf Mold** (`Tomato___Leaf_Mold`)
* **Septoria Leaf Spot** (`Tomato___Septoria_leaf_spot`)
* **Spider Mites (Two-Spotted Spider Mite)** (`Tomato___Spider_mites Two-spotted_spider_mite`)
* **Target Spot** (`Tomato___Target_Spot`)
* **Tomato Yellow Leaf Curl Virus** (`Tomato___Tomato_Yellow_Leaf_Curl_Virus`)
* **Tomato Mosaic Virus** (`Tomato___Tomato_mosaic_virus`)
* **Healthy** (`Tomato___healthy`)

---

## ⚙️ Model Architecture and Implementation Details

- **Input Format**: High-resolution RGB images of a single plant leaf.
- **Preprocessing**: Images are resized to `(224, 224)` and pixel values are scaled to `[0, 1]` before inference.
- **Explainability**: The pipeline integrates **Grad-CAM (Gradient-weighted Class Activation Mapping)** to overlay heatmaps on the original image. This provides farmers with visual feedback highlighting exactly which regions of the leaf the CNN focused on to make its diagnosis.
- **Safety Guards**: The system incorporates `input_guard` checks to validate image quality, brightness, blur, and leaf presence before sending the data to the prediction model, ensuring higher accuracy and fewer false positives.
