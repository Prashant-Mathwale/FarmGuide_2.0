import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

def train():
    print("Loading Yield Dataset...")
    df = pd.read_csv('../dataset/mock_yield_dataset.csv')
    
    # Encode categorical variables as expected by the legacy API
    area_encoder = LabelEncoder()
    item_encoder = LabelEncoder()
    
    df['state_encoded'] = area_encoder.fit_transform(df['state'])
    df['crop_encoded'] = item_encoder.fit_transform(df['crop'])
    
    features = ['state_encoded', 'crop_encoded', 'rainfall', 'pesticides', 'temperature']
    target = 'yield_hg_ha'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"MAE: {mae:.2f}")
    print(f"R2 Score: {r2:.2f}")
    
    print("Saving models to ../models/")
    os.makedirs('../models', exist_ok=True)
    
    with open('../models/yield_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    with open('../models/area_encoder.pkl', 'wb') as f:
        pickle.dump(area_encoder, f)
        
    with open('../models/item_encoder.pkl', 'wb') as f:
        pickle.dump(item_encoder, f)
        
    print("Yield models successfully trained and saved!")

if __name__ == "__main__":
    train()
