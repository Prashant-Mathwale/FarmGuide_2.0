import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report

print("Loading Irrigation Dataset...")
file_path = 'dataset/datasets - datasets.csv'
df = pd.read_csv(file_path)

# Drop any missing rows
df = df.dropna()

# Extract Features and Target
X = df[['CropType', 'CropDays', 'SoilMoisture', 'temperature', 'Humidity']]
y = df['Irrigation']

print("Building Preprocessor and ML Pipeline...")
# We use OneHotEncoder to safely handle the categorical CropType
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['CropType'])
    ],
    remainder='passthrough' # Keep CropDays, SoilMoisture, temp, Humidity as is
)

# Random Forest Classifier is excellent for binary classification (0 or 1)
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

print("Training Random Forest Classifier on Irrigation Data...")
model.fit(X_train, y_train)

# Evaluate and Log
preds = model.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, preds):.4f}")
print("Classification Report:")
print(classification_report(y_test, preds))

# Save Pipeline to disk
os.makedirs('models', exist_ok=True)
with open('models/irrigation_model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("Irrigation Pipeline successfully saved to models/irrigation_model.pkl!")
