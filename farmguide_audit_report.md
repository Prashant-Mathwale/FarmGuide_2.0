# FARMGUIDE 2.0 — COMPLETE EXISTING PROJECT AUDIT

> **STATUS:** AUDIT PHASE COMPLETE. NO CODE HAS BEEN MODIFIED.

---

## A. CURRENT ARCHITECTURE

The current FarmGuide architecture operates on a Microservices / API Gateway pattern, composed of three main layers:

1. **Frontend (React + Vite):** A modern SPA using Tailwind CSS and Framer Motion. 
2. **Backend (Node.js + Express):** Acts as the API Gateway and business logic layer. Handles authentication, database interactions, and securely proxies requests to external APIs and the ML microservice.
3. **ML Service (Python + FastAPI):** A high-performance inference server hosting Scikit-Learn tabular models and a TensorFlow CNN.

**Actual Architecture Flow:**
```text
User 
  ↓ (HTTP/REST)
React Frontend (Port 5173)
  ↓ (Axios)
Node/Express Backend (Port 5000)
  ├──→ MongoDB (Auth, Market Caching, Soil Data History)
  ├──→ External APIs (OpenWeatherMap, Data.gov.in, Google Gemini)
  └──→ FastAPI ML Service (Port 8000) (Crop, Pest, Disease, Yield, Risk)
```

**Architectural Violation Found:**
In `client/src/pages/Schemes.jsx`, the frontend bypasses the Node.js API Gateway entirely and makes a direct POST request to `http://127.0.0.1:8000/schemes/search`. This breaks the microservices architecture, exposes the ML service to the client, and will cause CORS/Connection errors in production.

---

## B. EXISTING FEATURES

Complete inventory based on repository inspection:

1. **Authentication:** JWT-based login/registration. Stores user state, district, and land size.
2. **Dashboard:** Centralized hub for users (UI present, needs routing hookup).
3. **Crop Recommendation:** Takes NPK, pH, weather data -> returns top 3 crops.
4. **Disease Detection:** Uploads leaf image -> runs CNN -> returns disease -> triggers Gemini for natural language treatment protocol.
5. **Pest Prediction:** Predicts pest outbreak probability based on environmental factors.
6. **Yield Prediction:** Estimates crop yield based on state, crop, and weather.
7. **Market Prices:** Fetches live commodity prices from `api.data.gov.in` and intelligently caches them in MongoDB for 24 hours.
8. **Market Trends:** Uses Pandas on a static CSV to calculate SMA and Volatility to recommend Buy/Hold.
9. **Weather:** Fetches 5-day forecast from OpenWeatherMap (includes a hardcoded mock fallback if API key is missing).
10. **Government Schemes:** Filters a local CSV of schemes based on user profile (State, Land size, Gender, Caste) using a relevance scoring algorithm.
11. **Agri-Bot:** A generative AI chatbot powered by Google Gemini.
12. **Soil Data Logging:** Saves soil test inputs to MongoDB tied to the User ID.

---

## C. FEATURE-BY-FEATURE STATUS

| Feature | Location | Status | Classification |
|---|---|---|---|
| **Authentication** | `authController.js`, `App.jsx` | Working | **IMPROVE** (Move JWT to cookies) |
| **Disease Detection** | `mlController.js`, `DiseaseDetect.jsx`, `app.py` | Working | **INTEGRATE** (Connect to future Crop Health/Scan History) |
| **Crop Recommendation** | `CropRec.jsx`, `mlController.js`, `app.py` | Working | **KEEP** |
| **Pest/Yield Prediction** | `PestPrediction.jsx`, `app.py` | Working | **KEEP** |
| **Market Prices** | `marketController.js`, `MarketData.js` | Working | **IMPROVE** (Add DB indexes for caching) |
| **Weather** | `weatherController.js`, `Weather.jsx` | Working | **KEEP** |
| **Gov Schemes** | `Schemes.jsx`, `app.py` | Broken in Prod | **FIX** (Reroute through Node Gateway) |
| **Agri-Bot** | `chatController.js`, `Chatbot.jsx` | Working | **INTEGRATE** (Expand into Farm Copilot) |
| **Cost of Cultivation** | `train_cost_model.py`, `app.py` | Backend Only | **IMPROVE** (Needs frontend UI) |

