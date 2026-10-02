import base64
import numpy as np
import cv2
import tensorflow as tf


def find_last_conv_layer(model):
    """
    Search backwards through model layers to locate the last Conv2D layer.
    Handles both plain CNN models and nested models (e.g., pretrained base models).

    Returns:
        tuple: (target_layer, parent_model_or_None)
    """
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D) or 'Conv2D' in layer.__class__.__name__:
            return layer, None
        if isinstance(layer, tf.keras.Model):
            for sub_layer in reversed(layer.layers):
                if isinstance(sub_layer, tf.keras.layers.Conv2D) or 'Conv2D' in sub_layer.__class__.__name__:
                    return sub_layer, layer
    raise ValueError("No Conv2D layer found in the model.")


def make_gradcam_heatmap(model, img_array, class_index=None):
    """
    Computes a Grad-CAM heatmap for a given input image array and Keras model.

    Args:
        model: tf.keras.Model (plain CNN or nested base model)
        img_array: Preprocessed numpy array of shape (1, H, W, 3)
        class_index: Optional int. Target class index. If None, uses top predicted class.

    Returns:
        tuple: (heatmap, class_index)
            - heatmap: 2D numpy array with values normalized to [0, 1]
            - class_index: int, the class index for which the heatmap was computed
    """
    target_layer, parent_model = find_last_conv_layer(model)

    img_tensor = tf.cast(img_array, tf.float32)

    if parent_model is None:
        # Standard flat CNN or functional model
        grad_model = tf.keras.models.Model(
            inputs=model.inputs,
            outputs=[target_layer.output, model.output]
        )
        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(img_tensor)
            if class_index is None:
                class_index = int(tf.argmax(predictions[0]))
            loss = predictions[:, class_index]
        grads = tape.gradient(loss, conv_outputs)
    else:
        # Pretrained base model nested inside top-level model
        sub_grad_model = tf.keras.models.Model(
            inputs=parent_model.inputs,
            outputs=[target_layer.output, parent_model.output]
        )
        parent_idx = model.layers.index(parent_model)
        head_layers = model.layers[parent_idx + 1:]

        with tf.GradientTape() as tape:
            conv_outputs, sub_outputs = sub_grad_model(img_tensor)
            x = sub_outputs
            for layer in head_layers:
                x = layer(x)
            predictions = x
            if class_index is None:
                class_index = int(tf.argmax(predictions[0]))
            loss = predictions[:, class_index]
        grads = tape.gradient(loss, conv_outputs)

    if grads is None:
        raise ValueError("Could not compute gradients for Grad-CAM.")

    # Global average pooling of gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight the channels of the feature map by the gradient importance
    conv_outputs_val = conv_outputs[0]
    heatmap = conv_outputs_val @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU to focus on positive influences
    heatmap = tf.maximum(heatmap, 0)
    max_val = tf.math.reduce_max(heatmap)
    if max_val > 0:
        heatmap = heatmap / max_val
    else:
        heatmap = tf.zeros_like(heatmap)

    return heatmap.numpy(), class_index


def overlay_heatmap(original_bgr, heatmap, alpha=0.4):
    """
    Resizes the heatmap to match the original image size, applies COLORMAP_JET,
    and blends it with the original BGR image.

    Args:
        original_bgr: numpy.ndarray of shape (H, W, 3) in uint8 BGR format
        heatmap: 2D numpy.ndarray normalized in [0, 1]
        alpha: float, blending factor for the heatmap overlay (default 0.4)

    Returns:
        numpy.ndarray: Blended BGR image of same shape and uint8 type as original_bgr
    """
    h, w = original_bgr.shape[:2]
    resized_heatmap = cv2.resize(heatmap, (w, h))

    # Scale heatmap to [0, 255] and convert to uint8
    heatmap_uint8 = np.uint8(255 * np.clip(resized_heatmap, 0, 1))

    # Apply COLORMAP_JET
    color_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    # Blend original and heatmap
    overlay = cv2.addWeighted(color_heatmap, alpha, original_bgr, 1 - alpha, 0)
    return overlay


def to_base64_jpg(bgr_image):
    """
    Encodes a BGR image to base64 JPEG format.

    Args:
        bgr_image: numpy.ndarray in BGR uint8 format

    Returns:
        str: Base64-encoded string representing the JPEG image
    """
    success, buffer = cv2.imencode('.jpg', bgr_image)
    if not success:
        raise ValueError("Failed to encode image to JPEG format.")
    return base64.b64encode(buffer).decode('utf-8')
