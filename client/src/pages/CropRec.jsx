import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

function CropRec() {
    const [formData, setFormData] = useState({ N_level: '', P_level: '', K_level: '', pH_value: '', moisture: '', temperature: '', rainfall: '' });
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/ml/crop-recommendation', formData);
            // Simulate network delay for premium feel
            setTimeout(() => {
                setRecommendations(res.data.recommendedCrops);
                setLoading(false);
            }, 1200);
        } catch (err) {
            const errorMsg = err.response && err.response.data && err.response.data.message 
                ? err.response.data.message 
                : 'Error fetching recommendation';
            alert(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-12">
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 text-glow-strong"
                >
                    Crop Recommendation
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/70 text-lg font-medium tracking-wide"
                >
                    Input your soil context to receive AI-driven planting strategies.
                </motion.p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative items-start">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-8 md:p-10 relative overflow-hidden"
                >
                    {/* Subtle glow effect behind form */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -z-10" />

                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <Sparkles className="text-green-400" size={24} />
                        Soil Parameters
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10 w-full">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Nitrogen (N)</label>
                                <input name="N_level" type="number" onChange={handleChange} required className="input-field" placeholder="mg/kg" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Phosphorus (P)</label>
                                <input name="P_level" type="number" onChange={handleChange} required className="input-field" placeholder="mg/kg" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Potassium (K)</label>
                                <input name="K_level" type="number" onChange={handleChange} required className="input-field" placeholder="mg/kg" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">pH Level</label>
                                <input name="pH_value" type="number" step="0.1" onChange={handleChange} required className="input-field" placeholder="0 - 14" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Temperature</label>
                                <input name="temperature" type="number" step="0.1" onChange={handleChange} required className="input-field" placeholder="°C" />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Rainfall</label>
                                <input name="rainfall" type="number" step="0.1" onChange={handleChange} required className="input-field" placeholder="mm" />
                            </div>
                            <div className="relative col-span-2">
                                <label className="block text-xs font-bold text-green-400 uppercase tracking-widest mb-2 opacity-90">Humidity</label>
                                <input name="moisture" type="number" step="0.1" onChange={handleChange} required className="input-field" placeholder="%" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || recommendations !== null} className="w-full btn-primary text-lg mt-10 flex justify-center items-center py-4">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Analyze Terrain'}
                        </button>
                        <p className="text-center text-xs font-medium text-white/40 mt-6 tracking-wide uppercase">Calculations powered by Deep Learning Classification Models</p>
                    </form>
                </motion.div>

                <AnimatePresence>
                    {recommendations && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="glass-panel p-8 md:p-10 border border-green-500/30 shadow-[0_0_40px_rgba(76,175,80,0.2)]"
                        >
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-full p-2 border-4 border-green-500/20 shadow-[0_0_15px_rgba(76,175,80,0.4)]">
                                    <CheckCircle2 size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white text-glow">Top Matches</h3>
                            </div>

                            <div className="space-y-5 relative">
                                {/* Connecting line */}
                                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-400/40 to-transparent" />

                                {recommendations.map((rec, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        key={idx}
                                        className="relative pl-12"
                                    >
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-400 shadow-[0_0_15px_rgba(76,175,80,0.8)] border-2 border-[#1E293B]" />
                                        
                                        <div className="glass-card p-5 flex justify-between items-center group hover:bg-white/5 transition-all">
                                            <span className="text-xl font-bold text-white tracking-wide capitalize">{rec.name || rec}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-green-400 drop-shadow-[0_0_8px_rgba(76,175,80,0.5)]">{rec.match || 98}% Match</span>
                                                <div className="w-28 h-2 rounded-full mt-2 overflow-hidden inset-shadow">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${rec.match || 98}%` }}
                                                        transition={{ duration: 1, delay: 0.2 + (idx * 0.1), ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={() => setRecommendations(null)}
                                className="w-full mt-10 py-4 font-bold text-green-400 hover:text-green-300 transition-all bg-green-500/10 rounded-xl border border-green-500/20 hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(76,175,80,0.2)] text-lg"
                            >
                                Start New Analysis
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CropRec;
