import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Leaf, Droplets, Sprout, AlertCircle, ArrowRight, Check } from 'lucide-react';

const CROP_REQUIREMENTS = {
    "Rice": { N: 100, P: 50, K: 50 },
    "Wheat": { N: 120, P: 60, K: 40 },
    "Maize": { N: 130, P: 60, K: 50 },
    "Sugarcane": { N: 250, P: 100, K: 100 },
    "Cotton": { N: 120, P: 60, K: 60 },
    "Tomato": { N: 100, P: 60, K: 60 },
    "Potato": { N: 120, P: 80, K: 100 }
};

function Fertilizer() {
    const [formData, setFormData] = useState({
        crop: 'Wheat',
        soilN: '',
        soilP: '',
        soilK: ''
    });

    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCalculate = (e) => {
        e.preventDefault();

        const target = CROP_REQUIREMENTS[formData.crop] || { N: 100, P: 50, K: 50 };
        const currentN = parseFloat(formData.soilN) || 0;
        const currentP = parseFloat(formData.soilP) || 0;
        const currentK = parseFloat(formData.soilK) || 0;

        const defN = Math.max(0, target.N - currentN);
        const defP = Math.max(0, target.P - currentP);
        const defK = Math.max(0, target.K - currentK);

        let requiredDAP = defP / 0.46;
        let nitrogenSuppliedByDAP = requiredDAP * 0.18;
        let remainingNDeficit = Math.max(0, defN - nitrogenSuppliedByDAP);
        let requiredUrea = remainingNDeficit / 0.46;
        let requiredMOP = defK / 0.60;

        let warnings = [];
        if (currentN > target.N * 1.5) warnings.push("Excess Nitrogen detected. High risk of crop burning and foliage overgrowth.");
        if (currentP > target.P * 1.5) warnings.push("Excess Phosphorus detected. Risk of water pollution and zinc deficiency.");
        if (currentK > target.K * 1.5) warnings.push("Excess Potassium detected. Risk of magnesium and calcium lockout.");

        setResult({
            defN: defN.toFixed(1),
            defP: defP.toFixed(1),
            defK: defK.toFixed(1),
            urea: Math.ceil(requiredUrea),
            dap: Math.ceil(requiredDAP),
            mop: Math.ceil(requiredMOP),
            warnings: warnings
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-10">
            <header className="mb-10 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-gradient-to-br from-pink-500/30 to-fuchsia-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/30"
                >
                    <Activity size={32} className="text-pink-400" />
                </motion.div>
                <h2 className="text-4xl font-black tracking-tight text-white mb-2">Precision Nutrient Planner</h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Eliminate fertilizer waste. Input your active soil NPK telemetry and instantly receive exact chemical dosage requirements for your target crop.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 border-t-4 border-t-pink-500 relative overflow-hidden h-full">
                        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                            <Activity size={200} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
                            Soil Context
                        </h3>
                        
                        <form onSubmit={handleCalculate} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Target Crop</label>
                                <select 
                                    name="crop"
                                    className="input-field text-sm font-semibold text-white border-slate-700 cursor-pointer w-full p-4 rounded-xl"
                                    value={formData.crop}
                                    onChange={handleChange}
                                >
                                    {Object.keys(CROP_REQUIREMENTS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-2 uppercase tracking-wide">
                                        <Droplets size={14} /> Available Nitrogen (N)
                                    </label>
                                    <input type="number" name="soilN" placeholder="kg/ha in soil" required className="input-field shadow-inner w-full p-4 rounded-xl text-white border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all outline-none" value={formData.soilN} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 mb-2 uppercase tracking-wide">
                                        <Leaf size={14} /> Available Phosphorus (P)
                                    </label>
                                    <input type="number" name="soilP" placeholder="kg/ha in soil" required className="input-field shadow-inner w-full p-4 rounded-xl text-white border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none" value={formData.soilP} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2 uppercase tracking-wide">
                                        <Sprout size={14} /> Available Potassium (K)
                                    </label>
                                    <input type="number" name="soilK" placeholder="kg/ha in soil" required className="input-field shadow-inner w-full p-4 rounded-xl text-white border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none" value={formData.soilK} onChange={handleChange} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 mt-8 rounded-xl font-bold flex items-center justify-center transition-all bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(219,39,119,0.3)]"
                            >
                                Calculate Chemical Deficit <ArrowRight size={18} className="ml-2" />
                            </button>
                        </form>
                    </motion.div>
                </div>

                <div className="lg:col-span-7">
                    <AnimatePresence mode="wait">
                        {!result ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="w-24 h-24 bg-pink-900/20 rounded-full flex items-center justify-center mb-6 border border-pink-500/20 shadow-[0_0_30px_rgba(219,39,119,0.1)]">
                                    <Activity size={48} className="text-pink-500/40" />
                                </div>
                                <h3 className="text-xl font-medium text-slate-400">Awaiting Telemetry</h3>
                                <p className="text-slate-500 max-w-sm mt-2">Enter your active soil health values to generate a precise fertilizer report.</p>
                            </motion.div>
                        ) : (
                            <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 h-full flex flex-col">
                                {result.warnings.length > 0 && (
                                    <div className="glass-panel p-5 bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                        <h4 className="text-rose-400 font-bold mb-2 flex items-center gap-2"><AlertCircle size={18}/> Toxicity Warnings</h4>
                                        <ul className="list-disc list-inside text-sm text-rose-200/80 space-y-1">
                                            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div className="glass-panel p-8 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-1 flex flex-col relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                                    <h3 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">
                                        <Check className="text-emerald-400" /> Agronomic Prescription
                                    </h3>

                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className=" p-4 border border-slate-700 rounded-xl text-center shadow-inner">
                                            <p className="text-xs uppercase font-bold text-sky-400 mb-1">N-Deficit</p>
                                            <p className="text-2xl font-black text-white">{result.defN} <span className="text-sm font-medium text-slate-400">kg/ha</span></p>
                                        </div>
                                        <div className=" p-4 border border-slate-700 rounded-xl text-center shadow-inner">
                                            <p className="text-xs uppercase font-bold text-amber-500 mb-1">P-Deficit</p>
                                            <p className="text-2xl font-black text-white">{result.defP} <span className="text-sm font-medium text-slate-400">kg/ha</span></p>
                                        </div>
                                        <div className=" p-4 border border-slate-700 rounded-xl text-center shadow-inner">
                                            <p className="text-xs uppercase font-bold text-purple-400 mb-1">K-Deficit</p>
                                            <p className="text-2xl font-black text-white">{result.defK} <span className="text-sm font-medium text-slate-400">kg/ha</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="glass-panel p-5 bg-pink-900/20 border border-pink-500/30 flex justify-between items-center group hover:bg-pink-900/30 transition-all shadow-[0_0_15px_rgba(219,39,119,0.1)]">
                                            <div>
                                                <h4 className="text-xl font-black text-pink-400 tracking-wider flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></div> 
                                                    UREA 
                                                    <span className="text-xs text-pink-500/70 ml-2 font-bold">(46% Nitrogen)</span>
                                                </h4>
                                                <p className="text-sm font-medium text-white bg-pink-500/20 px-2 py-0.5 rounded mt-2 inline-block border border-pink-500/20">
                                                    Standard nitrogen supplier. Do not over-apply.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(219,39,119,0.5)]">
                                                    {result.urea} <span className="text-xl text-pink-500 font-bold uppercase">kg/ha</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="glass-panel p-5 bg-emerald-900/20 border border-emerald-500/30 flex justify-between items-center group hover:bg-emerald-900/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                            <div>
                                                <h4 className="text-xl font-black text-emerald-400 tracking-wider flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div> 
                                                    DAP 
                                                    <span className="text-xs text-emerald-500/70 ml-2 font-bold">(18% N, 46% P)</span>
                                                </h4>
                                                <p className="text-sm font-medium text-white bg-emerald-500/20 px-2 py-0.5 rounded mt-2 inline-block border border-emerald-500/20">
                                                    Di-ammonium Phosphate. Primary pre-plant source of P.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                                    {result.dap} <span className="text-xl text-emerald-500 font-bold uppercase">kg/ha</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="glass-panel p-5 bg-indigo-900/20 border border-indigo-500/30 flex justify-between items-center group hover:bg-indigo-900/30 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                            <div>
                                                <h4 className="text-xl font-black text-indigo-400 tracking-wider flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div> 
                                                    MOP 
                                                    <span className="text-xs text-indigo-500/70 ml-2 font-bold">(60% Potassium)</span>
                                                </h4>
                                                <p className="text-sm font-medium text-white bg-indigo-500/20 px-2 py-0.5 rounded mt-2 inline-block border border-indigo-500/20">
                                                    Muriate of Potash. Enhances stress and disease resistance.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                                    {result.mop} <span className="text-xl text-indigo-500 font-bold uppercase">kg/ha</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 py-3 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <Check size={18} />
                                        <p className="text-sm font-medium">Optimal chemical balance calculated for High-Yield {formData.crop}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default Fertilizer;
