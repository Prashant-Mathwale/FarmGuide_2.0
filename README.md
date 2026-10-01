# 🌾 FarmGuide - Intelligent Farming Assistant

FarmGuide is an all-in-one smart agricultural platform designed to empower farmers with data-driven insights and artificial intelligence. By integrating machine learning models, external APIs, and an intuitive dashboard, FarmGuide helps in crop planning, disease detection, resource optimization, and market analysis. 

---

## ✨ Key Features

- 🌱 **Crop Recommendation:** AI-powered suggestions for the best crops to plant based on soil metrics and weather.
- 💊 **Disease Detection:** Upload images of crop leaves to automatically detect diseases and receive actionable cures.
- 🧪 **Fertilizer Recommendation:** Get precise fertilizer (N-P-K) usage estimates for optimal yield.
- 💧 **Irrigation & Pest Prediction:** Stay ahead with predictive modeling for irrigation cycles and pest outbreaks.
- 🌤️ **Real-time Weather:** Contextual weather forecasts to plan farming activities securely.
- 📈 **Market Prices:** Live analytics and visualizations for current market prices of various crops.
- 🏛️ **Government Schemes:** Access curated list of government schemes, subsidies, and grants for agriculture.
- 🤖 **Agri-Bot:** A generative AI conversational assistant to answer farming-related queries 24/7.
- 📊 **Interactive Dashboard:** A sleek, glassmorphism-styled dashboard for seamless user experience.

---

## 🛠️ Technology Stack

FarmGuide uses a robust modern micro-services architecture mapping the frontend, backend, and machine learning models:

### Frontend
- **React.js + Vite** for high-performance UI
- **Tailwind CSS & Framer Motion** for beautiful glassmorphism designs and smooth animations
- **Recharts** for rich data visualizations

### Backend (Node.js)
- **Express.js & Node.js** as the core web framework
- **MongoDB & Mongoose** for database and schema modeling
- **JWT & Bcrypt** for secure authentication
- **Node-NLP & Google Generative AI** for Agri-Bot processing

### Machine Learning Service (Python)
- **FastAPI** for blazing fast, reliable model serving
- **Scikit-Learn, Pandas & NumPy** for tabular predictive models (Yield, Fertilizer, etc.)
- **TensorFlow / Keras** for deep learning image classification (Disease Detection)

---

## 🗂️ Project Structure

```text
FarmGuide/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Dashboard, Schemes, MarketPrices, DiseaseDetect, etc.
│   │   └── services/    # API integrations
│   └── package.json
├── server/              # Node.js + Express backend
│   ├── controllers/     # Route logic for auth, user, and ml handoffs
│   ├── models/          # MongoDB schemas
│   ├── routes/          # Express API routes
│   └── package.json
├── ml/                  # Python FastAPI Machine Learning engine
│   ├── app.py           # ML API Endpoints
│   ├── models/          # .pkl or .h5 serialized trained models
│   └── requirements.txt # Python dependencies
└── dataset/             # Raw CSV data files for training models
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/) 3.9+ 
- MongoDB locally or via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Prashant-Mathwale/FarmGuide.git
cd FarmGuide
```

### 2. Setup the ML Service

The ML service handles all AI predictions (FastAPI).

```bash
cd ml
# Create a virtual environment (optional but recommended)
python -m venv venv
# Activate the virtual environment
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Setup the Node.js Backend

The backend handles authentication, user data, and proxies to the ML service.

```bash
# Open a new terminal
cd server

# Install dependencies
npm install

# Create a .env file based on .env.example and populate necessary variables:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# ML_SERVICE_URL=http://localhost:8000 (or your hugging face hosted url)

# Start the development server
npm run dev
```

### 4. Setup the React Frontend

The client-side interface.

```bash
# Open a new terminal
cd client

# Install dependencies
npm install

# Create a .env file and set the backend map:
# VITE_API_URL=http://localhost:5000/api

# Start the Vite development server
npm run dev
```

The application should now be running on `http://localhost:5173`.



---

## 🤝 Contributing

Contributions are always welcome!
1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

