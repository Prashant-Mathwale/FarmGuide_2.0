"""
calibrate_guard.py — Evaluate input guard thresholds on two image folders.

Usage:
    python calibrate_guard.py [--leaves ml/guard_eval/leaves] [--non-leaves ml/guard_eval/non_leaves]

Prints:
  1. Per-folder distribution of blur score, plant ratio, top1, margin, entropy.
  2. False-reject count for leaves and false-accept count for non-leaves.
  3. Suggested thresholds to keep false-reject rate under 3%.
"""

import os
import sys
import argparse
import json
import numpy as np
from collections import defaultdict

import cv2

# Add parent directory so imports work when run from ml/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from input_guard import (
    decode_image, compute_blur_score, compute_brightness, compute_plant_ratio,
    run_gate_a, run_gate_b, run_gate_c,
)
from guard_config import GUARD_CONFIG


def load_disease_model():
    """Load the disease model and class names (optional, for Gate C stats)."""
    try:
        import tensorflow as tf
        model = tf.keras.models.load_model('models/disease_model.h5')
        with open('models/disease_classes.json', 'r') as f:
            classes = json.load(f)
        return model, classes
    except Exception as e:
        print(f"Warning: Could not load disease model for Gate C stats: {e}")
        return None, []


def preprocess_for_model(img_bgr):
    """Convert BGR image to model input (224x224, float32, [0,1])."""
    from PIL import Image as PILImage
    import io
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = PILImage.fromarray(rgb).resize((224, 224))
    arr = np.expand_dims(np.array(pil_img) / 255.0, axis=0)
    return arr


def scan_folder(folder, model=None, classes=None, label=""):
    """
    Scan all images in a folder and collect metrics.
    Returns list of dicts with per-image stats.
    """
    results = []
    if not os.path.isdir(folder):
        print(f"  [SKIP] Folder not found: {folder}")
        return results

    files = sorted([
        f for f in os.listdir(folder)
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp'))
    ])

    if not files:
        print(f"  [SKIP] No image files in {folder}")
        return results

    for fname in files:
        fpath = os.path.join(folder, fname)
        try:
            with open(fpath, 'rb') as f:
                raw = f.read()
        except Exception:
            continue

        img_bgr, err = decode_image(raw)
        if img_bgr is None:
            results.append({"file": fname, "decode_ok": False, "status": "invalid_image"})
            continue

        blur = compute_blur_score(img_bgr)
        brightness = compute_brightness(img_bgr)
        plant_ratio = compute_plant_ratio(img_bgr)

        gate_a = run_gate_a(raw)
        gate_b = run_gate_b(img_bgr) if gate_a["passed"] else None

        top1 = None
        margin = None
        entropy = None
        gate_c_status = None
        if model is not None and gate_a["passed"] and (gate_b is None or gate_b["passed"]):
            try:
                arr = preprocess_for_model(img_bgr)
                preds = model.predict(arr, verbose=0)[0]
                from input_guard import compute_confidence_metrics
                metrics = compute_confidence_metrics(preds)
                top1 = metrics["top1"]
                margin = metrics["margin"]
                entropy = metrics["entropy"]
                gate_c = run_gate_c(preds, gate_b_borderline=gate_b.get("borderline", False) if gate_b else False)
                gate_c_status = gate_c["status"]
            except Exception:
                pass

        # Determine final status
        if not gate_a["passed"]:
            final_status = gate_a["status"]
        elif gate_b and not gate_b["passed"]:
            final_status = gate_b["status"]
        elif gate_c_status:
            final_status = gate_c_status
        else:
            final_status = "ok"

        results.append({
            "file": fname,
            "decode_ok": True,
            "blur": round(blur, 2),
            "brightness": round(brightness, 2),
            "plant_ratio": round(plant_ratio, 4),
            "top1": round(top1, 4) if top1 is not None else None,
            "margin": round(margin, 4) if margin is not None else None,
            "entropy": round(entropy, 4) if entropy is not None else None,
            "status": final_status,
        })

    return results


def print_distribution(values, name):
    """Print min/median/max for a list of numeric values."""
    vals = [v for v in values if v is not None]
    if not vals:
        print(f"    {name:20s}  (no data)")
        return
    arr = np.array(vals)
    print(f"    {name:20s}  min={arr.min():.4f}  median={np.median(arr):.4f}  max={arr.max():.4f}  n={len(arr)}")


