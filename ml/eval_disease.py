"""
=============================================================================
FarmGuide Disease Detection Model Evaluation Script (Phase A)
=============================================================================

Usage:
    # Run evaluation with default parameters (div255, baseline reports):
    python eval_disease.py

    # Run with MobileNetV2 preprocessing:
    python eval_disease.py --preprocess mobilenet

    # Specify custom dataset, model, and report directories:
    python eval_disease.py --data_dir dataset/real_test \
                           --output_dir reports/baseline \
                           --model_path models/disease_model.h5 \
                           --classes_path models/disease_classes.json \
                           --preprocess div255

Description:
    Evaluates the current disease classification model on real-world test images.
    - Input folder structure:
        dataset/real_test/<class_name>/*.jpg|png
        dataset/real_test/Not_A_Plant/*.jpg|png (optional out-of-domain folder)
    - Output files in output_dir:
        - metrics.json
        - per_class_report.csv
        - confusion_matrix.png
        - confidence_histogram.png
        - misclassified.csv
=============================================================================
"""

import os
import sys

# Ensure UTF-8 output on Windows console if supported
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import json
import random
import argparse
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image

# Suppress TensorFlow verbose logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import tensorflow as tf
import matplotlib
matplotlib.use('Agg')  # Headless backend for saving figures without display
import matplotlib.pyplot as plt
from sklearn.metrics import (
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)


def set_seed(seed=42):
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate Plant Disease Detection Model on Real-World Photos."
    )
    parser.add_argument(
        "--data_dir",
        type=str,
        default="dataset/real_test",
        help="Path to real_test directory containing class subfolders."
    )
    parser.add_argument(
        "--model_path",
        type=str,
        default="models/disease_model.h5",
        help="Path to saved Keras/TF model (.h5)."
    )
    parser.add_argument(
        "--classes_path",
        type=str,
        default="models/disease_classes.json",
        help="Path to JSON file containing class labels list."
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="reports/baseline",
        help="Directory where evaluation reports will be saved."
    )
    parser.add_argument(
        "--preprocess",
        type=str,
        choices=["div255", "mobilenet"],
        default="div255",
        help="Preprocessing method: 'div255' (scaled /255) or 'mobilenet' ([-1, 1])."
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=32,
        help="Inference batch size."
    )
    parser.add_argument(
        "--img_size",
        type=int,
        default=224,
        help="Image input dimensions (width and height)."
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic behavior."
    )
    return parser.parse_args()


def preprocess_image(img, preprocess_mode="div255"):
    """Convert PIL image to numpy array with chosen preprocessing."""
    arr = np.array(img, dtype=np.float32)
    if preprocess_mode == "div255":
        return arr / 255.0
    elif preprocess_mode == "mobilenet":
        return tf.keras.applications.mobilenet_v2.preprocess_input(arr)
    else:
        raise ValueError(f"Unknown preprocessing mode: {preprocess_mode}")


def load_dataset(data_dir, disease_classes):
    """
    Scans data_dir for valid class folders and optional Not_A_Plant folder.
    Returns:
        leaf_records: list of dicts with 'path', 'class_name', 'class_idx'
        not_a_plant_records: list of dicts with 'path'
    """
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    class_to_idx = {name: i for i, name in enumerate(disease_classes)}
    
    leaf_records = []
    not_a_plant_records = []

    if not os.path.isdir(data_dir):
        print(f"Warning: data_dir '{data_dir}' does not exist.")
        return leaf_records, not_a_plant_records

    subdirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]

    for subdir in subdirs:
        dir_path = os.path.join(data_dir, subdir)
        image_files = [
            os.path.join(dir_path, f)
            for f in os.listdir(dir_path)
            if Path(f).suffix.lower() in valid_extensions
        ]

        if not image_files:
            continue  # Gracefully ignore empty class folders

        if subdir.lower() == "not_a_plant":
            for img_path in image_files:
                not_a_plant_records.append({"path": img_path})
        elif subdir in class_to_idx:
            c_idx = class_to_idx[subdir]
            for img_path in image_files:
                leaf_records.append({
                    "path": img_path,
                    "class_name": subdir,
                    "class_idx": c_idx
                })
        else:
            print(f"Notice: Ignoring directory '{subdir}' as it is not in disease_classes.json and not 'Not_A_Plant'.")

    return leaf_records, not_a_plant_records


