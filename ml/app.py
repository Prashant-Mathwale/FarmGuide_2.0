import pickle
import numpy as np
import pandas as pd
import json
import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import tensorflow as tf
    from PIL import Image
except ImportError:
    tf = None
    Image = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FarmGuide ML Microservice"}

price_df = None
try:
    price_df = pd.read_csv('dataset/Agriculture_price_dataset.csv')
except Exception as e:
    print("Warning: Could not load dataset/Agriculture_price_dataset.csv:", e)

weather_df = None
try:
    weather_df = pd.read_csv('dataset/rainfall in india 1901-2015.csv')
except Exception as e:
    print("Warning: Could not load dataset/rainfall in india 1901-2015.csv:", e)

schemes_df = None
try:
    sc_df = pd.read_csv('dataset/schemes.csv')
    col_mapping = {'detailed_description': 'details', 'categories': 'schemeCategory'}
    sc_df.rename(columns=col_mapping, inplace=True)
    for col in ['details', 'benefits', 'eligibility', 'schemeCategory', 'tags', 'scheme_name']:
        if col in sc_df.columns:
            sc_df[col] = sc_df[col].astype(str).fillna('')
    keywords = ['agricultur', 'farm', 'crop', 'kisan', 'krishi', 'rural', 'horticulture', 'irrigation']
    pattern = '|'.join(keywords)
    agri_schemes = sc_df[
        sc_df['details'].str.contains(pattern, case=False) |
        sc_df['schemeCategory'].str.contains(pattern, case=False) |
        sc_df['scheme_name'].str.contains(pattern, case=False) |
        sc_df['tags'].str.contains(pattern, case=False)
    ].copy()
    schemes_df = agri_schemes.drop_duplicates(subset=['scheme_name']).head(100)
except Exception as e:
    print("Warning: Could not load dataset/schemes.csv:", e)

crop_model = None
try:
    with open('models/crop_model.pkl', 'rb') as f:
        crop_model = pickle.load(f)
except Exception:
    print("Warning: models/crop_model.pkl not found.")

irrigation_model = None
try:
    with open('models/irrigation_model.pkl', 'rb') as f:
        irrigation_model = pickle.load(f)
except Exception:
    print("Warning: irrigation_model.pkl not found.")

pest_classifier = None
pest_regressor = None
pest_crop_encoder = None
pest_location_encoder = None
try:
    with open('models/pest_classifier.pkl', 'rb') as f:
        pest_classifier = pickle.load(f)
    with open('models/pest_regressor.pkl', 'rb') as f:
        pest_regressor = pickle.load(f)
    with open('models/pest_crop_encoder.pkl', 'rb') as f:
        pest_crop_encoder = pickle.load(f)
    with open('models/pest_location_encoder.pkl', 'rb') as f:
        pest_location_encoder = pickle.load(f)
except Exception:
    print("Warning: Pest prediction models not found.")

yield_model = None
area_encoder = None
item_encoder = None
try:
    with open('models/yield_model.pkl', 'rb') as f:
        yield_model = pickle.load(f)
    with open('models/area_encoder.pkl', 'rb') as f:
        area_encoder = pickle.load(f)
    with open('models/item_encoder.pkl', 'rb') as f:
        item_encoder = pickle.load(f)
except Exception:
    print("Warning: Yield models not found.")

