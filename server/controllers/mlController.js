const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const SoilData = require('../models/SoilData');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

module.exports = { getCropRecommendation, detectDisease, predictPest, predictYield };
