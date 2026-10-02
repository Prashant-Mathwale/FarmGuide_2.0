import pandas as pd
import numpy as np
import json
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train():
    print("Loading Dataset...")
    df = pd.read_csv('../dataset/sf24/Crop_recommendationV2.csv')
    
    # We will predict pest_pressure as a proxy for pest risk.
    # The dataset lacks explicit temporal dates, so we must document this limitation.
    # We use relevant environmental and crop features.
    
    features = [
        'label', # Crop type
        'growth_stage',
        'temperature',
        'humidity',
        'rainfall',
        'wind_speed',
        'soil_moisture'
    ]
    target = 'pest_pressure'
    
    X = df[features].copy()
    y = df[target].copy()
    
    # Ensure categorical types
    X['label'] = X['label'].astype(str)
    X['growth_stage'] = X['growth_stage'].astype(str)
    
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessor
    categorical_features = ['label', 'growth_stage']
    numeric_features = ['temperature', 'humidity', 'rainfall', 'wind_speed', 'soil_moisture']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1))
    ])
    
    print("Training Random Forest Regressor...")
    pipeline.fit(X_train, y_train)
    
    print("Evaluating...")
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"MAE: {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R2 Score: {r2:.2f}")
    
    # Save model and metadata
    os.makedirs('../models/pest_forecaster', exist_ok=True)
    joblib.dump(pipeline, '../models/pest_forecaster/model.pkl')
    
    metadata = {
        "model_type": "RandomForestRegressor",
        "target": "pest_pressure",
        "features": features,
        "metrics": {
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        },
        "limitations": [
            "Dataset lacks explicit temporal dates, so true rolling features could not be generated.",
            "Predicts a generalized pest_pressure score rather than specific pest species.",
            "Historical pest observations are not present in the features."
        ]
    }
    
    with open('../models/pest_forecaster/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Model saved to ../models/pest_forecaster/")

if __name__ == "__main__":
    train()