def run_batch_inference(model, records, img_size, preprocess_mode, batch_size):
    """
    Loads images in batches and generates model predictions.
    Returns:
        predictions: np.ndarray of shape (N, num_classes)
        valid_indices: list of indices in records that loaded successfully
    """
    all_predictions = []
    valid_indices = []

    for i in range(0, len(records), batch_size):
        batch_records = records[i:i + batch_size]
        batch_images = []
        batch_valid = []

        for offset, rec in enumerate(batch_records):
            p = rec["path"]
            try:
                with Image.open(p) as img:
                    img_rgb = img.convert("RGB").resize((img_size, img_size))
                    processed = preprocess_image(img_rgb, preprocess_mode)
                    batch_images.append(processed)
                    batch_valid.append(i + offset)
            except Exception as e:
                print(f"Warning: Failed to load image {p}: {e}")

        if batch_images:
            batch_array = np.array(batch_images)
            preds = model.predict(batch_array, verbose=0)
            all_predictions.append(preds)
            valid_indices.extend(batch_valid)

    if all_predictions:
        return np.vstack(all_predictions), valid_indices
    return np.empty((0, model.output_shape[-1])), []


def plot_confusion_matrix(cm, class_names, output_path):
    """Renders and saves a normalized confusion matrix plot using matplotlib."""
    # Compute normalized confusion matrix for present classes
    with np.errstate(divide='ignore', invalid='ignore'):
        cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        cm_norm = np.nan_to_num(cm_norm)

    n_classes = len(class_names)
    fig_dim = max(10, min(24, int(n_classes * 0.45)))
    fig, ax = plt.subplots(figsize=(fig_dim, fig_dim))

    im = ax.imshow(cm_norm, interpolation='nearest', cmap=plt.cm.Blues, vmin=0.0, vmax=1.0)
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    ax.set(
        xticks=np.arange(n_classes),
        yticks=np.arange(n_classes),
        xticklabels=class_names,
        yticklabels=class_names,
        title="Normalized Confusion Matrix",
        ylabel="True Class",
        xlabel="Predicted Class"
    )
    plt.setp(ax.get_xticklabels(), rotation=90, ha="right", rotation_mode="anchor", fontsize=8)
    plt.setp(ax.get_yticklabels(), fontsize=8)

    # Annotate cells with values if class count is small, else keep clean
    if n_classes <= 15:
        thresh = cm_norm.max() / 2.0
        for i in range(n_classes):
            for j in range(n_classes):
                ax.text(
                    j, i, f"{cm[i, j]}\n({cm_norm[i, j]:.1%})",
                    ha="center", va="center",
                    color="white" if cm_norm[i, j] > thresh else "black",
                    fontsize=7
                )

    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close(fig)


def plot_confidence_histogram(correct_confs, incorrect_confs, not_a_plant_confs, output_path):
    """Renders and saves a confidence distribution histogram."""
    plt.figure(figsize=(10, 6))
    bins = np.linspace(0.0, 1.0, 21)

    if len(correct_confs) > 0:
        plt.hist(
            correct_confs, bins=bins, alpha=0.6,
            color='forestgreen', label=f'Correct Leaves (n={len(correct_confs)})',
            edgecolor='black'
        )
    if len(incorrect_confs) > 0:
        plt.hist(
            incorrect_confs, bins=bins, alpha=0.6,
            color='crimson', label=f'Misclassified Leaves (n={len(incorrect_confs)})',
            edgecolor='black'
        )
    if len(not_a_plant_confs) > 0:
        plt.hist(
            not_a_plant_confs, bins=bins, alpha=0.6,
            color='darkorange', label=f'Not A Plant OOD (n={len(not_a_plant_confs)})',
            edgecolor='black'
        )

    plt.title("Prediction Confidence Distribution (Max Softmax Probability)", fontsize=13, fontweight='bold')
    plt.xlabel("Max Softmax Confidence", fontsize=11)
    plt.ylabel("Sample Count", fontsize=11)
    plt.xlim(0.0, 1.0)
    plt.grid(True, linestyle='--', alpha=0.5)
    if len(correct_confs) > 0 or len(incorrect_confs) > 0 or len(not_a_plant_confs) > 0:
        plt.legend(loc='upper left', frameon=True)
    else:
        plt.text(0.5, 0.5, "No Predictions Available", ha="center", va="center", fontsize=11)
    plt.tight_layout()
    plt.savefig(output_path, dpi=200)
    plt.close()


