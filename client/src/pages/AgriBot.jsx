import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Sparkles, Loader2, Leaf } from 'lucide-react';
import api from '../services/api';

function AgriBot() {
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I am Agri-Bot, your dedicated 24/7 agricultural intelligence assistant. I can analyze soil data, diagnose pest symptoms, explain market trends, or help you maximize your crop yield. How can I help your farm today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatText = (text) => {
        return text.replace(/\*\*/g, '').replace(/\*/g, '•').split('\n').map((line, i) => (
            <span key={i} className="block mb-1">{line}</span>
        ));
    };

    const handleSend = async (e, customText = null) => {
        e?.preventDefault();
        const textToSubmit = customText || input;
        
        if (!textToSubmit.trim() || loading) return;

        const newMessages = [...messages, { role: 'user', text: textToSubmit }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat', { 
                message: textToSubmit,
                history: messages.slice(1).map(m => ({ role: m.role, text: m.text }))
            });

            if (res.data.success) {
                setMessages(prev => [...prev, { role: 'model', text: res.data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my knowledge base right now. Please try again later." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Communication error: The AI server is currently unreachable." }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "What are the best organic treatments for Tomato Late Blight?",
        "How much fertilizer should I use for 2 acres of Wheat?",
        "Explain the PM-Kisan subsidy eligibility in simple terms.",
        "What is the current market trend analysis for Cotton?"
    ];

    return (
        <div className="w-full h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
            
            {/* Main Chat Interface */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center gap-4 backdrop-blur-md">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(76,175,80,0.5)]">
                        <Bot size={28} className="text-white drop-shadow-md" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3 text-glow">
                            Agri-Bot Intelligence <Sparkles size={20} className="text-green-400 drop-shadow-[0_0_8px_rgba(76,175,80,0.8)]"/>
                        </h2>
                        <p className="text-[11px] text-green-300 font-bold tracking-widest uppercase mt-1">POWERED BY GOOGLE GEMINI 1.5 FLASH</p>
                    </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />
                    
                    {messages.map((msg, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-20`}
                        >
                            <div className={`max-w-[85%] rounded-3xl p-5 flex gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)] ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-tr-sm border border-green-500/30 inset-shadow' 
                                : ' backdrop-blur-lg border border-white/10 text-white/90 rounded-tl-sm'
                            }`}>
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-green-900/40 flex-shrink-0 flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(76,175,80,0.2)]">
                                        <Bot size={20} className="text-green-400" />
                                    </div>
                                )}
                                
                                <div className="text-[15.5px] leading-relaxed selection:bg-green-500/30 font-medium">
                                    {formatText(msg.text)}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20">
                                        <User size={20} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-20">
                            <div className=" backdrop-blur-lg border border-white/10 rounded-3xl p-5 rounded-tl-sm flex gap-4 items-center shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                                <div className="w-10 h-10 rounded-full bg-green-900/40 flex-shrink-0 flex items-center justify-center border border-green-500/30">
                                    <Loader2 size={20} className="text-green-400 animate-spin" />
                                </div>
                                <span className="text-green-400 text-sm font-bold tracking-wide animate-pulse">Analyzing agricultural data...</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-white/10 backdrop-blur-xl relative z-20">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about crops, diseases, markets, or soil..."
                            disabled={loading}
                            className="w-full bg-white/5 backdrop-blur-md text-white rounded-2xl py-4 flex pl-6 pr-20 border border-white/10 focus:outline-none focus:border-green-400 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(76,175,80,0.15)] transition-all placeholder:text-white/40 disabled:opacity-50 text-[15px]"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || loading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-white/10 disabled:to-white/5 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(76,175,80,0.4)] disabled:shadow-none border border-green-400/30 disabled:border-transparent group"
                        >
                            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Sidebar Details Pane */}
            <div className="hidden lg:flex w-80 flex-col gap-8">
                <div className="glass-panel p-8 border-white/10 flex-1 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
                    <div className="absolute top-0 right-[-20%] w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 text-glow">
                        <Sparkles className="text-green-400" size={24}/> Suggested Queries
                    </h3>
                    <div className="space-y-4 flex-1 relative z-10">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(null, s)}
                                disabled={loading}
                                className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-400/40 hover:shadow-[0_0_15px_rgba(76,175,80,0.15)] transition-all group"
                            >
                                <p className="text-sm text-white/70 group-hover:text-white font-medium leading-relaxed">{s}</p>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="glass-card p-6 border-green-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-3 mb-3">
                         <div className="bg-green-500/20 p-2 rounded-lg border border-green-500/30">
                            <Leaf className="text-green-400" size={20}/>
                         </div>
                         <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">Expert Guidance</h3>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                        Agri-Bot has active context concerning standard Indian agricultural standards, crop cycles, and the specific intelligence tools within your smart dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AgriBot;
