import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import os

print("Loading Pest Prediction Dataset...")
# Try reading as csv, then as excel just in case
filename = 'pest_disease_prediction_dataset.csv.xls'
try:
    if 'csv' in filename:
        df = pd.read_csv(filename)
    else:
        df = pd.read_excel(filename)
except Exception as e:
    # generic fallback if string name is weird
    try:
        df = pd.read_csv(filename)
    except:
        df = pd.read_excel(filename)

print(f"Dataset loaded with {len(df)} rows.")

# Features and Targets
features = ['Temperature_C', 'Humidity_percent', 'Rainfall_mm', 'Soil_pH', 
            'Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Crop_Type', 'Location']

# Dropping rows with missing crucial data
df = df.dropna(subset=features + ['Likely_Pest_Disease', 'Probability_percent'])

# Encode Categorical Variables
crop_encoder = LabelEncoder()
location_encoder = LabelEncoder()

df['Crop_Type_Encoded'] = crop_encoder.fit_transform(df['Crop_Type'].astype(str))
df['Location_Encoded'] = location_encoder.fit_transform(df['Location'].astype(str))

# Create final feature set
X = df[['Temperature_C', 'Humidity_percent', 'Rainfall_mm', 'Soil_pH', 
        'Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Crop_Type_Encoded', 'Location_Encoded']]

# Target 1: Classification (Which pest?)
y_class = df['Likely_Pest_Disease']

# Target 2: Regression (Probability/Severity?)
y_reg = df['Probability_percent']

# Train-Test Split
X_train, X_test, y_class_train, y_class_test = train_test_split(X, y_class, test_size=0.2, random_state=42)
_, _, y_reg_train, y_reg_test = train_test_split(X, y_reg, test_size=0.2, random_state=42)

print("\nTraining Random Forest Classifier (Pest Name)...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_class_train)
acc = clf.score(X_test, y_class_test)
print(f"Classifier Accuracy: {acc * 100:.2f}%")

print("\nTraining Random Forest Regressor (Outbreak Probability)...")
reg = RandomForestRegressor(n_estimators=100, random_state=42)
reg.fit(X_train, y_reg_train)
score = reg.score(X_test, y_reg_test)
print(f"Regressor R^2 Score: {score:.4f}")

# Save models and encoders
os.makedirs('models', exist_ok=True)

print("\nSaving Models...")
with open('models/pest_classifier.pkl', 'wb') as f:
    pickle.dump(clf, f)

with open('models/pest_regressor.pkl', 'wb') as f:
    pickle.dump(reg, f)

with open('models/pest_crop_encoder.pkl', 'wb') as f:
    pickle.dump(crop_encoder, f)

with open('models/pest_location_encoder.pkl', 'wb') as f:
    pickle.dump(location_encoder, f)

print("\nDone! Saved pest_classifier.pkl, pest_regressor.pkl, pest_crop_encoder.pkl, pest_location_encoder.pkl to 'models/' directory.")
