import pandas as pd
import numpy as np
import json
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

def train():
    print("Loading Time-Series Dataset mock_pest_timeseries.csv...")
    df = pd.read_csv('../dataset/mock_pest_timeseries.csv')
    
    # 1. Feature Engineering: The Secret Sauce for Temporal Models
    print("Computing rolling weather averages...")
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['crop', 'date']).reset_index(drop=True)
    
    df['temp_7d_avg'] = df.groupby('crop')['avg_temperature_c'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    df['hum_7d_avg'] = df.groupby('crop')['humidity_percent'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    df['rain_14d_sum'] = df.groupby('crop')['daily_rainfall_mm'].transform(lambda x: x.rolling(14, min_periods=1).sum())
    
    features = [
        'crop', 
        'temp_7d_avg',
        'hum_7d_avg',
        'rain_14d_sum'
    ]
    target = 'pest_risk_score'
    
    X = df[features].copy()
    y = df[target].copy()
    
    # 2. Time-Series Split (Never randomly split time-series data!)
    # We train on the first 800 days, test on the last 200 days for each crop
    train_size = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:train_size], X.iloc[train_size:]
    y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]
    
    print("Training XGBoost Regressor on time-series features...")
    
    categorical_features = ['crop']
    numeric_features = ['temp_7d_avg', 'hum_7d_avg', 'rain_14d_sum']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', xgb.XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42, n_jobs=-1))
    ])
    
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
        "model_type": "XGBoostRegressor (Temporal)",
        "dataset": "mock_pest_timeseries.csv",
        "target": "pest_risk_score",
        "features": features,
        "metrics": {
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        },
        "advancements": [
            "Swapped Random Forest for XGBoost.",
            "Incorporated 7-day and 14-day rolling historical weather averages.",
            "Utilized Strict Time-Series Train/Test Split (Train on past, predict future)."
        ]
    }
    
    with open('../models/pest_forecaster/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Advanced XGBoost model saved to ../models/pest_forecaster/")

if __name__ == "__main__":
    train()
