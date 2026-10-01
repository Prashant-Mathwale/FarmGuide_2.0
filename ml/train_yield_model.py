import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pickle
import os

print("Loading real yield dataset...")
df = pd.read_csv('models/crop_yield/yield_df.csv')

# Drop unnamed index column if it exists
if 'Unnamed: 0' in df.columns:
    df = df.drop(columns=['Unnamed: 0'])

# Columns: Area, Item, Year, hg/ha_yield, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp
print(f"Dataset shape: {df.shape}")

# Features: Area, Item, average_rain_fall_mm_per_year, pesticides_tonnes, avg_temp
# Target: hg/ha_yield

# Encode categorical variables
area_encoder = LabelEncoder()
df['Area_encoded'] = area_encoder.fit_transform(df['Area'])

item_encoder = LabelEncoder()
df['Item_encoded'] = item_encoder.fit_transform(df['Item'])

X = df[['Area_encoded', 'Item_encoded', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']]
y = df['hg/ha_yield']

print("Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest Regressor... (This might take a minute)")
rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
rf_regressor.fit(X_train, y_train)

score = rf_regressor.score(X_test, y_test)
print(f"Model R^2 Score on test set: {score:.4f}")

print("Saving model and encoders...")
os.makedirs('models', exist_ok=True)
with open('models/yield_model.pkl', 'wb') as f:
    pickle.dump(rf_regressor, f)
    
with open('models/area_encoder.pkl', 'wb') as f:
    pickle.dump(area_encoder, f)

with open('models/item_encoder.pkl', 'wb') as f:
    pickle.dump(item_encoder, f)

print("Yield Model training complete!")