class SoilData(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

@app.post("/predict_crop")
async def predict_crop(data: SoilData):
    if crop_model is None:
        return {"success": False, "message": "Model not loaded."}
    features = np.array([[data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall]])
    classes = crop_model.classes_
    probabilities = crop_model.predict_proba(features)[0]
    top_indices = np.argsort(probabilities)[::-1][:3]
    recommendations = [{"name": str(classes[idx]), "confidence": float(probabilities[idx] * 100)} for idx in top_indices]
    return {"success": True, "recommendations": recommendations}

class IrrigationData(BaseModel):
    cropType: str
    cropDays: int
    soilMoisture: float
    temperature: float
    humidity: float

@app.post("/predict_irrigation")
async def predict_irrigation(data: IrrigationData):
    if irrigation_model is None:
        return {"success": False, "message": "Irrigation model not loaded."}
    try:
        input_data = pd.DataFrame([{
            'CropType': data.cropType, 'CropDays': data.cropDays,
            'SoilMoisture': data.soilMoisture, 'temperature': data.temperature, 'Humidity': data.humidity
        }])
        prediction = irrigation_model.predict(input_data)[0]
        probability = irrigation_model.predict_proba(input_data)[0][1]
        return {"success": True, "irrigation_needed": bool(prediction == 1), "confidence": float(probability * 100)}
    except Exception as e:
        return {"success": False, "message": str(e)}

class PestData(BaseModel):
    Temperature_C: float
    Humidity_percent: float
    Rainfall_mm: float
    Soil_pH: float
    Nitrogen_N: float
    Phosphorus_P: float
    Potassium_K: float
    Crop_Type: str
    Location: str

@app.post("/predict_pest")
async def predict_pest(data: PestData):
    if any(m is None for m in [pest_classifier, pest_regressor, pest_crop_encoder, pest_location_encoder]):
        return {"success": False, "message": "Pest prediction models not loaded."}
    try:
        crop_encoded = pest_crop_encoder.transform([data.Crop_Type])[0] if data.Crop_Type in pest_crop_encoder.classes_ else 0
        location_encoded = pest_location_encoder.transform([data.Location])[0] if data.Location in pest_location_encoder.classes_ else 0
        features = np.array([[data.Temperature_C, data.Humidity_percent, data.Rainfall_mm, data.Soil_pH, data.Nitrogen_N, data.Phosphorus_P, data.Potassium_K, crop_encoded, location_encoded]])
        pest_class = pest_classifier.predict(features)[0]
        outbreak_prob = pest_regressor.predict(features)[0]
        return {"success": True, "pest": str(pest_class), "probability": float(outbreak_prob)}
    except Exception as e:
        return {"success": False, "message": str(e)}

class RiskData(BaseModel):
    state: str
    rainfall: float
    pesticides: float
    crop: str

@app.post("/predict_risk")
async def predict_risk(data: RiskData):
    try:
        weatherRisk = 0
        variance_val = 0
        if weather_df is not None:
            state_query = data.state.upper().strip()
            state_data = weather_df[weather_df['SUBDIVISION'].str.upper().str.contains(state_query, na=False)]
            normal_rainfall = state_data['ANNUAL'].mean() if not state_data.empty else 1000
            variance_val = ((data.rainfall - normal_rainfall) / normal_rainfall) * 100
            if variance_val < -40: weatherRisk = 45
            elif variance_val < -20: weatherRisk = 25
            elif variance_val > 40: weatherRisk = 45
            elif variance_val > 20: weatherRisk = 20
        
        diseaseRisk = 25 if data.pesticides < 0.1 else (5 if data.pesticides > 100 else 12)
        priceRisk = 30 if data.crop.lower() in ['tomato', 'potato', 'onion'] else 10
        totalRiskScore = min(100, max(0, weatherRisk + diseaseRisk + priceRisk))
        
        return {"success": True, "riskScore": totalRiskScore, "variance": variance_val}
    except Exception as e:
        return {"success": False, "message": str(e)}

class YieldData(BaseModel):
    state: str
    crop: str
    rainfall: float
    pesticides: float
    temperature: float

@app.post("/predict_yield")
async def predict_yield(data: YieldData):
    if yield_model is None or area_encoder is None or item_encoder is None:
        return {"success": False, "message": "Yield models not loaded. Make sure models/yield_model.pkl exists."}
    try:
        area_encoded = area_encoder.transform([data.state])[0] if data.state in area_encoder.classes_ else 0
        item_encoded = item_encoder.transform([data.crop])[0] if data.crop in item_encoder.classes_ else 0
        
        features = np.array([[area_encoded, item_encoded, data.rainfall, data.pesticides, data.temperature]])
        prediction = yield_model.predict(features)[0]
        
        return {"success": True, "yield_hg_ha": float(prediction)}
    except Exception as e:
        return {"success": False, "message": str(e)}

class TrendRequest(BaseModel):
    crop: str

@app.post("/price_trend")
async def price_trend(request: TrendRequest):
    if price_df is None:
        return {"success": False, "message": "Price dataset not loaded."}
    try:
        crop = request.crop.lower().strip()
        crop_data = price_df[price_df['Commodity'].str.lower().str.strip() == crop].copy()
        if crop_data.empty:
            return {"success": False, "message": "Crop not found."}
        
        crop_data['Price Date'] = pd.to_datetime(crop_data['Price Date'], format='%d/%m/%Y', errors='coerce')
        crop_data = crop_data.dropna(subset=['Price Date']).sort_values(by='Price Date')
        recent_data = crop_data.tail(7)
        if len(recent_data) == 0:
             return {"success": False, "message": "No dated data."}
             
        prices = recent_data['Modal_Price'].tolist()
        dates = recent_data['Price Date'].dt.strftime('%a').tolist()
        sma = np.mean(prices)
        current_price = float(prices[-1])
        cv = (np.std(prices) / sma) * 100
        volatility_status = "Fluctuating" if cv > 5.0 else "Stable"
        
        recommendation = "Good time to sell" if current_price > sma * 1.02 else ("Hold crop for better price" if current_price < sma * 0.98 else "Market price is stable")
        chart_data = [{"name": day, "price": int(price)} for day, price in zip(dates, prices)]
            
        return {"success": True, "chart_data": chart_data, "volatility_status": volatility_status, "recommendation": recommendation, "current_price": int(current_price), "sma": int(sma)}
    except Exception as e:
        return {"success": False, "message": str(e)}

class SchemeQuery(BaseModel):
    state: str = ""
    land_size: str = ""
    gender: str = ""
    caste: str = ""

@app.post("/schemes/search")
async def search_schemes(query: SchemeQuery):
    if schemes_df is None:
        return {"success": False, "message": "Schemes dataset not loaded."}
    try:
        results = schemes_df.copy()
        results['relevance_score'] = 0
        if query.state and query.state != "All India":
            state_search = query.state.lower()
            results = results[results['details'].str.contains(state_search, case=False) | results['level'].str.contains(state_search, case=False) | results['level'].str.contains('central', case=False)]
        
        if query.land_size:
            try:
                if float(query.land_size) <= 5.0:
                    results.loc[results['eligibility'].str.contains('small|marginal|poor', case=False), 'relevance_score'] += 10
            except ValueError: pass
        if query.gender == "Female":
            results.loc[results['eligibility'].str.contains('women|female|widow|girl', case=False), 'relevance_score'] += 15
        if query.caste == "SC/ST":
            results.loc[results['eligibility'].str.contains('sc|st|scheduled|tribe|caste', case=False), 'relevance_score'] += 15
            
        results = results.sort_values(by='relevance_score', ascending=False).head(15)
        formatted = []
        for _, row in results.iterrows():
            slug = str(row.get("slug", "")).strip()
            formatted.append({
                "name": str(row.get("scheme_name", "Unknown")),
                "details": str(row.get("details", ""))[:300] + "...",
                "benefits": str(row.get("benefits", ""))[:150] + "...",
                "eligibility": str(row.get("eligibility", ""))[:150] + "...",
                "category": str(row.get("schemeCategory", "Agriculture")),
                "level": str(row.get("level", "Central/State")),
                "link": f"https://www.myscheme.gov.in/schemes/{slug}" if slug else "https://www.myscheme.gov.in/"
            })
        return {"success": True, "count": len(formatted), "data": formatted}
    except Exception as e:
        return {"success": False, "message": str(e)}

# Disease Detection
disease_model = None
disease_classes = []
if tf is not None:
    try:
        disease_model = tf.keras.models.load_model('models/disease_model.h5')
        with open('models/disease_classes.json', 'r') as f:
            disease_classes = json.load(f)
    except Exception as e:
        print(f"Warning: Could not load disease model. Error: {e}")

@app.post("/predict_disease")
async def predict_disease(file: UploadFile = File(...)):
    try:
        if not tf or not disease_model:
            return {"success": False, "message": "Disease model is offline."}
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))
        img_array = np.expand_dims(np.array(img) / 255.0, axis=0)
        predictions = disease_model.predict(img_array)
        idx = np.argmax(predictions[0])
        result = disease_classes[idx]
        return {"success": True, "disease": result.replace("___", " - ").replace("__", " - ").replace("_", " "), "confidence": float(predictions[0][idx] * 100), "treatment": get_treatment(result)}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_treatment(disease):
    treatments = {
        "Early_blight": "Apply Chlorothalonil or Mancozeb. Avoid overhead watering.",
        "Late_blight": "Use metalaxyl or mancozeb-based fungicides. Destroy infected plant debris.",
        "healthy": "Continue current care. Ensure balanced fertilization.",
        "Bacterial_spot": "Apply copper-based fungicides. Rotate crops annually.",
        "Apple_scab": "Apply Myclobutanil or sulfur-based sprays during dormant season.",
        "Black_rot": "Prune infected branches and apply copper-based sprays."
    }
    for key, val in treatments.items():
        if key in disease: return val
    return "Ensure proper soil nutrition and apply appropriate organic fungicides."

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
