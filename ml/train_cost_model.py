import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
import os

# 1. Load data
file_path = 'dataset/Cost of Cultivation/datafile (1).csv'

print(f"Loading data from {file_path}...")
df = pd.read_csv(file_path)

# Clean column names (they have awkward spaces and backticks)
df.columns = df.columns.str.strip()
cost_col = "Cost of Cultivation (`/Hectare) C2"

# Drop missing values
df = df.dropna(subset=['Crop', 'State', cost_col])

# Prepare inputs X and target y
X = df[['Crop', 'State']]
y = df[cost_col].astype(float)

# Preprocessor: One-Hot Encode the categorical Crop and State variables
# handle_unknown='ignore' ensures the backend doesn't crash if a user inputs a rare crop
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['Crop', 'State'])
    ])

# Create Pipeline
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

# Train Model
print("Training Cost Predictor Model...")
model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
print(f"Mean Absolute Error: {mean_absolute_error(y_test, preds)}")
print(f"R2 Score: {r2_score(y_test, preds)}")

# Save Model
os.makedirs('models', exist_ok=True)
with open('models/cost_model.pkl', 'wb') as f:
    pickle.dump(model, f)
print("Cost Predictor Model saved perfectly to models/cost_model.pkl")
