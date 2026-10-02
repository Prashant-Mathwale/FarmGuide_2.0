# 🌾 FarmGuide 2.0 - Intelligent Farming Assistant

FarmGuide is an advanced, microservices-based agricultural platform designed to empower farmers with data-driven insights and artificial intelligence. By integrating machine learning models, external APIs, and an intuitive dashboard, FarmGuide helps in crop planning, disease detection, resource optimization, and market analysis.

---

## ✨ Key Features

- 🌱 **Crop Recommendation:** AI-powered suggestions for the best crops to plant based on soil metrics and weather.
- 💊 **Disease Detection:** Upload images of crop leaves to automatically detect diseases via a Convolutional Neural Network (CNN). Uses Google Gemini for dynamic treatment generation.
- 🐛 **Pest Prediction:** Predictive modeling for pest outbreaks based on weather and soil data.
- 📈 **Market Prices & Trends:** Live analytics, visualizations, and buy/sell recommendations for current market prices, cached intelligently.
- 🌤️ **Real-time Weather:** 5-day contextual weather forecasts.
- 🏛️ **Government Schemes:** AI-based matching engine to identify relevant agricultural grants and subsidies based on a farmer's profile.
- 🤖 **Agri-Bot:** A generative AI conversational assistant powered by Google Gemini to answer farming queries 24/7.
- 📊 **Interactive Dashboard:** A sleek, glassmorphism-styled dashboard built with Framer Motion for a seamless user experience.

---

## 🏛️ System Architecture

The system uses a **Microservices / API Gateway Pattern**.

**Data Flow:**
`User` ➔ `React Frontend` ➔ `Node.js Backend (Port 5000)`

From the Node backend, the flow branches out to:
1. **DB Operations:** ➔ `MongoDB` (Authentication, Market Caching, Soil Data)
2. **External APIs:** ➔ `OpenWeatherMap`, `Data.gov.in`, `Google Gemini`
3. **ML Inference:** ➔ `Python FastAPI (Port 8000)`

*Note: The Node server acts as a secure proxy for the ML server, ensuring authentication and hiding the heavy ML endpoints from the public internet.*

---

## 🛠️ Complete Technology Stack

### Frontend (Client)
- **React 19 & Vite:** High-performance UI rendering and compilation.
- **Tailwind CSS 4 & Framer Motion:** For utility-first glassmorphism styling and smooth micro-animations.
- **Recharts:** Data visualization for market trends.
- **Lucide React:** Modern iconography.

### Backend (Node Service)
- **Node.js & Express.js:** API Gateway and core business logic handling.
- **Mongoose:** ODM for MongoDB schema modeling.
- **Bcrypt & JWT:** Secure password hashing and stateless authentication.
- **Multer:** Handling multipart/form-data for image uploads.
- **Google Generative AI:** NLP processing for the Agri-bot and disease treatments.

### Machine Learning (Python Service)
- **Python 3 & FastAPI:** Blazing fast, asynchronous model serving.
- **TensorFlow / Keras:** Deep learning (CNN) for leaf disease classification.
- **Scikit-Learn:** Tabular predictive models (Yield, Fertilizer, Cost, Pest, Crop) using Decision Trees/Random Forests.
- **Pandas & NumPy:** Data manipulation and serving market/scheme queries directly from CSV datasets.

---

## 🗂️ Project Structure

```text
FarmGuide/
├── client/                     # Frontend Vite Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Layout, Chatbot)
│   │   ├── pages/              # Route views (Dashboard, CropRec, DiseaseDetect, etc.)
│   │   ├── services/           # API handlers (axios instances)
│   │   ├── App.jsx             # Main React Router setup
│   │   └── main.jsx            # React 19 entry point
│   └── package.json            
├── server/                     # Node.js API Gateway
│   ├── config/                 # DB connection (db.js)
│   ├── controllers/            # Business logic (auth, ml, market, weather, chat)
│   ├── middleware/             # JWT auth verification (auth.js)
│   ├── models/                 # Mongoose Schemas (User, SoilData, MarketData)
│   ├── routes/                 # Express route definitions
│   ├── server.js               # Entry point & graceful shutdown
│   └── app.js                  # Express app configuration
├── ml/                         # Python AI Microservice
│   ├── dataset/                # Raw CSVs (schemes, weather, market)
│   ├── models/                 # Serialized .pkl and .h5 ML models
│   ├── app.py                  # FastAPI server and inference logic
│   ├── train_*.py              # Training scripts for various ML models
│   └── requirements.txt        
├── docker-compose.yml          # Multi-container orchestration
└── README.md                   # Documentation
```

