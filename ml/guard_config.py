"""
guard_config.py — Central configuration for all input-guard thresholds.
Tune these values using calibrate_guard.py. Never hard-code thresholds inline.
"""

GUARD_CONFIG = {
    # ── Gate A: Image quality ────────────────────────────────────────────
    "MIN_SIDE": 100,              # px – reject if shorter dimension < this
    "BLUR_THRESHOLD": 60.0,       # Laplacian variance; lower = blurrier
    "BLUR_RESIZE_WIDTH": 512,     # resize to this width before computing blur
    "DARK_THRESHOLD": 40,         # mean brightness below this = too dark
    "BRIGHT_THRESHOLD": 225,      # mean brightness above this = too bright

    # ── Gate B: Leaf plausibility (HSV colour heuristic) ─────────────────
    # Deliberately lenient to avoid rejecting diseased (brown/yellow) leaves.
    "MIN_PLANT_RATIO": 0.12,      # below this → not_a_leaf
    "BORDERLINE_PLANT_RATIO": 0.25,  # between MIN and this → borderline

    # ── Gate C: Model-confidence checks ──────────────────────────────────
    "LOW_CONF": 0.50,             # top-1 prob below this → uncertain
    "HIGH_CONF": 0.80,            # top-1 prob below this → possible
    "MIN_MARGIN": 0.20,           # top1 - top2 below this → possible
    "MAX_ENTROPY": 0.60,          # normalized entropy above this → uncertain

    # ── Gate D: CLIP zero-shot leaf check (optional, OFF by default) ─────
    "USE_CLIP_LEAF_CHECK": False,
}