def main():
    parser = argparse.ArgumentParser(description="Calibrate input guard thresholds")
    parser.add_argument("--leaves", default="guard_eval/leaves", help="Folder with real leaf images")
    parser.add_argument("--non-leaves", default="guard_eval/non_leaves", help="Folder with non-leaf images")
    args = parser.parse_args()

    print(f"\nCurrent thresholds: {json.dumps(GUARD_CONFIG, indent=2)}\n")

    model, classes = load_disease_model()

    # ── Scan leaves ──
    print(f"═══ LEAVES folder: {args.leaves} ═══")
    leaf_results = scan_folder(args.leaves, model, classes, "leaf")
    if leaf_results:
        print(f"  Total images: {len(leaf_results)}")
        print_distribution([r.get("blur") for r in leaf_results], "blur_score")
        print_distribution([r.get("brightness") for r in leaf_results], "brightness")
        print_distribution([r.get("plant_ratio") for r in leaf_results], "plant_ratio")
        print_distribution([r.get("top1") for r in leaf_results], "top1")
        print_distribution([r.get("margin") for r in leaf_results], "margin")
        print_distribution([r.get("entropy") for r in leaf_results], "entropy")

        rejected = [r for r in leaf_results if r["status"] not in ("ok", "possible")]
        print(f"\n  ❌ False rejects (leaves wrongly rejected): {len(rejected)} / {len(leaf_results)}")
        for r in rejected:
            print(f"     {r['file']}: status={r['status']}")
    else:
        print("  No leaf images found.")

    # ── Scan non-leaves ──
    print(f"\n═══ NON-LEAVES folder: {args.non_leaves} ═══")
    non_leaf_results = scan_folder(args.non_leaves, model, classes, "non-leaf")
    if non_leaf_results:
        print(f"  Total images: {len(non_leaf_results)}")
        print_distribution([r.get("blur") for r in non_leaf_results], "blur_score")
        print_distribution([r.get("brightness") for r in non_leaf_results], "brightness")
        print_distribution([r.get("plant_ratio") for r in non_leaf_results], "plant_ratio")
        print_distribution([r.get("top1") for r in non_leaf_results], "top1")
        print_distribution([r.get("margin") for r in non_leaf_results], "margin")
        print_distribution([r.get("entropy") for r in non_leaf_results], "entropy")

        accepted = [r for r in non_leaf_results if r["status"] in ("ok", "possible")]
        print(f"\n  ❌ False accepts (non-leaves wrongly accepted): {len(accepted)} / {len(non_leaf_results)}")
        for r in accepted:
            print(f"     {r['file']}: status={r['status']}, plant_ratio={r.get('plant_ratio')}, top1={r.get('top1')}")
    else:
        print("  No non-leaf images found.")

    # ── Summary table ──
    print("\n═══ SUMMARY TABLE ═══")
    print(f"{'Image':<45} {'Status':<16} {'Reasons':<40} {'Top1':>8}")
    print("─" * 110)
    for r in leaf_results + non_leaf_results:
        reasons_str = ", ".join(r.get("reasons", [])) if isinstance(r.get("reasons"), list) else ""
        top1_str = f"{r.get('top1', 0)*100:.1f}%" if r.get("top1") is not None else "N/A"
        print(f"{r['file']:<45} {r['status']:<16} {reasons_str:<40} {top1_str:>8}")

    # ── Suggest thresholds ──
    if leaf_results:
        leaf_blurs = [r.get("blur") for r in leaf_results if r.get("blur") is not None]
        leaf_ratios = [r.get("plant_ratio") for r in leaf_results if r.get("plant_ratio") is not None]

        print("\n═══ SUGGESTED THRESHOLDS (target <3% false-reject on leaves) ═══")
        if leaf_blurs:
            p3_blur = np.percentile(leaf_blurs, 3)
            print(f"  BLUR_THRESHOLD: current={GUARD_CONFIG['BLUR_THRESHOLD']}, "
                  f"3rd percentile of leaf blurs={p3_blur:.1f} → suggest max({p3_blur:.0f}, current)")
        if leaf_ratios:
            p3_ratio = np.percentile(leaf_ratios, 3)
            print(f"  MIN_PLANT_RATIO: current={GUARD_CONFIG['MIN_PLANT_RATIO']}, "
                  f"3rd percentile of leaf ratios={p3_ratio:.4f} → suggest min({p3_ratio:.4f}, current)")


if __name__ == "__main__":
    main()
