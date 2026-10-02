"""
input_guard.py — Pre- and post-prediction checks for the disease classifier.

Each gate is an individually testable pure function.
All thresholds come from guard_config.GUARD_CONFIG.
If any gate function raises, the caller must fail open (log + return normal prediction).
"""

import math
import logging
import numpy as np
import cv2

from guard_config import GUARD_CONFIG

logger = logging.getLogger("input_guard")

# ─────────────────────────────────────────────────────────────────────────────
# Gate A: Image quality checks (runs on raw uploaded bytes, before the model)
# ─────────────────────────────────────────────────────────────────────────────

def decode_image(raw_bytes: bytes):
    """
    Attempt to decode raw bytes into a BGR numpy image via OpenCV.
    Returns (image_bgr, None) on success or (None, error_string) on failure.
    """
    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None, "File could not be decoded as an image."
    return img, None


def check_resolution(img_bgr, cfg=GUARD_CONFIG):
    """Return (ok: bool, reason: str|None). Reject if shorter side < MIN_SIDE."""
    h, w = img_bgr.shape[:2]
    short_side = min(h, w)
    if short_side < cfg["MIN_SIDE"]:
        return False, f"Image too small ({w}×{h} px, minimum {cfg['MIN_SIDE']} px on shorter side)"
    return True, None


def compute_blur_score(img_bgr, cfg=GUARD_CONFIG):
    """
    Downscale large images to a fixed width so the Laplacian variance
    is comparable across different input sizes, without upscaling smaller images.
    Returns the Laplacian variance (higher = sharper).
    """
    target_w = cfg["BLUR_RESIZE_WIDTH"]
    h, w = img_bgr.shape[:2]
    if w > target_w:
        scale = target_w / w
        resized = cv2.resize(img_bgr, (target_w, int(h * scale)))
    else:
        resized = img_bgr
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def check_blur(img_bgr, cfg=GUARD_CONFIG):
    """Return (ok, reason, blur_score)."""
    score = compute_blur_score(img_bgr, cfg)
    if score < cfg["BLUR_THRESHOLD"]:
        return False, f"Image is too blurry (blur score {score:.1f} < {cfg['BLUR_THRESHOLD']})", score
    return True, None, score


