# 🌿 Real-World Disease Test Dataset Collection Guide

This directory (`ml/dataset/real_test/`) is designated exclusively for **real-world benchmark evaluation** of the FarmGuide plant disease detection models.

> ⚠️ **CRITICAL BENCHMARK INTEGRITY RULE:**  
> **NEVER** use images from this folder for model training or data augmentation. This dataset acts as a strictly held-out real-world test set to assess generalization on unconstrained smartphone and field photography.

---

## 📁 Directory Structure

Images should be organized into subdirectories whose folder names **strictly match** the entries defined in [`ml/models/disease_classes.json`](file:///c:/Users/Prashant/OneDrive/Documents/Desktop/Projects/Farmguide/farmGuide/ml/models/disease_classes.json).

In addition, an optional `Not_A_Plant/` directory can be included to measure the model's out-of-distribution (OOD) false-acceptance rates.

```text
ml/dataset/real_test/
├── README.md
├── Apple___Apple_scab/
│   ├── photo_001.jpg
│   └── photo_002.png
├── Apple___healthy/
├── Potato___Early_blight/
├── Tomato___Late_blight/
├── ... (other 38 PlantVillage classes)
└── Not_A_Plant/                 # Optional non-leaf / OOD images
    ├── soil.jpg
    ├── tractor.jpg
    └── shoe.png
```

---

## 📸 Photo Collection Guidelines

To ensure rigorous and realistic evaluation, collect photos following these rules:

1. **Target Single Leaf**:
   - Focus the camera on one primary diseased or healthy leaf per photo.
   - The leaf should occupy at least 50–70% of the frame.
2. **Lighting**:
   - Capture in natural daylight (avoid extreme shadows, harsh flash reflections, or heavy underexposure).
3. **Backgrounds**:
   - Capture leaves both in natural field environments (soil, plant stems, neighboring leaves) and against neutral/plain backgrounds (palms, white cardboard, wooden benches).
4. **Target Sample Size**:
   - Aim for **20+ photos per class** where available across different plants and angles.
5. **Image Format & Resolution**:
   - Acceptable formats: `.jpg`, `.jpeg`, `.png`.
   - Native smartphone camera resolutions (e.g. 1080p, 12MP) are fine; images will be resized to `224x224` during preprocessing.

---

## 🚫 Out-of-Domain (`Not_A_Plant/`) Images

The optional `Not_A_Plant/` directory should contain non-leaf photos commonly taken by farmers by mistake, such as:
- Farm tools, machinery, boots, and gloves
- Soil, fertilizer bags, drip pipes, and irrigation valves
- Domestic animals, insects, or landscapes

These are used to evaluate model overconfidence and calculate False-Accept Rates (FAR) at max-softmax confidence thresholds of `0.5`, `0.7`, and `0.9`.

---

## 🧪 Running Evaluation

Run [`eval_disease.py`](file:///c:/Users/Prashant/OneDrive/Documents/Desktop/Projects/Farmguide/farmGuide/ml/eval_disease.py) from the `ml/` directory:

```bash
# Default evaluation (div255 preprocessing, baseline report output)
python eval_disease.py

# Custom paths or MobileNet preprocessing
python eval_disease.py --data_dir dataset/real_test --output_dir reports/baseline --preprocess div255
```
