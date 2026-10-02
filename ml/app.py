import pickle
import numpy as np
import pandas as pd
import json
import io
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import logging

try:
    import tensorflow as tf
    from PIL import Image
    import cv2
    from gradcam import make_gradcam_heatmap, overlay_heatmap, to_base64_jpg
except ImportError as e:
    tf = None
    Image = None
    cv2 = None
    make_gradcam_heatmap = None
    overlay_heatmap = None
    to_base64_jpg = None
    print(f"Warning: Missing optional ML/vision dependency: {e}")

# Input guard (fail-open: if import fails, guards are disabled)
try:
    from input_guard import run_gate_a, run_gate_b, run_gate_c, run_gate_d
    from guard_config import GUARD_CONFIG
except ImportError as e:
    run_gate_a = None
    run_gate_b = None
    run_gate_c = None
    run_gate_d = None
    GUARD_CONFIG = {}
    print(f"Warning: input_guard not available, guards disabled: {e}")

guard_logger = logging.getLogger("input_guard")

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


import joblib
pest_forecaster = None
try:
    pest_forecaster = joblib.load('models/pest_forecaster/model.pkl')
except Exception:
    print("Warning: Pest forecaster model not found.")

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


class PestData(BaseModel):
    Temperature_C: float
    Humidity_percent: float
    Rainfall_mm: float
    Wind_Speed_kmh: float = 10.0
    Soil_Moisture: float = 50.0
    Soil_pH: float = 6.5
    Nitrogen_N: float = 0.0
    Phosphorus_P: float = 0.0
    Potassium_K: float = 0.0
    Crop_Type: str
    Growth_Stage: str = '1'
    Location: str = ""
    Season: str = ""

@app.post("/predict_pest")
async def predict_pest(data: PestData):
    if pest_forecaster is None:
        return {"success": False, "message": "Pest prediction model not loaded."}
    try:
        # Create a DataFrame since the Pipeline expects pandas with column names
        features_df = pd.DataFrame([{
            'crop': data.Crop_Type,
            'avg_temperature_c': data.Temperature_C,
            'annual_rainfall_mm': data.Rainfall_mm,
            'soil_moisture_percent': data.Soil_Moisture
        }])
        
        # Predict pressure
        pest_pressure = pest_forecaster.predict(features_df)[0]
        
        # Determine risk level
        if pest_pressure > 70:
            risk_level = "HIGH"
        elif pest_pressure > 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        risk_probability = float(max(0, min(100, pest_pressure)))
        
        return {
            "success": True, 
            "risk_probability": risk_probability,
            "risk_level": risk_level,
            "risk_window": "Next 5-7 days",
            "key_factors": ["Temperature", "Humidity", "Rainfall", "Crop Type", "Growth Stage"],
            "recommendation": "Inspect the field regularly and follow locally appropriate integrated pest-management guidance."
        }
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
    crop: str = ""

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
        if query.crop:
            crop_search = query.crop.lower()
            results.loc[results['details'].str.contains(crop_search, case=False) | results['scheme_name'].str.contains(crop_search, case=False), 'relevance_score'] += 20
            
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
                "link": f"https://www.myscheme.gov.in/schemes/{slug}" if slug else "https://www.myscheme.gov.in/",
                "relevance_score": int(row.get("relevance_score", 0))
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

def preprocess_image(contents: bytes):
    """
    Standard preprocessing for leaf images: converts to RGB, resizes to (224, 224),
    and scales pixel values to [0, 1].
    """
    img = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))
    img_array = np.expand_dims(np.array(img) / 255.0, axis=0)
    return img, img_array

def _format_label(raw_label):
    """Convert class name like 'Apple___Apple_scab' to 'Apple - Apple scab'."""
    return raw_label.replace("___", " - ").replace("__", " - ").replace("_", " ")


def _build_top_predictions(probs, top_indices):
    """Build top-3 prediction list from probability vector and sorted indices."""
    preds = []
    for i in top_indices[:3]:
        if i < len(disease_classes):
            preds.append({
                "label": _format_label(disease_classes[i]),
                "confidence": round(float(probs[i] * 100), 2)
            })
    return preds


