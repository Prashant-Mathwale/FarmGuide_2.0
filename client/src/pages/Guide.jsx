import React from 'react';
import { Camera, Bot, TrendingUp, Cloud, Sprout, Users, HelpCircle } from 'lucide-react';

const Guide = () => {
    const sections = [
        {
            title: "1. Disease Detection (Check Sick Plants)",
            icon: Camera,
            color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
            content: "If you see strange spots or yellowing on your crop's leaves, you can use your phone camera to check what disease it has.",
            steps: [
                "Tap on the Disease Detection card on your dashboard.",
                "Click the 'Upload Image' button.",
                "Take a clear photo of the sick leaf (or pick one from your gallery).",
                "The AI will tell you exactly what disease it is, and give you simple steps to fix it!"
            ]
        },
        {
            title: "2. FarmGuide AI Assistant (Voice Chatbot)",
            icon: Bot,
            color: "text-sky-400 bg-sky-500/20 border-sky-500/30",
            content: "Don't want to type? You can just talk to our smart AI assistant and ask it farming questions in your own language!",
            steps: [
                "Look for the floating Chat Icon (green message bubble) at the bottom right.",
                "To Type: Just type your question in the box.",
                "To Speak: Click the Microphone Icon and say your question out loud. The app will listen and answer you!"
            ]
        },
        {
            title: "3. Market Prices (Mandi Bhav)",
            icon: TrendingUp,
            color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
            content: "Before you sell your harvest, check the live Mandi rates to make sure you get the best price.",
            steps: [
                "Go to the Market Prices section.",
                "The app automatically knows your state and shows you today's prices.",
                "You can see the Price per Quintal (₹) and whether the price went up or down."
            ]
        },
        {
            title: "4. Weather Forecast (Mausam)",
            icon: Cloud,
            color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
            content: "Knowing when it will rain helps you plan when to spray pesticides or water the crops.",
            steps: [
                "Go to the Weather section on the dashboard.",
                "Look at the Rain Chance % to see if it will rain today.",
                "Check the Hourly strip at the bottom to see what the weather will be like later this afternoon!"
            ]
        },
        {
            title: "5. Crop Recommendation",
            icon: Sprout,
            color: "text-green-400 bg-green-500/20 border-green-500/30",
            content: "Not sure what to plant next season? The app can suggest the most profitable crop based on your soil.",
            steps: [
                "Click on Crop Recommendation.",
                "Enter your Nitrogen, Phosphorus, Potassium (NPK) levels if you have a soil test.",
                "The app will calculate the best crop (like Rice, Soybean, or Maize) for your land!"
            ]
        },
        {
            title: "6. Community Discussions",
            icon: Users,
            color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
            content: "Have a question? Ask other farmers or experts!",
            steps: [
                "Go to Community Discussions.",
                "You can read questions asked by other farmers.",
                "You can click on a post to see what treatments worked for them."
            ]
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 text-left">
            <div className="bg-[#0b2416]/75 backdrop-blur-md border border-[#1e4d30]/70 rounded-3xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8 border-b border-emerald-500/20 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                        <HelpCircle size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Farmer User Guide</h1>
                        <p className="text-emerald-200/70 text-sm md:text-base mt-1">
                            A simple manual to help you use FarmGuide 2.0
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {sections.map((sec, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${sec.color}`}>
                                    <sec.icon size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white">{sec.title}</h3>
                            </div>
                            <p className="text-sm text-emerald-100/90 mb-4">{sec.content}</p>
                            <div className="bg-black/20 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">How to use it:</h4>
                                <ol className="list-decimal list-inside space-y-2">
                                    {sec.steps.map((step, i) => (
                                        <li key={i} className="text-sm text-emerald-200/80 pl-1">
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-5">
                    <h3 className="text-emerald-400 font-bold mb-2">💡 Pro Tip:</h3>
                    <p className="text-sm text-emerald-100/90">
                        If you ever get lost, just open the <strong>AI Chatbot</strong> and say "Take me to Weather" or "Take me to Market Prices," and it will automatically open that page for you!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Guide;
