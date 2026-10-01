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

        let errorMsg = "AI server currently out of credits. Please try tomorrow.";
        if (lastError?.message.includes('429')) errorMsg = "Daily AI limit reached.";
        res.status(500).json({ success: false, message: errorMsg });

    } catch (error) {
        res.status(500).json({ success: false, message: "AI Assistant offline." });
    }
};

module.exports = { handleChat };
