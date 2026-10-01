import { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, ThermometerSun, Sprout, Wind, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

function Irrigation() {
    const [formData, setFormData] = useState({
        cropType: '',
        cropDays: '',
        soilMoisture: '',
        temperature: '',
        humidity: ''
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await api.post('/ml/irrigation-predict', {
                cropType: formData.cropType,
                cropDays: parseInt(formData.cropDays),
                soilMoisture: parseFloat(formData.soilMoisture),
                temperature: parseFloat(formData.temperature),
                humidity: parseFloat(formData.humidity)
            });

            if (res.data.success) {
                setResult(res.data);
            } else {
                setError(res.data.message || 'Failed to analyze irrigation parameters.');
            }
        } catch (err) {
            setError('Could not connect to the ML intelligence server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-10">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3"
                >
                    <Droplets className="text-cyan-400" size={36} />
                    Smart Irrigation Planner
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/80 text-lg"
                >
                    AI-powered watering schedules based on hyper-local soil and weather telemetry.
                </motion.p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 glass-panel p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Crop Type */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Crop Type Tracker</label>
                                <div className="relative">
                                    <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                                    <input 
                                        type="text" 
                                        name="cropType"
                                        placeholder="e.g., Wheat"
                                        className="input-field !pl-12 text-sm"
                                        value={formData.cropType}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Crop Age */}
                            <div>
                                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Crop Age (Days)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                                    <input 
                                        type="number" 
                                        name="cropDays"
                                        placeholder="e.g., 45"
                                        className="input-field !pl-12 text-sm"
                                        value={formData.cropDays}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Soil Moisture */}
                            <div>
                                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Soil Moisture Index</label>
                                <div className="relative">
                                    <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                                    <input 
                                        type="number" 
                                        name="soilMoisture"
                                        placeholder="e.g., 350"
                                        className="input-field !pl-12 text-sm"
                                        value={formData.soilMoisture}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Temperature */}
                            <div>
                                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Temperature (°C)</label>
                                <div className="relative">
                                    <ThermometerSun className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                                    <input 
                                        type="number" 
                                        name="temperature"
                                        placeholder="e.g., 32"
                                        className="input-field !pl-12 text-sm"
                                        value={formData.temperature}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Humidity */}
                            <div>
                                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">Humidity (%)</label>
                                <div className="relative">
                                    <Wind className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} />
                                    <input 
                                        type="number" 
                                        name="humidity"
                                        placeholder="e.g., 65"
                                        className="input-field !pl-12 text-sm"
                                        value={formData.humidity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Droplets size={20} /> Evaluate Evapotranspiration
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Result Section */}
                <div className="lg:col-span-1">
                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 bg-rose-500/10 border-rose-500/30">
                            <h3 className="text-xl font-bold text-rose-400 mb-2">Error</h3>
                            <p className="text-slate-300">{error}</p>
                        </motion.div>
                    )}

                    {result && !error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className={`glass-panel p-8 h-full flex flex-col justify-center items-center text-center ${result.irrigation_needed ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}
                        >
                            {result.irrigation_needed ? (
                                <>
                                    <div className="w-24 h-24 mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <AlertTriangle className="text-cyan-400" size={48} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-3">ACTION REQUIRED</h2>
                                    <p className="text-lg text-cyan-200 mb-6 font-medium">Critical moisture depletion detected. Commence irrigation immediately.</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="text-emerald-400" size={48} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-3">SOIL OPTIMAL</h2>
                                    <p className="text-lg text-emerald-200 mb-6 font-medium">Sufficient hydration levels maintained. No watering required.</p>
                                </>
                            )}
                        </motion.div>
                    )}

                    {!result && !error && !loading && (
                        <div className="glass-panel p-8 h-full flex flex-col justify-center items-center text-center opacity-50">
                            <Droplets size={48} className="text-white/50 mb-4" />
                            <p className="text-white/60">Awaiting soil telemetry data to begin analysis.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Irrigation;