def compute_brightness(img_bgr):
    """Mean brightness of the grayscale version (0-255)."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    return float(gray.mean())


def check_exposure(img_bgr, cfg=GUARD_CONFIG):
    """Return (ok, reason, brightness)."""
    brightness = compute_brightness(img_bgr)
    if brightness < cfg["DARK_THRESHOLD"]:
        return False, f"Image is too dark (brightness {brightness:.0f} < {cfg['DARK_THRESHOLD']})", brightness
    if brightness > cfg["BRIGHT_THRESHOLD"]:
        return False, f"Image is too bright (brightness {brightness:.0f} > {cfg['BRIGHT_THRESHOLD']})", brightness
    return True, None, brightness


def run_gate_a(raw_bytes: bytes, cfg=GUARD_CONFIG):
    """
    Run all Gate A checks.
    Returns a dict:
      { "passed": bool,
        "status": str | None,           # "invalid_image" or "poor_quality"
        "message": str | None,
        "reasons": [str],
        "quality": {"blur_score": float, "brightness": float} }
    """
    # 1. Decode
    img_bgr, err = decode_image(raw_bytes)
    if img_bgr is None:
        return {
            "passed": False,
            "status": "invalid_image",
            "message": "We couldn't read this file. Please try another image.",
            "reasons": [err],
            "quality": {"blur_score": None, "brightness": None},
            "img_bgr": None,
        }

    reasons = []
    quality = {"blur_score": None, "brightness": None}

    # 2. Resolution
    ok, reason = check_resolution(img_bgr, cfg)
    if not ok:
        reasons.append(reason)

    # 3. Blur
    ok, reason, blur = check_blur(img_bgr, cfg)
    quality["blur_score"] = float(round(blur, 2))
    if not ok:
        reasons.append(reason)

    # 4. Exposure
    ok, reason, brightness = check_exposure(img_bgr, cfg)
    quality["brightness"] = float(round(brightness, 2))
    if not ok:
        reasons.append(reason)

    if reasons:
        return {
            "passed": False,
            "status": "poor_quality",
            "message": "The photo quality is too low for reliable analysis. " + " ".join(reasons),
            "reasons": reasons,
            "quality": quality,
            "img_bgr": img_bgr,
        }

    return {
        "passed": True,
        "status": None,
        "message": None,
        "reasons": [],
        "quality": quality,
        "img_bgr": img_bgr,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gate B: "Is this plausibly a plant leaf?" — HSV colour heuristic
# ─────────────────────────────────────────────────────────────────────────────

def compute_plant_ratio(img_bgr, cfg=GUARD_CONFIG):
    """
    Fraction of pixels that fall into a broad "plant tissue" colour range.
    Covers green, yellow-green, yellow, brown/reddish, dark-spotted tones
    (diseased leaves are often NOT green).

    Excludes:
      - Very low saturation (grey/white/black backgrounds)
      - Likely skin tones (narrow orange-pink band with medium saturation)
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    total_pixels = h.size

    # ── Exclude low-saturation pixels (grey / white / near-black) ──
    # These are backgrounds, paper, metal, concrete, etc.
    low_sat = s < 25
    very_dark = v < 30

    # ── Exclude likely skin tones ──
    # Skin in HSV: roughly H 0-25, S 40-180, V 80-255
    skin_mask = (h <= 25) & (s >= 40) & (s <= 180) & (v >= 80)

    # ── Plant tissue ranges (OpenCV H is 0-179) ──
    # Green:        H 25-95,  S ≥ 25, V ≥ 30
    # Yellow/amber: H 15-35,  S ≥ 40, V ≥ 40
    # Brown/red:    H 0-20,   S ≥ 30, V 30-200  (necrotic spots, rust)
    # Dark spots:   H 0-179,  S ≥ 20, V 20-80   (fungal dark patches)

    green   = (h >= 25) & (h <= 95)  & (s >= 25) & (v >= 30)
    yellow  = (h >= 15) & (h <= 35)  & (s >= 40) & (v >= 40)
    brown   = (h <= 20)              & (s >= 30) & (v >= 30) & (v <= 200)
    dark_patch = (s >= 20) & (v >= 20) & (v <= 80)

    plant_mask = (green | yellow | brown | dark_patch) & ~low_sat & ~very_dark & ~skin_mask

    plant_count = int(np.count_nonzero(plant_mask))
    return plant_count / total_pixels if total_pixels > 0 else 0.0


