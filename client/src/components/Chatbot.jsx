import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../services/api';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hello! I'm your FarmGuide AI Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to UI immediately
        const newMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(newMessages);
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
                        className="glass-panel fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] border border-slate-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden"
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
                        <div className="p-3 border-t border-slate-700">
                            <form onSubmit={handleSend} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about crops, diseases..."
                                    className="input-field flex-1 text-white rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
