const axios = require('axios');

const handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        const lowerMsg = message.toLowerCase();
        
        // --- INTERCEPT: LIVE MARKET PRICE FETCH ---
        if (lowerMsg.includes('price') || lowerMsg.includes('rate') || lowerMsg.includes('bhav')) {
            // Extract common crop names
            const commonCrops = ['tomato', 'potato', 'onion', 'wheat', 'rice', 'cotton', 'soybean', 'maize', 'apple', 'mango', 'banana'];
            let foundCrop = commonCrops.find(c => lowerMsg.includes(c));
            
            if (foundCrop) {
                try {
                    const priceRes = await axios.get(`https://mandi-api.onrender.com/v1/prices?commodity=${foundCrop}`);
                    if (priceRes.data && priceRes.data.data && priceRes.data.data.length > 0) {
                        const prices = priceRes.data.data.slice(0, 4).map(p => 
                            `**${p.state}** (${p.market}): ₹${p.modal_price} / quintal`
                        ).join('\n• ');
                        
                        const capCrop = foundCrop.charAt(0).toUpperCase() + foundCrop.slice(1);
                        return res.json({ 
                            success: true, 
                            response: `Here are the latest live Mandi prices for **${capCrop}**:\n\n• ${prices}\n\n*(Note: Prices are per 100kg/quintal. You can check the full list on the Market Prices page.)*` 
                        });
                    }
                } catch (e) {
                    console.error("Mandi API Error in Chat:", e.message);
                }
            }
        }

        
        // --- OpenRouter Integration ---
        if (process.env.OPENROUTER_API_KEY) {
            try {
                const formattedHistory = (history || []).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));
                
                formattedHistory.push({ role: 'user', content: message });
                
                const payload = {
                    model: "openrouter/free", // Automatically routes to the best available free model
                    messages: [
                        { role: 'user', content: "SYSTEM INSTRUCTION: You are the AI assistant for FarmGuide. Provide concise, actionable agronomical advice. Do not mention you are an AI." },
                        ...formattedHistory
                    ],
                    max_tokens: 500,
                    temperature: 0.5
                };
                
                const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", payload, {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://farmguide.com",
                        "X-Title": "FarmGuide Hackathon"
                    }
                });
                
                const finalResponse = response.data.choices[0].message.content || "I couldn't generate a response. Please try asking again in a different way.";
                return res.json({ success: true, response: finalResponse });
            } catch (e) {
                const errorDetails = e.response?.data ? JSON.stringify(e.response.data) : e.message;
                console.error("OpenRouter API Failed:", errorDetails);
                // Will fall through to Demo Mock Mode if OpenRouter also fails
            }
        }

        // --- DEMO MOCK MODE FALLBACK ---
        // If all API calls fail, gracefully respond!
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
