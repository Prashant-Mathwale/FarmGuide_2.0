import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

print("Loading Pest Prediction Dataset...")
filename = 'dataset/pest_disease_prediction_dataset.csv.xls'

try:
    df = pd.read_csv(filename)
except Exception:
    df = pd.read_excel(filename)

print(f"Dataset loaded with {len(df)} rows.")

features = ['Temperature_C', 'Humidity_percent', 'Rainfall_mm', 'Soil_pH', 
            'Nitrogen_N', 'Phosphorus_P', 'Potassium_K', 'Crop_Type', 'Location']

# Drop rows with missing crucial data
df = df.dropna(subset=features + ['Likely_Pest_Disease'])

# Define features and target
X = df[features]
y_class = df['Likely_Pest_Disease']

# Create a robust preprocessor using OneHotEncoder for categorical columns
# handle_unknown='ignore' ensures unseen crops/locations in the future don't crash the model
categorical_cols = ['Crop_Type', 'Location']
numeric_cols = ['Temperature_C', 'Humidity_percent', 'Rainfall_mm', 'Soil_pH', 'Nitrogen_N', 'Phosphorus_P', 'Potassium_K']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numeric_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols)
    ]
)

# Create a full Pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y_class, test_size=0.2, random_state=42)

print("\nTraining Robust Pest Classifier Pipeline...")
pipeline.fit(X_train, y_train)

acc = pipeline.score(X_test, y_test)
print(f"Classifier Accuracy: {acc * 100:.2f}%")

# Save the entire pipeline (no need for separate encoders or a fake regressor!)
os.makedirs('models', exist_ok=True)

print("\nSaving Model Pipeline...")
with open('models/pest_pipeline.pkl', 'wb') as f:
    pickle.dump(pipeline, f)

print("\nDone! Saved pest_pipeline.pkl to 'models/' directory.")
