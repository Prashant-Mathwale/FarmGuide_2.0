import React, { useState, useEffect } from 'react';
import { Camera, Bot, TrendingUp, Cloud, X, ChevronRight, ChevronLeft, Users, Sprout, AlertTriangle, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const steps = [
    {
        title: "Welcome to FarmGuide! 🌾",
        description: "Your personal smart farming assistant. Would you like a quick tour of all the pages to see how the app can boost your harvest?",
        icon: null,
        isPrompt: true,
        path: '/dashboard'
    },
    {
        title: "Community Discussions 👥",
        description: "Welcome to Community! Here you can ask questions, share tips, and learn from other experienced farmers in your area.",
        icon: Users,
        path: '/community'
    },
    {
        title: "Crop Recommendation 🌱",
        description: "This is Crop Recs! Enter your soil test results (NPK), and the AI will suggest the most profitable crop to grow on your land.",
        icon: Sprout,
        path: '/crop-rec'
    },
    {
        title: "Scan Sick Plants 📸",
        description: "This is Disease Detect! Upload a photo of a sick leaf, and the AI will instantly identify the disease and how to treat it.",
        icon: Camera,
        path: '/disease-detect'
    },
    {
        title: "Pest Prediction 🐛",
        description: "This is Pest Predict! Check the likelihood of pest attacks based on current weather so you can take preventive action.",
        icon: AlertTriangle,
        path: '/pest-predict'
    },
    {
        title: "Check Live Prices 📈",
        description: "This is Market Prices! Check the live Mandi rates for your crops before you sell so you always get the best price.",
        icon: TrendingUp,
        path: '/market-prices'
    },
    {
        title: "Weather Forecast 🌦️",
        description: "This is the Weather page! Check the rain chance and daily temperature before deciding to spray your pesticides.",
        icon: Cloud,
        path: '/weather'
    },
    {
        title: "Government Schemes 🏛️",
        description: "This is Govt Schemes! Find the latest subsidies, loans, and financial help provided by the government for farmers.",
        icon: Landmark,
        path: '/schemes'
    },
    {
        title: "Talk to AI Assistant 🎙️",
        description: "Finally, no matter where you are, you can always click the floating green chat button, press the Mic icon, and ask questions out loud!",
        icon: Bot,
        path: '/dashboard'
    }
];

const WelcomeTour = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('farmguide_has_seen_tour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('farmguide_has_seen_tour', 'true');
        setIsOpen(false);
        navigate('/dashboard'); // Return to dashboard when done
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            const nextIdx = currentStep + 1;
            setCurrentStep(nextIdx);
            navigate(steps[nextIdx].path); // Physically navigate to the page!
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1;
            setCurrentStep(prevIdx);
            navigate(steps[prevIdx].path); // Physically navigate back
        }
    };

    if (!isOpen) return null;

    const current = steps[currentStep];
    const Icon = current.icon;

    // Calculate progress based on actual tour steps (excluding prompt)
    const totalTourSteps = steps.length - 1;
    const progressWidth = current.isPrompt 
        ? 0 
        : (currentStep / totalTourSteps) * 100;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[100] pointer-events-none flex justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="pointer-events-auto bg-[#0f2818]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 w-full sm:w-[360px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                    {/* Progress Bar (Hidden on Prompt) */}
                    {!current.isPrompt && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-black/20">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progressWidth}%` }}
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleClose}
                        className="absolute top-3 right-3 text-emerald-200/50 hover:text-white p-1 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-start gap-4 mb-4 mt-2">
                        {Icon ? (
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <Icon size={24} strokeWidth={2} />
                            </div>
                        ) : (
                            <div className="text-4xl shrink-0">🚜</div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-white mb-1.5 leading-tight">{current.title}</h2>
                            <p className="text-emerald-100/80 text-[13px] leading-relaxed">
                                {current.description}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        {current.isPrompt ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClose}
                                    className="px-3 py-2.5 rounded-xl font-bold text-xs text-emerald-300 hover:bg-white/5 transition-all flex-1"
                                >
                                    Skip tour
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex-1"
                                >
                                    Yes, show me!
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={prevStep}
                                    className="p-2 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-emerald-300"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="flex gap-1.5">
                                    {steps.map((step, idx) => {
                                        if (step.isPrompt) return null;
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === currentStep ? 'w-5 bg-emerald-400' : 'w-1.5 bg-emerald-500/30'
                                                }`}
                                            />
                                        )
                                    })}
                                </div>

                                <button
                                    onClick={nextStep}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                    {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default WelcomeTour;
