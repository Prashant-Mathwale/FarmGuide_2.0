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
    print("Loading Dataset modern_agriculture_ai_crop_production_2020_2050.csv...")
    df = pd.read_csv('../dataset/modern_agriculture_ai_crop_production_2020_2050.csv')
    
    # Target: pest_risk_score
    
    features = [
        'crop', 
        'avg_temperature_c',
        'annual_rainfall_mm',
        'soil_moisture_percent'
    ]
    target = 'pest_risk_score'
    
    X = df[features].copy()
    y = df[target].copy()
    
    # Ensure categorical types
    X['crop'] = X['crop'].astype(str)
    
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessor
    categorical_features = ['crop']
    numeric_features = ['avg_temperature_c', 'annual_rainfall_mm', 'soil_moisture_percent']
    
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
    
    print("Training Random Forest Regressor on modern agriculture dataset...")
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
        "dataset": "modern_agriculture_ai_crop_production_2020_2050.csv",
        "target": "pest_risk_score",
        "features": features,
        "metrics": {
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        },
        "limitations": [
            "Dataset lacks explicit short-term temporal dates (only 'year').",
            "Predicts an aggregated annual pest_risk_score rather than short-term outbreak."
        ]
    }
    
    with open('../models/pest_forecaster/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Model saved to ../models/pest_forecaster/")

if __name__ == "__main__":
    train()
