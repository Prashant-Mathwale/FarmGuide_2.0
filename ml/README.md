# FarmGuide ML Microservice

## Datasets
- **Modern Agriculture AI Crop Production (2020-2050)**: Used for `pest_forecaster`.
- **Smart Farming Data 2024**: Downloaded via Kaggle API.
- **Agriculture Precision Study Cases**: Could not be downloaded automatically via Kaggle CLI because it is a Competition dataset requiring explicit user authentication and terms acceptance.

## ML Models

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
