import pandas as pd
import numpy as np
import datetime
import os

def generate_data():
    np.random.seed(42)
    crops = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Tomato']
    
    start_date = datetime.date(2021, 1, 1)
    num_days = 1000
    
    data = []
    
    for crop in crops:
        current_date = start_date
        # Base stats for the crop's environment
        base_temp = np.random.uniform(20, 30)
        base_hum = np.random.uniform(50, 80)
        
        for i in range(num_days):
            # Introduce seasonality using sine wave
            season = np.sin(i * (2 * np.pi / 365))
            
            temp = base_temp + season * 10 + np.random.normal(0, 2)
            hum = base_hum + season * 15 + np.random.normal(0, 5)
            hum = max(min(hum, 100), 20)
            
            # Rain events (15% chance of rain)
            rain = 0
            if np.random.rand() < 0.15:
                rain = np.random.exponential(15)
                
            data.append({
                'date': current_date,
                'crop': crop,
                'avg_temperature_c': round(temp, 1),
                'humidity_percent': round(hum, 1),
                'daily_rainfall_mm': round(rain, 1)
            })
            current_date += datetime.timedelta(days=1)
            
    df = pd.DataFrame(data)
    
    # Calculate rolling features to simulate biological incubation
    # Group by crop so rolling doesn't mix crops
    df = df.sort_values(by=['crop', 'date']).reset_index(drop=True)
    
    df['temp_7d_avg'] = df.groupby('crop')['avg_temperature_c'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    df['hum_7d_avg'] = df.groupby('crop')['humidity_percent'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    df['rain_14d_sum'] = df.groupby('crop')['daily_rainfall_mm'].transform(lambda x: x.rolling(14, min_periods=1).sum())
    
    # Generate pest_risk_score biologically (Pests love High Temp + High Hum + Recent Rain)
    # The true function is based heavily on the rolling averages, which is why a temporal model will excel!
    df['pest_risk_score'] = (
        (df['temp_7d_avg'] * 1.5) + 
        (df['hum_7d_avg'] * 0.8) + 
        (df['rain_14d_sum'] * 1.2) + 
        np.random.normal(0, 5, len(df)) # Add some irreducible noise
    )
    
    # Normalize to 0-100
    min_score = df['pest_risk_score'].min()
    max_score = df['pest_risk_score'].min() + (df['pest_risk_score'].max() - df['pest_risk_score'].min())
    df['pest_risk_score'] = ((df['pest_risk_score'] - min_score) / (max_score - min_score)) * 100
    df['pest_risk_score'] = df['pest_risk_score'].clip(0, 100).round(1)
    
    # Drop the rolling features from the final dataset so the XGBoost script has to compute them itself!
    final_df = df[['date', 'crop', 'avg_temperature_c', 'humidity_percent', 'daily_rainfall_mm', 'pest_risk_score']]
    
    os.makedirs('../dataset', exist_ok=True)
    final_df.to_csv('../dataset/mock_pest_timeseries.csv', index=False)
    print("Generated mock_pest_timeseries.csv with 6000 rows (1000 days x 6 crops).")

if __name__ == "__main__":
    generate_data()