---

## D. DATABASE STRUCTURE

**Database:** MongoDB via Mongoose

1. **`User` Collection**
   - **Fields:** `fullName`, `phone` (Unique index), `passwordHash`, `state`, `district`, `landSizeAcres`, `role` (default 'farmer').
   - **Hooks:** Pre-save bcrypt hashing.

2. **`SoilData` Collection**
   - **Fields:** `userId` (Ref: User), `N_level`, `P_level`, `K_level`, `pH_value`, `moisture`, `inputMethod`.
   - **Relationships:** Belongs to User. Acts as a historical log.

3. **`MarketData` Collection (Cache)**
   - **Fields:** `cropName`, `marketName`, `districtName`, `stateName`, `minPrice`, `maxPrice`, `modalPrice`, `recordedDate`.
   - **Flaw:** Missing compound indexes on frequently queried fields (`cropName`, `stateName`, `districtName`), which will lead to full collection scans.

---

## E. API STRUCTURE

**Node.js API Gateway (`server/routes/`):**
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- **ML Proxy:** 
  - `POST /api/ml/crop-recommendation`
  - `POST /api/ml/disease-detect` (Uses Multer `memoryStorage`)
  - `POST /api/ml/pest-predict`
  - `POST /api/ml/yield-predict`
- **Market:** `GET /api/market/prices`, `GET /api/market/trend`
- **Weather:** `GET /api/weather/forecast`
- **Chat:** `POST /api/chat`

---

## F. ML STRUCTURE

**Service:** FastAPI (`ml/app.py`)

1. **Disease Model (CNN)**
   - **File:** `disease_model.h5`
   - **Preprocessing:** Converts to RGB, resizes to 224x224, normalizes pixels (`/ 255.0`), expands dims.
   - **Output:** Argmax mapped to `disease_classes.json`.
2. **Crop Model**
   - **File:** `crop_model.pkl` (Classifier)
   - **Input:** N, P, K, Temp, Humidity, pH, Rainfall. Returns top 3 probabilities.
3. **Pest Model**
   - **Files:** `pest_classifier.pkl`, `pest_regressor.pkl`, `pest_crop_encoder.pkl`, `pest_location_encoder.pkl`
   - **Preprocessing:** Categorical encoding for Crop and Location.
4. **Yield Model**
   - **Files:** `yield_model.pkl`, `area_encoder.pkl`, `item_encoder.pkl`
5. **Data/Analytics endpoints:**
   - `/predict_risk`: Rule-based logic assessing weather variance and price data.
   - `/price_trend`: Pandas data manipulation (SMA, CoV) on `Agriculture_price_dataset.csv`.
   - `/schemes/search`: Pandas Regex filtering and scoring on `schemes.csv`.

---

## G. SECURITY FINDINGS

1. **Vulnerable Token Storage:** JWT is stored in `localStorage` in the frontend, exposing it to XSS attacks.
2. **Missing Input Validation:** The Node API uses `req.body` directly in DB queries and external API calls without Joi/Zod validation.
3. **Unrestricted File Uploads:** The `Multer` configuration for disease detection uses `memoryStorage()` with no file size limits. A large file payload will crash the Node server (DoS).
4. **Exposed Internal Service:** The frontend hardcodes `http://127.0.0.1:8000` for schemes, which exposes the internal architecture and bypasses CORS.

---

## H. FRONTEND FINDINGS

