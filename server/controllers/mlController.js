const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const SoilData = require('../models/SoilData');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const diseaseAdvisorService = require('../services/diseaseAdvisorService');

// ── Curated Disease Knowledge Base (loaded once at startup) ─────────────────
const KNOWLEDGE_PATH = path.resolve(__dirname, '../data/disease_knowledge.json');
let diseaseKnowledge = {};
let normalizedKnowledgeMap = {};

try {
    if (fs.existsSync(KNOWLEDGE_PATH)) {
        diseaseKnowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
        Object.keys(diseaseKnowledge).forEach((key) => {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalizedKnowledgeMap[normKey] = diseaseKnowledge[key];
        });
        console.log(`[Knowledge] Successfully loaded ${Object.keys(diseaseKnowledge).length} curated disease entries.`);
    } else {
        console.warn(`[Knowledge] Warning: ${KNOWLEDGE_PATH} not found. Fallback recommendations will be used.`);
    }
} catch (err) {
    console.error(`[Knowledge] Error loading disease_knowledge.json: ${err.message}. Using fallback.`);
    diseaseKnowledge = {};
    normalizedKnowledgeMap = {};
}

const SAFETY_NOTICE = "General guidance only. Follow the product label, wear protective gear, and confirm with your local Krishi Vigyan Kendra or agronomist before spraying.";

/**
 * Look up curated disease recommendation by class key or disease label.
 * Returns structured recommendation object or null for non-disease statuses.
 */
