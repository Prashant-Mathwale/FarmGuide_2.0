"""
test_input_guard.py — Pytest tests for input_guard module.

Run:  python -m pytest test_input_guard.py -v
"""

import os
import sys
import json
import math
import numpy as np
import cv2
import pytest

# Ensure imports work from the ml/ directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from input_guard import (
    decode_image, check_resolution, compute_blur_score, check_blur,
    compute_brightness, check_exposure, run_gate_a,
    compute_plant_ratio, run_gate_b,
    compute_confidence_metrics, run_gate_c,
)
from guard_config import GUARD_CONFIG


# ═══════════════════════════════════════════════════════════════════
# Helpers: synthetic image generators
# ═══════════════════════════════════════════════════════════════════

def make_solid_image(color_bgr, size=(300, 300)):
    """Create a solid-colour BGR image."""
    img = np.full((size[1], size[0], 3), color_bgr, dtype=np.uint8)
    return img


def encode_to_bytes(img_bgr, ext=".jpg"):
    """Encode a BGR numpy array to bytes."""
    ok, buf = cv2.imencode(ext, img_bgr)
    assert ok
    return buf.tobytes()


def make_green_image(size=(300, 300)):
    """Green image simulating a leaf."""
    return make_solid_image((30, 120, 50), size)  # BGR: dark green


def make_brown_spotted_green_image(size=(300, 300)):
    """Green with brown spots — simulating a diseased leaf."""
    img = make_solid_image((40, 130, 60), size)  # Green base
    # Add brown spots
    for cx, cy in [(100, 100), (200, 150), (150, 250)]:
        cv2.circle(img, (cx, cy), 30, (20, 60, 120), -1)  # BGR brown
    return img


def make_blurred_noise(size=(300, 300)):
    """Random noise heavily blurred — should trigger blur check."""
    noise = np.random.randint(0, 256, (size[1], size[0], 3), dtype=np.uint8)
    blurred = cv2.GaussianBlur(noise, (51, 51), 30)
    return blurred


# ═══════════════════════════════════════════════════════════════════
# Gate A tests
# ═══════════════════════════════════════════════════════════════════