def run_gate_b(img_bgr, cfg=GUARD_CONFIG):
    """
    Returns:
      { "passed": bool,
        "borderline": bool,    # True when ratio is between MIN and BORDERLINE
        "status": str | None,
        "message": str | None,
        "reasons": [str],
        "plant_ratio": float }
    """
    ratio = compute_plant_ratio(img_bgr, cfg)
    plant_ratio = float(round(ratio, 4))

    if ratio < cfg["MIN_PLANT_RATIO"]:
        return {
            "passed": False,
            "borderline": False,
            "status": "not_a_leaf",
            "message": "This doesn't look like a plant leaf. Please upload a clear photo of a single leaf.",
            "reasons": [f"Plant-colour pixel ratio too low ({plant_ratio:.2%} < {cfg['MIN_PLANT_RATIO']:.0%})"],
            "plant_ratio": plant_ratio,
        }

    borderline = ratio < cfg["BORDERLINE_PLANT_RATIO"]
    return {
        "passed": True,
        "borderline": borderline,
        "status": None,
        "message": None,
        "reasons": [],
        "plant_ratio": plant_ratio,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gate C: Model-confidence checks (after prediction, on softmax vector)
# ─────────────────────────────────────────────────────────────────────────────

def compute_confidence_metrics(probs, cfg=GUARD_CONFIG):
    """
    Given a 1-D numpy array of softmax probabilities, compute diagnostic metrics.
    Returns dict with top1, top2, margin, normalized_entropy, top_indices.
    """
    num_classes = len(probs)
    sorted_idx = np.argsort(probs)[::-1]
    top1 = float(probs[sorted_idx[0]])
    top2 = float(probs[sorted_idx[1]]) if num_classes > 1 else 0.0
    margin = top1 - top2

    # Normalized Shannon entropy: 0 = certain, 1 = uniform
    eps = 1e-12
    entropy = -np.sum(probs * np.log(probs + eps))
    max_entropy = math.log(num_classes)
    norm_entropy = entropy / max_entropy if max_entropy > 0 else 0.0

    return {
        "top1": float(round(top1, 6)),
        "top2": float(round(top2, 6)),
        "margin": float(round(margin, 6)),
        "entropy": float(round(norm_entropy, 6)),
        "top_indices": sorted_idx[:3].tolist(),
    }


def run_gate_c(probs, gate_b_borderline=False, cfg=GUARD_CONFIG):
    """
    Decide status based on model output probabilities.
    Returns:
      { "status": "ok" | "possible" | "uncertain",
        "message": str,
        "reasons": [str],
        "confidence_metrics": dict,
        "top_indices": [int, int, int] }
    """
    metrics = compute_confidence_metrics(probs, cfg)
    reasons = []

    # ── Uncertain (low confidence or high entropy) ──
    is_uncertain = False
    if metrics["top1"] < cfg["LOW_CONF"]:
        reasons.append(f"Top-1 confidence too low ({metrics['top1']:.2%} < {cfg['LOW_CONF']:.0%})")
        is_uncertain = True
    if metrics["entropy"] > cfg["MAX_ENTROPY"]:
        reasons.append(f"Prediction entropy too high ({metrics['entropy']:.3f} > {cfg['MAX_ENTROPY']})")
        is_uncertain = True
    # Borderline Gate B + not high conf → downgrade to uncertain
    if gate_b_borderline and metrics["top1"] < cfg["HIGH_CONF"]:
        reasons.append("Image may not be a leaf and confidence is not high enough to override")
        is_uncertain = True

    if is_uncertain:
        return {
            "status": "uncertain",
            "message": "We could not identify this reliably. Please retake the photo with better lighting and framing.",
            "reasons": reasons,
            "confidence_metrics": {
                "top1": metrics["top1"],
                "margin": metrics["margin"],
                "entropy": metrics["entropy"],
            },
            "top_indices": metrics["top_indices"],
        }

    # ── Possible (medium confidence or low margin) ──
    is_possible = False
    if metrics["top1"] < cfg["HIGH_CONF"]:
        reasons.append(f"Top-1 confidence below high-confidence threshold ({metrics['top1']:.2%} < {cfg['HIGH_CONF']:.0%})")
        is_possible = True
    if metrics["margin"] < cfg["MIN_MARGIN"]:
        reasons.append(f"Margin between top-1 and top-2 is narrow ({metrics['margin']:.2%} < {cfg['MIN_MARGIN']:.0%})")
        is_possible = True

    if is_possible:
        return {
            "status": "possible",
            "message": "This is a possible match. Please verify with an expert or retake the photo.",
            "reasons": reasons,
            "confidence_metrics": {
                "top1": metrics["top1"],
                "margin": metrics["margin"],
                "entropy": metrics["entropy"],
            },
            "top_indices": metrics["top_indices"],
        }

    # ── OK ──
    return {
        "status": "ok",
        "message": "Diagnosis complete.",
        "reasons": [],
        "confidence_metrics": {
            "top1": metrics["top1"],
            "margin": metrics["margin"],
            "entropy": metrics["entropy"],
        },
        "top_indices": metrics["top_indices"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gate D: CLIP zero-shot leaf check (stub, OFF by default)
# ─────────────────────────────────────────────────────────────────────────────

def run_gate_d(img_bgr, cfg=GUARD_CONFIG):
    """
    Optional zero-shot CLIP check: "a photo of a plant leaf" vs "a photo of something else".

    Currently a stub. To enable:
      1. pip install transformers torch
      2. Set USE_CLIP_LEAF_CHECK = True in guard_config.py
      3. Implement the CLIP inference below.

    Returns:
      { "passed": bool, "clip_leaf_score": float | None }
    """
    if not cfg.get("USE_CLIP_LEAF_CHECK", False):
        return {"passed": True, "clip_leaf_score": None}

    # ── TODO: Implement CLIP zero-shot classification ──
    # from transformers import CLIPProcessor, CLIPModel
    # model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    # processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    # inputs = processor(
    #     text=["a photo of a plant leaf", "a photo of something else"],
    #     images=[Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))],
    #     return_tensors="pt", padding=True
    # )
    # outputs = model(**inputs)
    # probs = outputs.logits_per_image.softmax(dim=1)[0]
    # leaf_score = float(probs[0])
    # return {"passed": leaf_score > 0.5, "clip_leaf_score": leaf_score}

    logger.warning("CLIP leaf check is enabled but not implemented; passing through.")
    return {"passed": True, "clip_leaf_score": None}
