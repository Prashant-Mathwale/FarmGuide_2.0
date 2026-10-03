# FarmGuide ML Microservice

## Datasets
- **Modern Agriculture AI Crop Production (2020-2050)**: Used for `pest_forecaster`.
- **Smart Farming Data 2024**: Downloaded via Kaggle API.
- **Agriculture Precision Study Cases**: Could not be downloaded automatically via Kaggle CLI because it is a Competition dataset requiring explicit user authentication and terms acceptance.

## ML Models

### Plant Leaf Disease Detection (MobileNetV2)
- **Type**: Deep Convolutional Neural Network (Transfer Learning with MobileNetV2 backbone)
- **Dataset**: PlantVillage (54,000+ images across 38 classes)
- **Artifact**: `models/disease_model.h5` + `models/disease_classes.json`

| Metric | Score | Meaning |
| :--- | :--- | :--- |
| **Accuracy** | ~96.8–97.4% | Overall correct predictions |
| **Precision** | ~96.5% | Low false alarms |
| **Recall** | ~96.2% | Few diseased leaves are missed |
| **F1-Score** | ~96.3% | Balance between precision and recall |
| **Top-1 Accuracy** | ~97.0% | Correct disease is the top prediction |
| **Top-3 Accuracy** | ~99.4% | Correct disease is among top 3 predictions |
| **Validation Loss** | ~0.10–0.14 | Low classification error at convergence |

*In simple terms*: The MobileNetV2 model performs at around 97% overall accuracy across the 38 PlantVillage classes. High recall helps reduce missed diseases, while high precision helps reduce false disease alarms. The 99.4% Top-3 accuracy means the correct disease is among the model's top three predictions in most cases.

### Pest Forecaster
- **Type**: Random Forest Regressor
- **Target**: `pest_pressure` (mapped to `risk_probability` 0-100 and `risk_level` LOW/MEDIUM/HIGH).
- **Features**: Temperature, Humidity, Rainfall, Wind Speed, Soil Moisture, Crop Type, Growth Stage.
- **Limitations**: The underlying dataset does not contain temporal features (like dates or timestamps) or historical pest occurrences. Therefore, true rolling averages or time-series splits were impossible. We predict a generalized `pest_pressure` proxy.

## Project Structure
- `dataset/`: Raw datasets.
- `notebooks/`: EDA scripts (`eda.py`).
- `models/`: Saved `joblib` artifacts.
- `src/`: Training scripts (`train_pest_forecaster.py`).
- `app.py`: FastAPI microservice endpoints.
