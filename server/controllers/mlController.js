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
            timeout: 120000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024,
        });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to detect disease from ML server');
        }

        const mlData = pythonApiRes.data;
        const detectedDisease = mlData.disease || null;
        const guardStatus = mlData.status || 'ok';
        let suggestedAction = mlData.treatment || null;

        // Use Gemini for dynamic treatment only when we have an actual disease result
        if (detectedDisease && !detectedDisease.toLowerCase().includes('healthy') && guardStatus !== 'uncertain') {
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
                }
            } catch (geminiError) {
                console.error("Gemini Treatment Generation Error Details:", geminiError.message || geminiError);
                console.error("Gemini Stack:", geminiError.stack);
                suggestedAction = `[DEBUG] Gemini Error: ${geminiError.message}`;
            }
        }

        // Forward all fields — old and new — to the client
        res.json({
            success: true,
            detectedDisease: detectedDisease,
            confidenceScore: mlData.confidence,
            suggestedAction: suggestedAction,
            heatmap: mlData.heatmap || null,
            // New guard fields (forwarded unchanged)
            status: guardStatus,
            guardMessage: mlData.message || null,
            reasons: mlData.reasons || [],
            topPredictions: mlData.top_predictions || [],
            quality: mlData.quality || {},
            confidenceMetrics: mlData.confidence_metrics || {},
            warnings: mlData.warnings || [],
        });
    } catch (error) {
        console.error("Disease Detection Error:", error.message);
        res.status(500).json({ success: false, message: 'Disease detection failed: ' + error.message });
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

        const predictedPest = pythonApiRes.data.pest;
        const outbreakProb = pythonApiRes.data.probability;
        let actionPlan = "Monitor crop closely and maintain good agricultural practices.";

        // Integrate Gemini Action Plan if probability is high enough
        if (outbreakProb > 50 && process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const prompt = `A predictive ML model has flagged a ${outbreakProb.toFixed(1)}% probability of an outbreak of ${predictedPest} in a ${payload.Crop_Type} field located in ${payload.Location}. Provide a highly concise, practical, and immediate preventative action plan for the farmer. Maximum 2 sentences. Format: "Action: [What to do]."`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                if (responseText) {
                    actionPlan = responseText.trim();
                }
            } catch (geminiError) {
                console.error("Gemini Pest Action Plan Error:", geminiError.message);
                try {
                    // Fallback to flash-latest if 2.0 fails
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                    const prompt = `A predictive ML model has flagged a ${outbreakProb.toFixed(1)}% probability of an outbreak of ${predictedPest} in a ${payload.Crop_Type} field located in ${payload.Location}. Provide a highly concise, practical, and immediate preventative action plan for the farmer. Maximum 2 sentences. Format: "Action: [What to do]."`;
                    const result = await model.generateContent(prompt);
                    actionPlan = result.response.text().trim();
                } catch (e) { }
            }
        }

        res.json({
            success: true,
            pest: predictedPest,
            probability: outbreakProb,
            actionPlan: actionPlan
        });
    } catch (error) {
        console.error("Pest Prediction Error:", error.message);
        res.status(500).json({ success: false, message: 'Pest prediction failed. ' + error.message });
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

const searchSchemes = async (req, res) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/schemes/search`, req.body, { timeout: 120000 });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to search schemes');
        }

        res.json(pythonApiRes.data);
    } catch (error) {
        console.error("Schemes Search Error:", error.message);
        res.status(500).json({ success: false, message: 'Schemes search failed. ' + error.message });
    }
};

const predictRisk = async (req, res) => {
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/predict_risk`, req.body, { timeout: 120000 });

        if (!pythonApiRes.data.success) {
            throw new Error(pythonApiRes.data.message || 'Failed to predict risk');
        }

        res.json(pythonApiRes.data);
    } catch (error) {
        console.error("Risk Prediction Error:", error.message);
        res.status(500).json({ success: false, message: 'Risk prediction failed. ' + error.message });
    }
};

module.exports = { getCropRecommendation, detectDisease, predictPest, predictYield, searchSchemes, predictRisk };