class TestGateA:
    def test_decode_valid_image(self):
        img = make_green_image()
        raw = encode_to_bytes(img)
        decoded, err = decode_image(raw)
        assert decoded is not None
        assert err is None

    def test_decode_invalid_bytes(self):
        decoded, err = decode_image(b"this is not an image")
        assert decoded is None
        assert err is not None

    def test_resolution_ok(self):
        img = make_green_image((200, 200))
        ok, reason = check_resolution(img)
        assert ok is True

    def test_resolution_too_small(self):
        img = make_green_image((50, 50))
        ok, reason = check_resolution(img)
        assert ok is False
        assert "too small" in reason.lower()

    def test_blur_sharp_image(self):
        # A sharp image with clear edges (checkerboard)
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        img[::2, ::2] = 255
        ok, reason, score = check_blur(img)
        assert score > GUARD_CONFIG["BLUR_THRESHOLD"]
        assert ok is True

    def test_blur_blurry_image(self):
        blurred = make_blurred_noise()
        ok, reason, score = check_blur(blurred)
        assert score < GUARD_CONFIG["BLUR_THRESHOLD"]
        assert ok is False

    def test_exposure_dark(self):
        dark = make_solid_image((10, 10, 10))
        ok, reason, brightness = check_exposure(dark)
        assert ok is False
        assert "dark" in reason.lower()

    def test_exposure_bright(self):
        bright = make_solid_image((250, 250, 250))
        ok, reason, brightness = check_exposure(bright)
        assert ok is False
        assert "bright" in reason.lower()

    def test_exposure_normal(self):
        normal = make_solid_image((128, 128, 128))
        ok, reason, brightness = check_exposure(normal)
        assert ok is True

    def test_gate_a_invalid_image(self):
        result = run_gate_a(b"not an image")
        assert result["passed"] is False
        assert result["status"] == "invalid_image"

    def test_gate_a_poor_quality_dark(self):
        dark = make_solid_image((5, 5, 5))
        raw = encode_to_bytes(dark)
        result = run_gate_a(raw)
        assert result["passed"] is False
        assert result["status"] == "poor_quality"

    def test_gate_a_pass_normal(self):
        # Use a textured green image (gradient + noise) so it passes blur check
        img = make_green_image()
        # Add gradient and noise for texture
        for y in range(img.shape[0]):
            img[y, :, 1] = np.clip(img[y, :, 1].astype(int) + y // 3, 0, 255).astype(np.uint8)
        noise = np.random.randint(-20, 20, img.shape, dtype=np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        raw = encode_to_bytes(img)
        result = run_gate_a(raw)
        assert result["passed"] is True, f"Expected pass but got: {result}"
        assert result["quality"]["blur_score"] is not None
        assert result["quality"]["brightness"] is not None


# ═══════════════════════════════════════════════════════════════════
# Gate B tests
# ═══════════════════════════════════════════════════════════════════

class TestGateB:
    def test_green_image_passes(self):
        img = make_green_image()
        result = run_gate_b(img)
        assert result["passed"] is True
        assert result["plant_ratio"] > GUARD_CONFIG["MIN_PLANT_RATIO"]

    def test_brown_spotted_green_passes(self):
        """Diseased leaf with brown spots should still pass."""
        img = make_brown_spotted_green_image()
        result = run_gate_b(img)
        assert result["passed"] is True

    def test_pure_white_rejected(self):
        """Pure white image = not a leaf."""
        img = make_solid_image((255, 255, 255))
        result = run_gate_b(img)
        assert result["passed"] is False
        assert result["status"] == "not_a_leaf"

    def test_pure_black_rejected(self):
        """Pure black image = not a leaf."""
        img = make_solid_image((0, 0, 0))
        result = run_gate_b(img)
        assert result["passed"] is False
        assert result["status"] == "not_a_leaf"

    def test_blue_sky_rejected(self):
        """Blue sky image = not a leaf."""
        img = make_solid_image((200, 100, 20))  # BGR blue
        result = run_gate_b(img)
        assert result["passed"] is False
        assert result["status"] == "not_a_leaf"


# ═══════════════════════════════════════════════════════════════════
# Gate C tests
# ═══════════════════════════════════════════════════════════════════

class TestGateC:
    def _make_probs(self, n=38, top1_val=0.95):
        """Create a probability vector with top1_val for class 0, rest uniform."""
        probs = np.full(n, (1.0 - top1_val) / (n - 1))
        probs[0] = top1_val
        return probs

    def test_confident_prediction(self):
        probs = self._make_probs(top1_val=0.95)
        result = run_gate_c(probs)
        assert result["status"] == "ok"

    def test_borderline_prediction(self):
        """top1 between LOW_CONF and HIGH_CONF → possible."""
        probs = self._make_probs(top1_val=0.65)
        result = run_gate_c(probs)
        assert result["status"] == "possible"

    def test_low_confidence_prediction(self):
        """top1 below LOW_CONF → uncertain."""
        probs = self._make_probs(top1_val=0.30)
        result = run_gate_c(probs)
        assert result["status"] == "uncertain"

    def test_uniform_distribution(self):
        """Uniform distribution → high entropy → uncertain."""
        probs = np.full(38, 1.0 / 38)
        result = run_gate_c(probs)
        assert result["status"] == "uncertain"
        assert "entropy" in " ".join(result["reasons"]).lower()

    def test_narrow_margin(self):
        """Two classes close together → possible."""
        probs = np.full(38, 0.005)
        probs[0] = 0.60
        probs[1] = 0.50
        # Renormalize
        probs = probs / probs.sum()
        result = run_gate_c(probs)
        assert result["status"] in ("possible", "uncertain")

    def test_metrics_computed(self):
        probs = self._make_probs(top1_val=0.90)
        result = run_gate_c(probs)
        assert "top1" in result["confidence_metrics"]
        assert "margin" in result["confidence_metrics"]
        assert "entropy" in result["confidence_metrics"]

    def test_gate_b_borderline_downgrades(self):
        """Borderline Gate B + not HIGH_CONF → uncertain."""
        probs = self._make_probs(top1_val=0.70)
        result = run_gate_c(probs, gate_b_borderline=True)
        assert result["status"] == "uncertain"


# ═══════════════════════════════════════════════════════════════════
# Endpoint tests (via FastAPI TestClient)
# ═══════════════════════════════════════════════════════════════════

class TestEndpoint:
    @pytest.fixture(autouse=True)
    def setup_client(self):
        """Set up TestClient once."""
        from fastapi.testclient import TestClient
        import app as ml_app
        self.client = TestClient(ml_app.app)
        self.ml_app = ml_app

    def _find_leaf_image(self):
        """Find a real leaf image for testing."""
        test_dir = os.path.join("dataset", "plantvillage dataset", "color", "Tomato___Early_blight")
        if os.path.isdir(test_dir):
            files = [f for f in os.listdir(test_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if files:
                return os.path.join(test_dir, files[0])
        return None

    def test_valid_leaf_returns_ok_or_possible(self):
        """A valid leaf image should return status ok or possible with all old fields."""
        img_path = self._find_leaf_image()
        if img_path is None:
            pytest.skip("No test leaf image available")
        with open(img_path, "rb") as f:
            resp = self.client.post("/predict_disease", files={"file": ("test.jpg", f, "image/jpeg")})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["status"] in ("ok", "possible")
        # Old fields must be present
        assert "disease" in data
        assert "confidence" in data
        assert "treatment" in data
        assert "heatmap" in data
        # New fields
        assert "status" in data
        assert "quality" in data
        assert "confidence_metrics" in data

    def test_corrupt_file_returns_invalid_image(self):
        """A non-image file should return invalid_image status."""
        from io import BytesIO
        resp = self.client.post(
            "/predict_disease",
            files={"file": ("test.txt", BytesIO(b"this is not an image at all"), "application/octet-stream")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["status"] == "invalid_image"

    def test_non_leaf_returns_not_a_leaf(self):
        """A textured non-leaf image should be rejected as not_a_leaf."""
        # Use a textured blue image so it passes Gate A (blur) but fails Gate B (not a leaf)
        blue = make_solid_image((200, 80, 10), (300, 300))  # BGR blue
        # Add gradient and noise so blur check passes
        for y in range(blue.shape[0]):
            blue[y, :, 0] = np.clip(blue[y, :, 0].astype(int) + y // 3, 0, 255).astype(np.uint8)
        noise = np.random.randint(-15, 15, blue.shape, dtype=np.int16)
        blue = np.clip(blue.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        raw = encode_to_bytes(blue)
        from io import BytesIO
        resp = self.client.post(
            "/predict_disease",
            files={"file": ("blue.jpg", BytesIO(raw), "image/jpeg")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        # Should be rejected by either Gate A (poor_quality) or Gate B (not_a_leaf)
        assert data["status"] in ("not_a_leaf", "poor_quality")
        # Model should NOT have been called — disease should be null
        assert data["disease"] is None

    def test_fail_open_when_guard_raises(self):
        """If a guard function crashes, prediction should still work."""
        img_path = self._find_leaf_image()
        if img_path is None:
            pytest.skip("No test leaf image available")

        # Monkeypatch run_gate_a to crash
        original = self.ml_app.run_gate_a

        def crashing_gate_a(*args, **kwargs):
            raise RuntimeError("Simulated gate crash")

        try:
            self.ml_app.run_gate_a = crashing_gate_a
            with open(img_path, "rb") as f:
                resp = self.client.post("/predict_disease", files={"file": ("test.jpg", f, "image/jpeg")})
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            # Should still return a prediction (fail-open)
            assert data["status"] == "ok" or data["disease"] is not None
            assert "Quality check skipped" in str(data.get("warnings", []))
        finally:
            self.ml_app.run_gate_a = original

    def test_regression_classifier_output_unchanged(self):
        """
        Prove the classifier output for a known image is identical
        with and without the guard layer.
        """
        img_path = self._find_leaf_image()
        if img_path is None:
            pytest.skip("No test leaf image available")

        # Run with guards
        with open(img_path, "rb") as f:
            resp_with = self.client.post("/predict_disease", files={"file": ("test.jpg", f, "image/jpeg")})
        data_with = resp_with.json()

        # Run with guards disabled (monkeypatch to None)
        orig_a = self.ml_app.run_gate_a
        orig_b = self.ml_app.run_gate_b
        orig_c = self.ml_app.run_gate_c
        try:
            self.ml_app.run_gate_a = None
            self.ml_app.run_gate_b = None
            self.ml_app.run_gate_c = None
            with open(img_path, "rb") as f:
                resp_without = self.client.post("/predict_disease", files={"file": ("test.jpg", f, "image/jpeg")})
            data_without = resp_without.json()
        finally:
            self.ml_app.run_gate_a = orig_a
            self.ml_app.run_gate_b = orig_b
            self.ml_app.run_gate_c = orig_c

        # The classifier output (disease name and confidence) should be identical
        assert data_with.get("disease") == data_without.get("disease"), \
            f"Disease mismatch: {data_with.get('disease')} vs {data_without.get('disease')}"
        if data_with.get("confidence") is not None and data_without.get("confidence") is not None:
            assert abs(data_with["confidence"] - data_without["confidence"]) < 0.01, \
                f"Confidence mismatch: {data_with['confidence']} vs {data_without['confidence']}"