---

## 📡 API Documentation

The Node.js server exposes the following endpoints to the frontend:

| METHOD | ENDPOINT | PURPOSE | AUTH REQUIRED |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new user account | No |
| POST | `/api/auth/login` | Login and receive a JWT | No |
| POST | `/api/ml/crop-recommendation` | Forward soil data to ML for crop suggestions | Yes |
| POST | `/api/ml/disease-detect` | Upload leaf image; get disease & Gemini treatment | Yes |
| POST | `/api/ml/pest-predict` | Predict pest outbreaks based on weather/soil | Yes |
| POST | `/api/ml/yield-predict` | Predict crop yield based on conditions | Yes |
| GET | `/api/market/prices` | Fetch commodity prices (caches to DB) | No |
| GET | `/api/market/trend` | Get price trend predictions from ML | No |
| GET | `/api/weather/forecast` | Fetch 5-day weather data (OpenWeather) | No |
| POST | `/api/chat` | AI Agronomy chat via Gemini | No |

---

## 🗄️ Database Schema Deep Dive

**Database used:** MongoDB (via Mongoose)

1. **User Collection (`User.js`)**
   - Stores user authentication and profile data.
   - Fields: `fullName`, `phone` (Unique), `passwordHash`, `state`, `district`, `landSizeAcres`, `role`.
   - Security: Passwords are automatically hashed via a `pre('save')` bcrypt hook.

2. **SoilData Collection (`SoilData.js`)**
   - Keeps track of soil tests performed by users.
   - Fields: `userId` (Ref: User), `N_level`, `P_level`, `K_level`, `pH_value`, `moisture`, `inputMethod`.

3. **MarketData Collection (`MarketData.js`)**
   - Acts as an intelligent cache layer to prevent rate-limiting from the government API.
   - Fields: `cropName`, `marketName`, `districtName`, `stateName`, `minPrice`, `maxPrice`, `modalPrice`, `recordedDate`.

---

## 🧠 AI / Machine Learning Pipeline

1. **Model Loading:** Happens globally at FastAPI startup (`ml/app.py`). Models are loaded from the `/models` directory into memory.
2. **Tabular Models (Yield, Pest, Crop):** 
   - Utilizes Scikit-learn regressors and classifiers.
   - Categorical inputs (Crop Type, Location) are transformed securely using saved `LabelEncoders` before running predictions.
3. **Disease Detection (CNN):** 
   - Receives raw byte stream from Node.js.
   - Converts to PIL Image -> RGB -> Resizes to `224x224`.
   - Normalizes pixels (`/ 255.0`) and passes through the `disease_model.h5` Keras model.
   - Retrieves the class index and matches it to `disease_classes.json`.
   - *Fallback:* If a disease is detected, the Node.js backend intercepts the response and uses Google Gemini to generate a highly specific, human-readable treatment plan dynamically.
4. **Market Trends:** Uses raw Pandas rolling averages (SMA) and Coefficient of Variation (CV) on CSV data to determine price volatility and generate Buy/Sell recommendations.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) 3.9+ 
- MongoDB locally or via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Docker Desktop (Optional, for containerized setup)

### 1. Clone the repository

```bash
git clone https://github.com/Prashant-Mathwale/FarmGuide.git
cd FarmGuide
```

### 2. Setup Using Docker (Recommended)

You can spin up the entire stack using Docker Compose without needing to set up Python and Node.js environments manually.

```bash
# Create a .env file in the server directory
echo "MONGO_URI=your_mongodb_connection_string" > server/.env
echo "JWT_SECRET=your_jwt_secret" >> server/.env
echo "GEMINI_API_KEY=your_gemini_api_key" >> server/.env
echo "DATA_GOV_API_KEY=your_gov_api_key" >> server/.env
echo "ML_SERVICE_URL=http://ml:8000" >> server/.env

# Start all services
docker-compose up --build
```
- Client runs on: `http://localhost:5173`
- Server API runs on: `http://localhost:5000`
- ML Service runs on: `http://localhost:8000`

### 3. Setup Manually

If you prefer to run services individually:

#### A. Setup the ML Service (FastAPI)

```bash
cd ml
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### B. Setup the Node.js Backend

```bash
cd server
npm install

# Create server/.env
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# ML_SERVICE_URL=http://localhost:8000
# GEMINI_API_KEY=your_gemini_api_key

# Start the server
npm run dev
```

#### C. Setup the React Frontend

```bash
cd client
npm install

# Create client/.env
# VITE_API_URL=http://localhost:5000/api

