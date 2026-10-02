import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot, Loader2, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Chatbot() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I'm your FarmGuide AI Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechLang, setSpeechLang] = useState('hi-IN');
    const recognitionRef = useRef(null);
    const initialInputRef = useRef('');
    const inputRef = useRef('');
    const shouldListenRef = useRef(false);
    const silenceTimerRef = useRef(null);

    const stopSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    const startSilenceTimer = () => {
        stopSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
            shouldListenRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            
            // Auto-send when silence is detected!
            if (inputRef.current.trim().length > 0) {
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                formRef.current?.dispatchEvent(submitEvent);
            }
        }, 2500); // 2.5 seconds timeout (much faster)
    };

    useEffect(() => {
        inputRef.current = input;
    }, [input]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                startSilenceTimer(); // Reset the silence timeout
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setInput((initialInputRef.current + ' ' + currentTranscript).trim());
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                if (event.error !== 'no-speech') {
                    shouldListenRef.current = false;
                    setIsListening(false);
                    stopSilenceTimer();
                }
            };

            recognitionRef.current.onend = () => {
                if (shouldListenRef.current) {
                    initialInputRef.current = inputRef.current;
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        shouldListenRef.current = false;
                        setIsListening(false);
                        stopSilenceTimer();
                    }
                } else {
                    setIsListening(false);
                    stopSilenceTimer();
                }
            };
        }
    }, []);

    const toggleListening = (e) => {
        e.preventDefault();
        if (isListening) {
            shouldListenRef.current = false;
            recognitionRef.current?.stop();
            setIsListening(false);
            stopSilenceTimer();
        } else {
            if (recognitionRef.current) {
                shouldListenRef.current = true;
                initialInputRef.current = inputRef.current;
                recognitionRef.current.lang = speechLang;
                try {
                    recognitionRef.current.start();
                } catch(e) {}
                setIsListening(true);
                startSilenceTimer();
            } else {
                alert("Voice input is not supported in your browser.");
            }
        }
    };

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const checkIntentAndNavigate = (text) => {
        const lowerText = text.toLowerCase();
        const routes = [
            { keywords: ['market', 'price', 'mandi', 'bhav', 'rate', 'bhaav', 'मंडी', 'भाव', 'बाजार'], path: '/market-prices', name: 'Market Prices' },
            { keywords: ['disease', 'scan', 'detect', 'leaf', 'sick', 'रोग', 'plant', 'बीमारी'], path: '/disease-detect', name: 'Disease Detection' },
            { keywords: ['weather', 'rain', 'temperature', 'forecast', 'mausam', 'हवामान', 'मौसम', 'बारिश'], path: '/weather', name: 'Weather Forecast' },
            { keywords: ['scheme', 'yojana', 'subsidy', 'government', 'loan', 'योजना', 'स्कीम'], path: '/schemes', name: 'Government Schemes' },
            { keywords: ['crop', 'recommend', 'grow', 'soil', 'season', 'plant', 'फसल', 'खेती'], path: '/crop-rec', name: 'Crop Recommendation' },
            { keywords: ['community', 'discuss', 'ask', 'farmer', 'forum', 'help', 'चर्चा', 'किसान', 'मदद'], path: '/community', name: 'Community Discussions' },
            { keywords: ['pest', 'insect', 'risk', 'bug', 'कीट', 'कीड़ा'], path: '/pest-predict', name: 'Pest Prediction' }
        ];

        const navKeywords = ['check', 'go to', 'open', 'show', 'navigate', 'take', 'where', 'need', 'want', 'tell', 'see', 'give', 'दिखाओ', 'जाना', 'खोलें', 'देखना', 'बताओ', 'मुझे', 'पाहिजे', 'दाखवा'];
        const wantsNavigation = navKeywords.some(kw => lowerText.includes(kw));
        
        // If they use a navigation keyword OR their message is very short (e.g. just "weather"), try to route them.
        if (wantsNavigation || lowerText.split(' ').length <= 4) {
            for (const route of routes) {
                if (route.keywords.some(kw => lowerText.includes(kw))) {
                    return route;
                }
            }
        }
        return null;
    };

    const formRef = useRef(null);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        
        const currentInput = input || inputRef.current;
        if (!currentInput.trim()) return;

        const userMessage = currentInput.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(newMessages);

        // Smart Navigation Intent
        const intent = checkIntentAndNavigate(userMessage);
        if (intent) {
            setMessages([...newMessages, { role: 'model', text: `Taking you to the **${intent.name}** page right now...` }]);
            setTimeout(() => {
                setIsOpen(false);
                navigate(intent.path);
            }, 1500);
            return;
        }

        setLoading(true);

        try {
            // Send to backend
            const res = await api.post('/chat', {
                message: userMessage,
                // Gemini API requires history to start with a 'user' message, so skip the first 'model' greeting
                history: messages.slice(1)
            });

            if (res.data.success) {
                setMessages([...newMessages, { role: 'model', text: res.data.response }]);
            } else {
                setMessages([...newMessages, { role: 'model', text: res.data.message || "I'm having trouble thinking right now. Please try again." }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            const errMsg = error.response?.data?.message || "Communication error: The AI server is currently unreachable.";
            setMessages([...newMessages, { role: 'model', text: errMsg }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white z-50 flex items-center justify-center ${isOpen ? 'hidden' : 'block'}`}
            >
                <MessageSquare size={26} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="glass-panel fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px] h-[550px] max-h-[80vh] border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center space-x-2">
                                <Bot size={22} />
                                <h3 className="font-bold text-lg">FarmGuide AI</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex-shrink-0 rounded-full p-2 mx-2 ${msg.role === 'user' ? 'bg-emerald-500' : ''}`}>
                                            {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-emerald-400" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-none' : 'glass-card text-slate-200 rounded-tl-none border border-slate-600'}`}>
                                            <p className="text-sm leading-relaxed">
                                                {msg.text.replace(/\*\*/g, '').replace(/(^|\n)\s*\*\s+/g, '$1• ').replace(/###\s+/g, '')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex items-start max-w-[85%]">
                                        <div className="flex-shrink-0 rounded-full p-2 mx-2">
                                            <Bot size={16} className="text-emerald-400" />
                                        </div>
                                        <div className="glass-card p-3 rounded-2xl text-slate-200 rounded-tl-none border border-slate-600 flex items-center space-x-2">
                                            <Loader2 size={16} className="animate-spin text-emerald-400" />
                                            <span className="text-sm text-slate-400 italic">FarmGuide AI is typing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-700 bg-[#0f172a]">
                            <form ref={formRef} onSubmit={handleSend} className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 shrink-0">
                                    <select 
                                        value={speechLang} 
                                        onChange={(e) => setSpeechLang(e.target.value)}
                                        className="bg-slate-800 text-[10px] text-emerald-400 border border-slate-600 rounded px-1 py-1 outline-none cursor-pointer text-center"
                                        title="Voice Language"
                                    >
                                        <option value="en-IN">Eng</option>
                                        <option value="hi-IN">हिंदी</option>
                                        <option value="mr-IN">मराठी</option>
                                        <option value="te-IN">తెలుగు</option>
                                    </select>
                                </div>
                                <div className="relative flex-1 flex items-center">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about crops..."
                                        className="input-field w-full text-white rounded-xl py-3 pl-3 pr-10 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`absolute right-2 p-1.5 rounded-full transition-all ${
                                            isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-slate-400 hover:text-emerald-400'
                                        }`}
                                    >
                                        <Mic size={18} />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send size={20} className={loading && !input.trim() ? "opacity-50" : ""} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Chatbot;