function getDiseaseRecommendation(status, classKey, diseaseLabel) {
    // Never show treatment for uncertain, poor_quality, not_a_leaf, invalid_image, or missing disease
    if (!['ok', 'possible'].includes(status) || (!classKey && !diseaseLabel)) {
        return null;
    }

    // 1. Exact match by raw class key
    let entry = null;
    if (classKey && diseaseKnowledge[classKey]) {
        entry = diseaseKnowledge[classKey];
    }

    // 2. Resilient normalized match (strips underscores, hyphens, spaces, casing)
    if (!entry) {
        const target = (classKey || diseaseLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (target && normalizedKnowledgeMap[target]) {
            entry = normalizedKnowledgeMap[target];
        }
    }

    // 3. Match found in curated knowledge base
    if (entry) {
        return {
            ...entry,
            safety_notice: SAFETY_NOTICE,
            source: "curated"
        };
    }

    // 4. Class not found in knowledge base -> generic fallback recommendation
    return {
        message: "We don't have detailed guidance for this yet. Please consult your local Krishi Vigyan Kendra or agriculture officer.",
        safety_notice: SAFETY_NOTICE,
        source: "fallback"
    };
}

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

        // Automatic crop detection via OpenRouter Vision if Auto-Detect or not provided
        let expectedCrop = req.body.expected_crop || "Auto-Detect";
        if (expectedCrop === "Auto-Detect" && process.env.OPENROUTER_API_KEY) {
            try {
                console.log("[ML] Automatically detecting crop using OpenRouter Vision...");
                const prompt = "Identify the main crop plant or leaf in this image. Reply ONLY with the single crop name from this list: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato. If it doesn't clearly match any of these, reply 'Auto-Detect'.";
                
                const payload = {
                    model: "openrouter/free", // Automatically routes to the best available free vision model
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` } }
                            ]
                        }
                    ],
                    max_tokens: 50
                };
                
                const result = await axios.post("https://openrouter.ai/api/v1/chat/completions", payload, {
                    headers: { 
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://farmguide.com",
                        "X-Title": "FarmGuide Hackathon"
                    }
                });
                
                const detectedText = result.data.choices[0].message.content.trim();
                const validCrops = ["Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange", "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash", "Strawberry", "Tomato"];
                
                if (validCrops.some(c => detectedText.toLowerCase().includes(c.toLowerCase()))) {
                    expectedCrop = validCrops.find(c => detectedText.toLowerCase().includes(c.toLowerCase()));
                    console.log(`[ML] OpenRouter automatically identified crop: ${expectedCrop}`);
                }
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                console.error("[ML] OpenRouter auto-detect failed:", errorDetails);
            }
        }

        // Prepare Form Data for Python Microservice
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });
        if (req.body.is_multi_leaf) {
            form.append('is_multi_leaf', req.body.is_multi_leaf);
        }
        if (expectedCrop && expectedCrop !== "Auto-Detect") {
            form.append('expected_crop', expectedCrop);
        }

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
        const classKey = mlData.class_key || mlData.class_name || null;
        const guardStatus = mlData.status || 'ok';

        // Retrieve structured recommendation from curated knowledge base (no dynamic LLM call)
        const recommendation = getDiseaseRecommendation(guardStatus, classKey, detectedDisease);
        const suggestedAction = recommendation?.summary || mlData.treatment || null;

        // Forward all fields — old and new — to the client
        res.json({
            success: true,
            detectedDisease: detectedDisease,
            confidenceScore: mlData.confidence,
            suggestedAction: suggestedAction,
            heatmap: mlData.heatmap || null,
            // Guard fields (forwarded unchanged)
            status: guardStatus,
            guardMessage: mlData.message || null,
            reasons: mlData.reasons || [],
            topPredictions: mlData.top_predictions || [],
            quality: mlData.quality || {},
            confidenceMetrics: mlData.confidence_metrics || {},
            warnings: mlData.warnings || [],
            // Structured curated recommendation
            recommendation: recommendation,
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

        const riskProbability = Number(pythonApiRes.data.risk_probability ?? pythonApiRes.data.probability ?? 0);
        const pestName = pythonApiRes.data.pest || pythonApiRes.data.pest_name || '';
        let riskLevel = pythonApiRes.data.risk_level;
        if (!riskLevel) {
            riskLevel = riskProbability > 70 ? 'HIGH' : riskProbability > 40 ? 'MEDIUM' : 'LOW';
        }
        const riskWindow = pythonApiRes.data.risk_window || 'Next 5-7 days';
        const keyFactors = pythonApiRes.data.key_factors || ['Temperature', 'Humidity', 'Rainfall', 'Crop Type'];
        let actionPlan = pythonApiRes.data.recommendation || (pestName ? `Monitor crop closely for ${pestName} symptoms and take preventative measures.` : 'Monitor crop closely.');

        // Integrate OpenRouter Action Plan if probability is high enough
        if (riskProbability > 50 && process.env.OPENROUTER_API_KEY) {
            try {
                const prompt = `A predictive ML model has flagged a ${riskProbability.toFixed(1)}% probability of a general pest outbreak (Risk Level: ${riskLevel}${pestName ? `, Likely pest/disease: ${pestName}` : ''}) in a ${payload.Crop_Type} field located in ${payload.Location || 'India'}. Provide a highly concise, practical, and immediate preventative action plan for the farmer. Maximum 2 sentences. Format: "Action: [What to do]."`;
                
                const openRouterPayload = {
                    model: "openrouter/free",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 300
                };
                
                const result = await axios.post("https://openrouter.ai/api/v1/chat/completions", openRouterPayload, {
                    headers: { 
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://farmguide.com",
                        "X-Title": "FarmGuide Hackathon"
                    }
                });
                
                const responseText = result.data.choices[0].message.content.trim();
                if (responseText) {
                    actionPlan = responseText;
                }
            } catch (error) {
                const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                console.error("OpenRouter Pest Action Plan Error:", errorDetails);
            }
        }

        res.json({
            success: true,
            riskLevel: riskLevel,
            riskProbability: riskProbability,
            pestName: pestName,
            riskWindow: riskWindow,
            keyFactors: keyFactors,
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

const getDiseaseAdvisorOptions = async (req, res) => {
    try {
        const options = diseaseAdvisorService.getAdvisorOptions();
        res.json(options);
    } catch (error) {
        console.error("Disease Advisor Options Error:", error);
        res.status(500).json({ success: false, message: 'Failed to retrieve advisor options: ' + error.message });
    }
};

const getDiseaseAdvisory = async (req, res) => {
    try {
        const payload = {
            crop: req.body.crop || req.query.crop,
            district: req.body.district || req.query.district,
            latitude: parseFloat(req.body.latitude || req.query.latitude),
            longitude: parseFloat(req.body.longitude || req.query.longitude),
            temperature: req.body.temperature !== undefined ? parseFloat(req.body.temperature) : (req.query.temperature !== undefined ? parseFloat(req.query.temperature) : undefined),
            humidity: req.body.humidity !== undefined ? parseFloat(req.body.humidity) : (req.query.humidity !== undefined ? parseFloat(req.query.humidity) : undefined),
            rainfall: req.body.rainfall !== undefined ? parseFloat(req.body.rainfall) : (req.query.rainfall !== undefined ? parseFloat(req.query.rainfall) : undefined),
            isRaining: req.body.isRaining !== undefined ? req.body.isRaining : req.query.isRaining,
            month: parseInt(req.body.month || req.query.month, 10)
        };

        if (!payload.crop) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a crop name or alias (e.g., Tomato, Cotton, Tamatar, Kapus).'
            });
        }

        const advisory = diseaseAdvisorService.getAdvisory(payload);
        if (!advisory.success) {
            return res.status(404).json(advisory);
        }

        res.json(advisory);
    } catch (error) {
        console.error("Disease Advisory Error:", error);
        res.status(500).json({ success: false, message: 'Disease advisory evaluation failed: ' + error.message });
    }
};

module.exports = { 
    getCropRecommendation, 
    detectDisease, 
    predictPest, 
    predictYield, 
    searchSchemes, 
    predictRisk,
    getDiseaseAdvisorOptions,
    getDiseaseAdvisory
};