def print_summary_table(metrics_data, per_class_df, output_dir):
    """Prints a formatted evaluation report table to console."""
    sep = "=" * 76
    sub_sep = "-" * 76

    print("\n" + sep)
    print("                 FARMGUIDE DISEASE DETECTION EVALUATION")
    print(sep)
    print(f" Model Path         : {metrics_data.get('model_path')}")
    print(f" Preprocessing Mode : {metrics_data.get('preprocess')}")
    print(f" Evaluation Time    : {metrics_data.get('evaluation_timestamp')}")
    print(sub_sep)

    leaf_m = metrics_data.get("leaf_metrics", {})
    total_leaves = leaf_m.get("total_samples", 0)
    print(f" Total Leaf Samples Tested : {total_leaves}")

    if total_leaves > 0:
        top1 = leaf_m.get('top1_accuracy', 0.0) * 100
        top3 = leaf_m.get('top3_accuracy', 0.0) * 100
        macro_f1 = leaf_m.get('macro_f1', 0.0)
        weighted_f1 = leaf_m.get('weighted_f1', 0.0)

        print(f" Top-1 Accuracy            : {top1:6.2f}%")
        print(f" Top-3 Accuracy            : {top3:6.2f}%")
        print(f" Macro Avg F1-Score        : {macro_f1:6.4f}")
        print(f" Weighted Avg F1-Score     : {weighted_f1:6.4f}")
    else:
        print(" [!] No leaf test images found in data_dir.")

    print(sub_sep)
    nap_m = metrics_data.get("not_a_plant_metrics", {})
    total_nap = nap_m.get("total_samples", 0)
    print(f" 'Not_A_Plant' (OOD) Samples : {total_nap}")

    if total_nap > 0:
        far_50 = nap_m.get("false_accept_rate_0.5", 0.0) * 100
        far_70 = nap_m.get("false_accept_rate_0.7", 0.0) * 100
        far_90 = nap_m.get("false_accept_rate_0.9", 0.0) * 100
        print(f" False Accept Rate @ conf >= 0.5 : {far_50:6.2f}% ({nap_m.get('threshold_counts', {}).get('0.5', 0)}/{total_nap})")
        print(f" False Accept Rate @ conf >= 0.7 : {far_70:6.2f}% ({nap_m.get('threshold_counts', {}).get('0.7', 0)}/{total_nap})")
        print(f" False Accept Rate @ conf >= 0.9 : {far_90:6.2f}% ({nap_m.get('threshold_counts', {}).get('0.9', 0)}/{total_nap})")
    else:
        print(" (No Not_A_Plant images provided in real_test/Not_A_Plant/)")

    if not per_class_df.empty and total_leaves > 0:
        evaluated_classes = per_class_df[per_class_df["support"] > 0]
        if not evaluated_classes.empty:
            print(sub_sep)
            print(" Per-Class Performance (Classes with test images):")
            print(f" {'Class Name':<42} | {'Supp':>4} | {'Prec':>6} | {'Rec':>6} | {'F1':>6}")
            print("-" * 76)
            for _, row in evaluated_classes.iterrows():
                c_name = row['class']
                if len(c_name) > 42:
                    c_name = c_name[:39] + "..."
                print(f" {c_name:<42} | {int(row['support']):>4} | {row['precision']:>6.2f} | {row['recall']:>6.2f} | {row['f1_score']:>6.2f}")

    print(sub_sep)
    print(f" Generated Reports saved in: {output_dir}")
    print("   |-- metrics.json")
    print("   |-- per_class_report.csv")
    print("   |-- confusion_matrix.png")
    print("   |-- confidence_histogram.png")
    print("   \\-- misclassified.csv")
    print(sep + "\n")


