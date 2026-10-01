import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

def create_dummy_dataset():
    """Generates a tiny dummy dataset if the Kaggle CSV is missing, just so the app doesn't crash."""
    print("Kaggle dataset not found. Generating a dummy dataset for architecture testing...")
    data = {
        'N': [90, 85, 60, 74, 78, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        'P': [42, 58, 55, 35, 42, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        'K': [43, 41, 44, 40, 42, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        'temperature': [20.8, 21.7, 23.0, 26.4, 20.1] * 3,
        'humidity': [82.0, 80.3, 82.3, 80.1, 81.6] * 3,
        'ph': [6.5, 7.0, 7.8, 6.9, 7.6] * 3,
        'rainfall': [202.9, 226.6, 263.9, 242.8, 262.7] * 3,
        'label': ['Rice', 'Rice', 'Rice', 'Maize', 'Maize', 'Wheat', 'Wheat', 'Wheat', 'Rice', 'Maize', 'Wheat', 'Rice', 'Maize', 'Wheat', 'Rice']
    }
    df = pd.DataFrame(data)
    df.to_csv('Crop_recommendation.csv', index=False)
    print("Dummy dataset created.")

def train():
    csv_file = 'Crop_recommendation.csv'
    if not os.path.exists(csv_file):
        create_dummy_dataset()

    print("Loading dataset...")
    df = pd.read_csv(csv_file)

    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']

    print("Training Random Forest Classifier...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=20, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Model trained with Test Accuracy: {accuracy * 100:.2f}%")

    with open('crop_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    
    print("Model saved to crop_model.pkl!")

if __name__ == '__main__':
    train()
