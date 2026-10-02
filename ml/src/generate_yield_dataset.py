import pandas as pd
import numpy as np
import os

def generate_data():
    np.random.seed(123)
    states = ['Maharashtra', 'Punjab', 'Gujarat', 'Madhya Pradesh', 'Uttar Pradesh', 'Karnataka']
    crops = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Soybean']
    
    data = []
    
    # Generate 5000 rows
    for _ in range(5000):
        state = np.random.choice(states)
        crop = np.random.choice(crops)
        
        # Base environmental stats
        if crop == 'Rice':
            rain = np.random.normal(1200, 300)
            temp = np.random.normal(27, 3)
            base_yield = 40000 # hg/ha (~4 tonnes)
        elif crop == 'Wheat':
            rain = np.random.normal(600, 150)
            temp = np.random.normal(20, 4)
            base_yield = 35000
        elif crop == 'Sugarcane':
            rain = np.random.normal(1500, 400)
            temp = np.random.normal(30, 3)
            base_yield = 700000
        else:
            rain = np.random.normal(800, 200)
            temp = np.random.normal(25, 5)
            base_yield = 30000
            
        rain = max(rain, 100) # Minimum rain
        pesticides = np.random.exponential(15) + 5 # tonnes/hectare equivalents
        
        # Yield is affected by rain (up to a point), temp, and pesticides
        # Too much or too little rain hurts
        rain_factor = 1.0 - abs(rain - 1000)/2000
        temp_factor = 1.0 - abs(temp - 25)/30
        pest_factor = 1.0 + (pesticides / 100) # Slight boost, diminishing returns
        
        final_yield = base_yield * rain_factor * temp_factor * pest_factor
        final_yield += np.random.normal(0, base_yield * 0.1) # Noise
        
        data.append({
            'state': state,
            'crop': crop,
            'rainfall': round(rain, 2),
            'pesticides': round(pesticides, 2),
            'temperature': round(temp, 2),
            'yield_hg_ha': max(round(final_yield, 2), 5000)
        })
        
    df = pd.DataFrame(data)
    os.makedirs('../dataset', exist_ok=True)
    df.to_csv('../dataset/mock_yield_dataset.csv', index=False)
    print("Generated mock_yield_dataset.csv with 5000 rows.")

if __name__ == "__main__":
    generate_data()