def main():
    args = parse_args()
    set_seed(args.seed)

    print(f"Loading disease classes from: {args.classes_path}")
    if not os.path.exists(args.classes_path):
        print(f"Error: Classes file '{args.classes_path}' not found.")
        sys.exit(1)

    with open(args.classes_path, "r", encoding="utf-8") as f:
        disease_classes = json.load(f)

    num_classes = len(disease_classes)
    print(f"Loaded {num_classes} disease classes.")

    print(f"Loading model from: {args.model_path}")
    if not os.path.exists(args.model_path):
        print(f"Error: Model file '{args.model_path}' not found.")
        sys.exit(1)

    model = tf.keras.models.load_model(args.model_path)
    os.makedirs(args.output_dir, exist_ok=True)

    # 1. Discover dataset
    print(f"Scanning test dataset at: {args.data_dir}")
    leaf_records, not_a_plant_records = load_dataset(args.data_dir, disease_classes)
    print(f"Found {len(leaf_records)} leaf images across matching classes.")
    print(f"Found {len(not_a_plant_records)} 'Not_A_Plant' images.")

    # 2. Evaluate leaf images
    correct_confs = []
    incorrect_confs = []
    misclassified_list = []
    
    top1_correct = []
    top3_correct = []
    true_labels = []
    pred_labels = []

    if leaf_records:
        print(f"Running inference on leaf images (preprocess: {args.preprocess})...")
        leaf_preds, valid_leaf_indices = run_batch_inference(
            model, leaf_records, args.img_size, args.preprocess, args.batch_size
        )

        for idx, rec_idx in enumerate(valid_leaf_indices):
            rec = leaf_records[rec_idx]
            true_idx = rec["class_idx"]
            probs = leaf_preds[idx]
            pred_idx = int(np.argmax(probs))
            conf = float(probs[pred_idx])

            top3_idx = np.argsort(probs)[-3:]
            is_top1 = (pred_idx == true_idx)
            is_top3 = (true_idx in top3_idx)

            top1_correct.append(is_top1)
            top3_correct.append(is_top3)
            true_labels.append(true_idx)
            pred_labels.append(pred_idx)

            if is_top1:
                correct_confs.append(conf)
            else:
                incorrect_confs.append(conf)
                misclassified_list.append({
                    "path": str(Path(rec["path"])).replace("\\", "/"),
                    "true": rec["class_name"],
                    "predicted": disease_classes[pred_idx],
                    "confidence": round(conf, 4)
                })

    # 3. Evaluate Not_A_Plant images
    not_a_plant_confs = []
    if not_a_plant_records:
        print(f"Running inference on Not_A_Plant images...")
        nap_preds, valid_nap_indices = run_batch_inference(
            model, not_a_plant_records, args.img_size, args.preprocess, args.batch_size
        )
        if len(nap_preds) > 0:
            max_confs = np.max(nap_preds, axis=-1)
            not_a_plant_confs = [float(c) for c in max_confs]

    # 4. Compute Metrics
    metrics_data = {
        "evaluation_timestamp": datetime.now().isoformat(),
        "model_path": args.model_path,
        "classes_path": args.classes_path,
        "preprocess": args.preprocess,
        "leaf_metrics": {
            "total_samples": len(true_labels),
            "top1_accuracy": round(float(np.mean(top1_correct)), 4) if top1_correct else 0.0,
            "top3_accuracy": round(float(np.mean(top3_correct)), 4) if top3_correct else 0.0,
        },
        "not_a_plant_metrics": {
            "total_samples": len(not_a_plant_confs)
        }
    }

    per_class_rows = []
    if true_labels:
        # Per-class precision, recall, f1
        all_labels = list(range(num_classes))
        precision, recall, f1, support = precision_recall_fscore_support(
            true_labels, pred_labels, labels=all_labels, zero_division=0
        )

        macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
            true_labels, pred_labels, average="macro", zero_division=0
        )
        weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
            true_labels, pred_labels, average="weighted", zero_division=0
        )

        metrics_data["leaf_metrics"].update({
            "macro_precision": round(float(macro_p), 4),
            "macro_recall": round(float(macro_r), 4),
            "macro_f1": round(float(macro_f1), 4),
            "weighted_precision": round(float(weighted_p), 4),
            "weighted_recall": round(float(weighted_r), 4),
            "weighted_f1": round(float(weighted_f1), 4),
        })

        for i, c_name in enumerate(disease_classes):
            per_class_rows.append({
                "class": c_name,
                "precision": round(float(precision[i]), 4),
                "recall": round(float(recall[i]), 4),
                "f1_score": round(float(f1[i]), 4),
                "support": int(support[i])
            })
    else:
        for c_name in disease_classes:
            per_class_rows.append({
                "class": c_name,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "support": 0
            })

    # Not_A_Plant false-acceptance rates at thresholds [0.5, 0.7, 0.9]
    if not_a_plant_confs:
        n_nap = len(not_a_plant_confs)
        arr_nap = np.array(not_a_plant_confs)
        c_05 = int(np.sum(arr_nap >= 0.5))
        c_07 = int(np.sum(arr_nap >= 0.7))
        c_09 = int(np.sum(arr_nap >= 0.9))

        metrics_data["not_a_plant_metrics"].update({
            "false_accept_rate_0.5": round(float(c_05 / n_nap), 4),
            "false_accept_rate_0.7": round(float(c_07 / n_nap), 4),
            "false_accept_rate_0.9": round(float(c_09 / n_nap), 4),
            "threshold_counts": {
                "0.5": c_05,
                "0.7": c_07,
                "0.9": c_09
            }
        })
    else:
        metrics_data["not_a_plant_metrics"].update({
            "false_accept_rate_0.5": 0.0,
            "false_accept_rate_0.7": 0.0,
            "false_accept_rate_0.9": 0.0,
            "threshold_counts": {"0.5": 0, "0.7": 0, "0.9": 0}
        })

    # 5. Save outputs
    # A. metrics.json
    metrics_file = os.path.join(args.output_dir, "metrics.json")
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    # B. per_class_report.csv
    per_class_df = pd.DataFrame(per_class_rows)
    per_class_file = os.path.join(args.output_dir, "per_class_report.csv")
    per_class_df.to_csv(per_class_file, index=False)

    # C. misclassified.csv
    misclassified_df = pd.DataFrame(
        misclassified_list,
        columns=["path", "true", "predicted", "confidence"]
    )
    misclassified_file = os.path.join(args.output_dir, "misclassified.csv")
    misclassified_df.to_csv(misclassified_file, index=False)

    # D. confusion_matrix.png
    cm_file = os.path.join(args.output_dir, "confusion_matrix.png")
    if true_labels:
        # Compute confusion matrix for all classes present in test or across all 38
        present_indices = sorted(list(set(true_labels) | set(pred_labels)))
        present_names = [disease_classes[i] for i in present_indices]
        cm = confusion_matrix(true_labels, pred_labels, labels=present_indices)
        plot_confusion_matrix(cm, present_names, cm_file)
    else:
        # Empty plot placeholder
        fig, ax = plt.subplots(figsize=(6, 4))
        ax.text(0.5, 0.5, "No Leaf Test Images Evaluated", ha="center", va="center", fontsize=12)
        ax.axis('off')
        plt.savefig(cm_file, dpi=150)
        plt.close(fig)

    # E. confidence_histogram.png
    hist_file = os.path.join(args.output_dir, "confidence_histogram.png")
    plot_confidence_histogram(correct_confs, incorrect_confs, not_a_plant_confs, hist_file)

    # 6. Display Summary Table
    print_summary_table(metrics_data, per_class_df, args.output_dir)


if __name__ == "__main__":
    main()
