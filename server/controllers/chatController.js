const { GoogleGenerativeAI } = require('@google/generative-ai');

const handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'Gemini API Key missing.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelNames = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];
        let lastError = null;

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "You are the AI assistant for FarmGuide. Provide concise, actionable agronomical advice."
                });

                const formattedHistory = (history || []).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));

                const chat = model.startChat({ 
                    history: formattedHistory,
                    generationConfig: { maxOutputTokens: 500, temperature: 0.5 }
                });

                const result = await chat.sendMessage(message);
                return res.json({ success: true, response: result.response.text() });
            } catch (e) {
                lastError = e;
                if (e.message.includes('429') || e.message.includes('quota') || e.message.includes('404')) continue;
                break;
            }
        }

        // --- DEMO MOCK MODE FALLBACK ---
        // If all Gemini models fail (e.g., rate limit hit during Hackathon demo), gracefully respond!
        const lowerMsg = message.toLowerCase();
        let mockResponse = "🚜 **Demo Mode Active:** The AI server has reached its quota, but FarmGuide is still here for you! Use our main tools (Weather, Market Prices, Disease Scan) for detailed analytics.";
        
        if (lowerMsg.includes('soybean') || lowerMsg.includes('wheat') || lowerMsg.includes('crop') || lowerMsg.includes('फसल')) {
            mockResponse = "🚜 **Demo Mode Active:** For most crops, maintaining proper soil moisture and rotating crops each season is key to high yields. Check our **Crop Recommendation** tool for specifics!";
        } else if (lowerMsg.includes('weather') || lowerMsg.includes('rain') || lowerMsg.includes('मौसम')) {
            mockResponse = "🚜 **Demo Mode Active:** Weather is crucial! Please navigate to our **Weather Forecast** page to see the latest 7-day precipitation data from Open-Meteo.";
        } else if (lowerMsg.includes('disease') || lowerMsg.includes('sick') || lowerMsg.includes('रोग')) {
            mockResponse = "🚜 **Demo Mode Active:** To identify plant diseases accurately, take a clear picture of the leaf and upload it to our **Disease Detection** scanner.";
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('नमस्ते')) {
            mockResponse = "🚜 **Demo Mode Active:** Hello there! I am your FarmGuide AI. Ask me about your crops, or tell me to navigate you to a specific tool!";
        } else if (lowerMsg.includes('price') || lowerMsg.includes('mandi') || lowerMsg.includes('भाव')) {
            mockResponse = "🚜 **Demo Mode Active:** Market rates change daily. Head over to our **Market Prices** section to see live Mandi rates across India.";
        }
        
        return res.json({ success: true, response: mockResponse });

    } catch (error) {
        // Only return 500 if the server itself completely crashes, not the API
        res.status(500).json({ success: false, message: "AI Assistant offline." });
    }
};

module.exports = { handleChat };