# Start Vite dev server
npm run dev
```

---

<<<<<<< HEAD
## 🚧 Known Issues & Development Roadmap

As part of the continuous improvement of the codebase, the following items are on the immediate development roadmap:

1. **Security Fix:** The `Schemes.jsx` component currently bypasses the API Gateway and makes direct calls to the Python ML server (`http://127.0.0.1:8000`). This will be routed through the Node.js server to prevent CORS and security issues in production.
2. **Security Hardening:** Migration of JWT storage from `localStorage` to `HttpOnly` Cookies to mitigate XSS vulnerabilities.
3. **Database Performance:** Addition of Compound Indexes to the `MarketData` schema to handle growing cache sizes efficiently.
4. **Missing UI:** The Python ML server contains fully working models for "Cost of Cultivation" and "Risk Analysis", but the React Frontend UI for these endpoints needs to be built.
5. **Input Validation:** Integration of `express-validator` to sanitize all incoming API requests.
=======
---

### 📱 Testing Camera Capture on Mobile (Over HTTPS)

Modern mobile browsers (Chrome on Android, Safari on iOS) require a **secure context (HTTPS)** to grant access to the camera (`navigator.mediaDevices.getUserMedia`). You have two easy ways to test on a physical phone:

#### Option A: Local Wi-Fi with Vite Basic SSL (Built-in)
Make sure your phone and development computer are connected to the same Wi-Fi network.

```bash
cd client
npm run dev:https
```

1. Vite will start with `@vitejs/plugin-basic-ssl` enabled and show your local network URL:
   ```text
   ➜  Local:   https://localhost:5173/
   ➜  Network: https://192.168.x.x:5173/
   ```
2. Open the `https://192.168.x.x:5173/` URL on your phone's browser.
3. Because the SSL certificate is auto-generated locally:
   - **Chrome (Android):** Tap **Advanced** → **Proceed to site (unsafe)**.
   - **Safari (iOS):** Tap **Show Details** → **visit this website** → Confirm.
4. Navigate to **Disease Detection** → tap **Take photo**. Your camera viewfinder and torch toggle are now active!

#### Option B: Tunnel via ngrok or cloudflared
If you prefer not to bypass self-signed SSL warnings or are on different networks:

- **Using ngrok:**
  ```bash
  ngrok http 5173
  ```
  Open the provided `https://<id>.ngrok-free.app` URL on your mobile device.

- **Using cloudflared:**
  ```bash
  cloudflared tunnel --url http://localhost:5173
  ```
  Open the provided `https://<id>.trycloudflare.com` URL on your mobile device.
>>>>>>> 0d29e2a5ec70a33e01922dd661b0920e3df7e652

---

## 👥 Farmer Community & Registration

FarmGuide features a localized peer community and structured profile management:
- **Registration & Locations:** Dependent dropdowns based on `server/data/locations.json`, 10-digit Indian phone validation, and multi-select crops from active database records.
- **Farmer Community:** Ask questions, upload up to 3 photos (processed via `sharp` with EXIF/GPS stripped), mark solutions as helpful, and automatic safety moderation.
- **Scan-to-Community Sharing:** Seamlessly share disease detection scans into the community with one click.
- **Privacy First:** Phone numbers, land sizes, and private credentials are never exposed in public profiles or APIs.

### 🌾 Crop Seeding (`seed:crops`)
Crops are generated programmatically from the ML model's disease classes:

```bash
cd server
npm run seed:crops
```
This inspects `ml/models/disease_classes.json`, extracts unique crop categories, maps localized multilingual names (English, Hindi, Marathi), and upserts them into MongoDB.

### ⚙️ Environment Variables
Copy `server/.env.example` to `server/.env.local` or `server/.env`:
- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key for signing user tokens.
- `STORAGE_DRIVER`: `local` (serves from `server/uploads/community`) or `cloudinary`.
- `COMMUNITY_POSTS_PER_HOUR` / `COMMUNITY_COMMENTS_PER_HOUR`: Express rate limits per user.
- `COMMUNITY_REPORT_HIDE_THRESHOLD`: Number of reports before content is automatically hidden for moderation review.

### 🧪 Running Tests
```bash
cd server
npm test               # Runs complete test suite (Stage 1, Stage 2, and Disease Knowledge)
npm run test:stage1    # Registration, profile validation, phone immutability, whitelist
npm run test:stage2    # Community posts, comments, helpful toggle, moderation, rate limits
```

---

## 🤝 Contributing

Contributions are always welcome!
1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---
*FarmGuide - Cultivating the future with AI.*
