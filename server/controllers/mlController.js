const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const SoilData = require('../models/SoilData');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const getCropRecommendation = async (req, res) => {
    const { N_level, P_level, K_level, pH_value, moisture, temperature, rainfall } = req.body;
    try {
        // Save the input data
        let soilDataId = null;
        if (req.user && req.user._id) {
            const soilData = await SoilData.create({
                userId: req.user._id,
                N_level, P_level, K_level, pH_value, moisture
            });
            soilDataId = soilData._id;
        }

        // Prepare data for Python Microservice
        const payload = {
            N: parseFloat(N_level) || 0,
            P: parseFloat(P_level) || 0,
            K: parseFloat(K_level) || 0,
            temperature: parseFloat(temperature) || 25.0,
            humidity: parseFloat(moisture) || 0,
            ph: parseFloat(pH_value) || 0,
            rainfall: parseFloat(rainfall) || 200.0
        };

        // Call the Python FastAPI microservice
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        console.log(`[ML] Requesting Crop Recommendation from: ${mlUrl}/predict_crop`);
        const pythonApiRes = await axios.post(`${mlUrl}/predict_crop`, payload, { timeout: 120000 });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to get prediction from ML server');
        }

        const recommendations = pythonApiRes.data.recommendations.map(rec => ({
            name: rec.name,
            match: Math.round(rec.confidence)
        }));

        res.json({
            success: true,
            recommendedCrops: recommendations,
            soilDataId: soilDataId
        });
    } catch (error) {
        console.error("ML Prediction Error Details:", error);
        res.status(500).json({ success: false, message: 'Crop recommendation failed. ' + error.message });
    }
};

const FormData = require('form-data');

const detectDisease = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        // Prepare Form Data for Python Microservice
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const formHeaders = form.getHeaders();
        const contentLength = form.getLengthSync();

        // Call the Python FastAPI microservice
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        console.log(`[ML] Requesting Disease Detection from: ${mlUrl}/predict_disease`);
        const pythonApiRes = await axios.post(`${mlUrl}/predict_disease`, form, {
            headers: {
                ...formHeaders,
                'Content-Length': contentLength
            },
            timeout: 120000
        });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to detect disease from ML server');
        }

        let suggestedAction = pythonApiRes.data.treatment;
        const detectedDisease = pythonApiRes.data.disease;

        // Use Gemini for dynamic treatment if it's an actual disease
        const isHealthy = detectedDisease && detectedDisease.toLowerCase().includes('healthy');

        if (!isHealthy) {
            try {
                if (process.env.GEMINI_API_KEY) {
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                    let result;
                    try {
                        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                        const prompt = `A farmer's crop was just diagnosed with ${detectedDisease} by a CNN model. Provide a very concise, practical, and direct treatment recommendation. Example format: "Spray Mancozeb 2 grams per liter in the evening. Repeat after 7 days." Keep it to 1 or 2 sentences max.`;
                        result = await model.generateContent(prompt);
                    } catch (primaryModelError) {
                        console.warn("Gemini 2.0-flash not found or failed, trying gemini-flash-latest fallback...");
                        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                        const prompt = `A farmer's crop was just diagnosed with ${detectedDisease} by a CNN model. Provide a very concise, practical, and direct treatment recommendation. Example format: "Spray Mancozeb 2 grams per liter in the evening. Repeat after 7 days." Keep it to 1 or 2 sentences max.`;
                        result = await model.generateContent(prompt);
                    }
                    const responseText = result.response.text();

                    if (responseText) {
                        suggestedAction = responseText.trim();
                    }
                } else {
                    console.warn("GEMINI_API_KEY is missing, falling back to static treatment.");
                    // Keep suggestedAction from Python as the static treatment
                }
            } catch (geminiError) {
                console.error("Gemini Treatment Generation Error Details:", geminiError.message || geminiError);
                console.error("Gemini Stack:", geminiError.stack);
                suggestedAction = `[DEBUG] Gemini Error: ${geminiError.message}`;
            }
        }

        res.json({
            success: true,
            detectedDisease: detectedDisease,
            confidenceScore: pythonApiRes.data.confidence,
            suggestedAction: suggestedAction
        });
    } catch (error) {
        console.error("Disease Detection Error:", error.message);
        res.status(500).json({ success: false, message: 'Disease detection failed. Is the Python ML server running?' });
    }
};

const predictPest = async (req, res) => {
    try {
        const payload = req.body;
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/predict_pest`, payload);

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to get pest prediction from ML server');
        }

        res.json({
            success: true,
            pest: pythonApiRes.data.pest,
            probability: pythonApiRes.data.probability
        });
    } catch (error) {
        console.error("Pest Prediction Error:", error.message);
        res.status(500).json({ success: false, message: 'Pest prediction failed. ' + error.message });
    }
};

const predictIrrigation = async (req, res) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/predict_irrigation`, req.body, { timeout: 120000 });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to get irrigation prediction');
        }

        res.json(pythonApiRes.data);
    } catch (error) {
        console.error("Irrigation Prediction Error:", error.message);
        res.status(500).json({ success: false, message: 'Irrigation prediction failed. ' + error.message });
    }
};

const predictYield = async (req, res) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/predict_yield`, req.body, { timeout: 120000 });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to get yield prediction');
        }

        res.json(pythonApiRes.data);
    } catch (error) {
        console.error("Yield Prediction Error:", error.message);
        res.status(500).json({ success: false, message: 'Yield prediction failed. ' + error.message });
    }
};

module.exports = { getCropRecommendation, detectDisease, predictPest, predictIrrigation, predictYield };
