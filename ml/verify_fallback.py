import os
import io
import unittest
from fastapi.testclient import TestClient
import app
import gradcam

class TestGradCamFallback(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app.app)
        # Find a test image
        dataset_dir = "dataset/plantvillage dataset/color/Apple___Apple_scab"
        files = [f for f in os.listdir(dataset_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        self.test_img_path = os.path.join(dataset_dir, files[0])

    def test_forced_gradcam_failure(self):
        # Save original function
        original_make_gradcam = app.make_gradcam_heatmap

        try:
            # Force make_gradcam_heatmap to fail
            def failing_gradcam(*args, **kwargs):
                raise RuntimeError("Forced simulation error in Grad-CAM computation")

            app.make_gradcam_heatmap = failing_gradcam

            with open(self.test_img_path, "rb") as f:
                response = self.client.post(
                    "/predict_disease",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )

            self.assertEqual(response.status_code, 200)
            data = response.json()
            print("\n[Grad-CAM Forced Failure Test Response]:")
            print("  status_code:", response.status_code)
            print("  success:", data.get("success"))
            print("  disease:", data.get("disease"))
            print("  confidence:", data.get("confidence"))
            print("  heatmap:", data.get("heatmap"))
            
            self.assertTrue(data.get("success"))
            self.assertIsNotNone(data.get("disease"))
            self.assertIsNotNone(data.get("confidence"))
            self.assertIsNone(data.get("heatmap"))
            print("\n--- Fallback test PASSED: Prediction succeeded with heatmap=null when Grad-CAM failed! ---")

        finally:
            # Restore original function
            app.make_gradcam_heatmap = original_make_gradcam

if __name__ == "__main__":
    unittest.main()