1. **UI/UX:** Extremely high-quality UI. Consistent use of glassmorphism, Framer Motion, and Lucide icons.
2. **State Management:** Missing a global state manager (Redux/Zustand). The `user` object is prop-drilled from `App.jsx` down through `Layout` to individual pages.
3. **Error Handling:** Lacks a global React Error Boundary. API failures currently rely on basic `alert()` popups.
4. **Responsive Design:** Good usage of Tailwind grid and flex classes for mobile adaptability.

---

## I. EXISTING BUGS

1. **Schemes Search Network Error:** In production or non-local environments, the Scheme search will fail due to the hardcoded `127.0.0.1` address.
2. **Multer Memory Exhaustion:** Large image uploads on `/api/ml/disease-detect` can crash the Node instance.
3. **Gemini Fallback Model:** The backend explicitly calls `gemini-1.5-flash` or `gemini-2.0-flash`. If these models are deprecated or unavailable in the region, the chatbot fails entirely.

---

## J. TECHNICAL DEBT

1. **Prop Drilling:** Passing `user` and `setUser` through routing into `Layout` into components.
2. **Database Indexes:** Market data caching relies on Regex queries (`new RegExp(cropName, 'i')`) without indexes, which scales terribly.
3. **Separation of Concerns:** Some React components mix heavy API fetching logic with UI rendering. Needs custom hooks (e.g., `useWeather`, `useMarketData`).

---

## K. WHAT SHOULD NOT BE CHANGED

1. **The Machine Learning Models:** The Python `.pkl` and `.h5` files are working correctly and should be preserved.
2. **The Visual Design Language:** The glassmorphism, gradients, and animations are excellent and provide a premium feel.
3. **The Microservices Split:** Keeping Python for ML and Node for API Gateway is the correct architectural choice.

---

## L. WHAT SHOULD BE ENHANCED

1. **Security:** Implement HttpOnly cookies for JWT, add rate limiting, and add input validation.
2. **Routing Integrity:** Route *all* frontend requests through Node.js (Proxy the Schemes endpoint).
3. **State Management:** Implement Redux Toolkit or React Context for the User session.
4. **Database:** Add indexes to MongoDB schemas.
5. **User Profiles:** Save ML predictions (scanned diseases, recommended crops) to the user's database profile.

---

## M. RECOMMENDED IMPLEMENTATION ORDER

**Phase 1: Stabilization & Security (P0 - Immediate)**
1. Fix `Schemes.jsx` API bypass (Route through Node).
2. Add Multer file size limits (5MB).
3. Move JWT to HttpOnly cookies.
4. Add global React Error Boundaries.

**Phase 2: Technical Debt Reduction (P1)**
5. Implement Global State (Zustand/Redux).
6. Add MongoDB indexes for `MarketData`.
7. Add `express-validator` to Node routes.

**Phase 3: Integration of Existing Orphaned Features (P2)**
8. Build frontend UI for the existing `predict_risk` and Cost of Cultivation endpoints.

**Phase 4: FarmGuide 2.0 New Feature Implementation (P3)**
9. Begin scaffolding new FarmGuide 2.0 modules (Marketplace, Farm Management, Community).

---

## N. ESTIMATED DEPENDENCIES BETWEEN FEATURES (For FarmGuide 2.0 Integration)

1. **Crop Health Intelligence:** Will heavily depend on the existing `Disease Detection` CNN and `SoilData` collection. Needs a new `Fields/Farms` collection to attach scan history.
2. **Field Intelligence:** Requires a fundamental shift in the DB. `User` must have a one-to-many relationship with `Fields`, and all predictions (Yield, Crop Rec) must be tied to a specific `Field` rather than just the `User`.
3. **Farm Copilot:** Can directly wrap and extend the existing `Agri-Bot` (Gemini integration), but needs access to the user's new `Farm Management` calendar and contextual data.
4. **Marketplace:** Independent module, but can tie into `Market Prices` to show local commodity trends alongside seed/fertilizer costs.