@app.post("/predict_disease")
async def predict_disease(file: UploadFile = File(...)):
    # Base response fields — always present for backward compatibility
    base = {
        "success": True,
        "disease": None,
        "confidence": None,
        "treatment": None,
        "heatmap": None,
        # New guard fields
        "status": "ok",
        "message": "Diagnosis complete.",
        "reasons": [],
        "top_predictions": [],
        "quality": {"blur_score": None, "brightness": None, "plant_ratio": None},
        "confidence_metrics": {"top1": None, "margin": None, "entropy": None},
        "warnings": [],
    }
    try:
        if not tf or not disease_model:
            return {"success": False, "message": "Disease model is offline."}

        contents = await file.read()

        # ── Gate A: Image quality ───────────────────────────────────────
        gate_b_result = None
        if run_gate_a is not None:
            try:
                gate_a = run_gate_a(contents)
                base["quality"]["blur_score"] = gate_a["quality"]["blur_score"]
                base["quality"]["brightness"] = gate_a["quality"]["brightness"]
                if not gate_a["passed"]:
                    base["status"] = gate_a["status"]
                    base["message"] = gate_a["message"]
                    base["reasons"] = gate_a["reasons"]
                    return base
                img_bgr = gate_a["img_bgr"]
            except Exception as e:
                guard_logger.error(f"Gate A crashed (fail-open): {e}")
                base["warnings"].append(f"Quality check skipped: {e}")
                img_bgr = None
        else:
            img_bgr = None

        # ── Gate B: Leaf plausibility ───────────────────────────────────
        gate_b_borderline = False
        if run_gate_b is not None and img_bgr is not None:
            try:
                gate_b_result = run_gate_b(img_bgr)
                base["quality"]["plant_ratio"] = gate_b_result["plant_ratio"]
                if not gate_b_result["passed"]:
                    base["status"] = gate_b_result["status"]
                    base["message"] = gate_b_result["message"]
                    base["reasons"] = gate_b_result["reasons"]
                    return base
                gate_b_borderline = gate_b_result.get("borderline", False)
            except Exception as e:
                guard_logger.error(f"Gate B crashed (fail-open): {e}")
                base["warnings"].append(f"Leaf check skipped: {e}")

        # ── Gate D: Optional CLIP check ─────────────────────────────────
        if run_gate_d is not None and img_bgr is not None:
            try:
                gate_d = run_gate_d(img_bgr)
                if not gate_d["passed"]:
                    base["status"] = "not_a_leaf"
                    base["message"] = "This doesn't look like a plant leaf. Please upload a clear photo of a single leaf."
                    base["reasons"] = ["CLIP zero-shot check failed"]
                    return base
            except Exception as e:
                guard_logger.error(f"Gate D crashed (fail-open): {e}")
                base["warnings"].append(f"CLIP check skipped: {e}")

        # ── Run existing prediction (unchanged) ─────────────────────────
        img, img_array = preprocess_image(contents)
        predictions = disease_model.predict(img_array)
        probs = predictions[0]
        idx = int(np.argmax(probs))
        result_label = disease_classes[idx]

        # ── Gate C: Confidence checks ───────────────────────────────────
        if run_gate_c is not None:
            try:
                gate_c = run_gate_c(probs, gate_b_borderline=gate_b_borderline)
                base["status"] = gate_c["status"]
                base["message"] = gate_c["message"]
                base["reasons"] = gate_c["reasons"]
                base["confidence_metrics"] = gate_c["confidence_metrics"]
                base["top_predictions"] = _build_top_predictions(probs, gate_c["top_indices"])
            except Exception as e:
                guard_logger.error(f"Gate C crashed (fail-open): {e}")
                base["warnings"].append(f"Confidence check skipped: {e}")
                base["status"] = "ok"

        # ── Populate legacy fields based on status ──────────────────────
        if base["status"] == "ok" or base["status"] == "possible":
            base["disease"] = _format_label(result_label)
            base["confidence"] = round(float(probs[idx] * 100), 2)
            base["treatment"] = get_treatment(result_label)
        elif base["status"] == "uncertain":
            # Don't present a disease name as the answer; top-3 available in top_predictions
            base["disease"] = None
            base["confidence"] = None
            base["treatment"] = None

        # ── Grad-CAM heatmap (only for ok / possible) ───────────────────
        if base["status"] in ("ok", "possible"):
            if cv2 is not None and make_gradcam_heatmap is not None:
                try:
                    heatmap, _ = make_gradcam_heatmap(disease_model, img_array, class_index=idx)
                    original_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                    overlay = overlay_heatmap(original_bgr, heatmap, alpha=0.4)
                    base["heatmap"] = to_base64_jpg(overlay)
                except Exception as gradcam_err:
                    guard_logger.error(f"Grad-CAM failed: {gradcam_err}")
                    base["warnings"].append(f"Heatmap generation failed: {gradcam_err}")

        return base

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
