import os
import requests
import json
import base64

ML_URL = "http://127.0.0.1:8000/predict_disease"
dataset_dir = "dataset/plantvillage dataset/color"
debug_output_dir = "debug_outputs"
os.makedirs(debug_output_dir, exist_ok=True)

test_categories = [
    "Apple___Apple_scab",
    "Corn_(maize)___Common_rust_",
    "Grape___Black_rot",
    "Potato___Early_blight",
    "Tomato___healthy"
]

test_image_paths = []
for cat in test_categories:
    cat_dir = os.path.join(dataset_dir, cat)
    if os.path.exists(cat_dir):
        files = [f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if files:
            test_image_paths.append((cat, os.path.join(cat_dir, files[0])))

print(f"Selected {len(test_image_paths)} test images:")
for cat, path in test_image_paths:
    print(f" - {cat}: {path}")

# Run 5 predictions
responses = []
for i, (cat, img_path) in enumerate(test_image_paths):
    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/jpeg")}
        resp = requests.post(ML_URL, files=files)
    
    assert resp.status_code == 200, f"HTTP error {resp.status_code}: {resp.text}"
    data = resp.json()
    print(f"\n[Test {i+1}] Input: {cat}")
    print(f"  Success: {data.get('success')}")
    print(f"  Disease: {data.get('disease')}")
    print(f"  Confidence: {data.get('confidence'):.2f}%")
    has_heatmap = data.get('heatmap') is not None
    b64_len = len(data.get('heatmap') or "")
    print(f"  Heatmap Present: {has_heatmap} (base64 length: {b64_len})")
    
    assert data.get("success") is True
    assert data.get("disease") is not None
    assert data.get("confidence") is not None
    assert has_heatmap is True and b64_len > 100
    
    # Save the first 3 heatmaps to ml/debug_outputs/
    if i < 3:
        b64_clean = data["heatmap"]
        if b64_clean.startswith("data:image"):
            b64_clean = b64_clean.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_clean)
        out_filename = f"heatmap_test_{i+1}_{cat.replace('/', '_')}.jpg"
        out_path = os.path.join(debug_output_dir, out_filename)
        with open(out_path, "wb") as out_f:
            out_f.write(img_bytes)
        print(f"  Saved heatmap to: {out_path} ({len(img_bytes)} bytes)")
    
    responses.append(data)

print("\n--- Test Verification 1 & 2 PASSED! ---")
