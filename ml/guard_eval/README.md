# Guard Evaluation Folders

These folders are used by `calibrate_guard.py` to evaluate and tune the input guard thresholds.

## `leaves/`
Put **real leaf photos** here — both healthy and diseased. Include:
- Green healthy leaves
- Yellow/brown diseased leaves (blight, rust, scorch)
- Leaves with dark spots (fungal infections)
- Various lighting conditions (indoor, outdoor, overcast)
- At least 20-50 images for meaningful statistics

## `non_leaves/`
Put **non-leaf images** here — things the guard should reject. Include:
- Faces / people
- Desks, rooms, objects
- Cars, buildings
- Screenshots, text documents
- Sky, clouds, soil (without leaves)
- Blurry/shaky photos of random things
- Very dark or overexposed photos
- At least 20-50 images for meaningful statistics

## Important
- Do NOT commit large image files to git (add these folders to `.gitignore`)
- Download from PlantVillage, Kaggle, or take your own photos
- The calibration script will run all gates on every image and report statistics
