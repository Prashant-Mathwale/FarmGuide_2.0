import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Search, ExternalLink, Loader2, CheckCircle2, FileText, IndianRupee, Droplet, Tractor, Sprout } from 'lucide-react';
import axios from 'axios';

function Schemes() {
    const [step, setStep] = useState(1);
    const [searchParams, setSearchParams] = useState({
        state: 'Maharashtra',
        district: '',
        land_acres: '',
        gender: 'MALE',
        category: 'GENERAL'
    });
    
    // Additional info
    const [additionalInfo, setAdditionalInfo] = useState({
        crop: '',
        irrigation: '',
        equipment: '',
        previous_subsidy: ''
    });

    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const states = [
        "Maharashtra", "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Gujarat", 
        "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Odisha", 
        "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
    ];

    const fetchSchemes = async (params) => {
        setLoading(true);
        setError('');
        try {
            // Using Node.js server endpoint
            const res = await axios.post('http://localhost:5000/api/schemes/match', params);
            if (res.data.success) {
                setSchemes(res.data.schemes || []);
                setStep(2); // Move to results/additional questions phase
            } else {
                setError(res.data.message || 'Failed to load agricultural schemes.');
            }
        } catch (err) {
            setError('Could not connect to the matching engine.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    };

    const handleAdditionalChange = (e) => {
        setAdditionalInfo({ ...additionalInfo, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSchemes(searchParams);
    };

    const handleRefineMatch = (e) => {
        e.preventDefault();
        fetchSchemes({ ...searchParams, ...additionalInfo });
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">
            <header className="mb-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 flex justify-center items-center gap-4"
                >
                    <Landmark className="text-emerald-400" size={48} />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Scheme Matcher
                    </span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 text-lg max-w-2xl mx-auto"
                >
                    Discover your eligibility for state and central agricultural subsidies.
                </motion.p>
            </header>

            {step === 1 && (
                <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSearch} 
                    className="glass-panel max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 p-6 rounded-3xl border border-slate-700/50 shadow-2xl bg-slate-900/50 backdrop-blur-xl"
                >
                    <div className="relative">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">State</label>
                        <select 
                            name="state"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                            value={searchParams.state}
                            onChange={handleChange}
                        >
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">District</label>
                        <input 
                            type="text"
                            name="district"
                            placeholder="e.g. Pune"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={searchParams.district}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Land (Acres)</label>
                        <input 
                            type="number"
                            name="land_acres"
                            placeholder="e.g. 2.5"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={searchParams.land_acres}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Gender</label>
                        <select 
                            name="gender"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                            value={searchParams.gender}
                            onChange={handleChange}
                        >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    
                    <div className="relative">
                        <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Category</label>
                        <select 
                            name="category"
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                            value={searchParams.category}
                            onChange={handleChange}
                        >
                            <option value="GENERAL">General/OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                        </select>
                    </div>

                    <div className="md:col-span-5 mt-4 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Search size={20}/> Match Me</>}
                        </button>
                    </div>
                </motion.form>
            )}

            {step === 2 && (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left sidebar for refining */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/4"
                    >
                        <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-4">Refine Profile</h3>
                            
                            <form onSubmit={handleRefineMatch} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">What crop do you grow?</label>
                                    <input 
                                        type="text" name="crop" placeholder="e.g. Onion"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={additionalInfo.crop} onChange={handleAdditionalChange}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Do you have irrigation?</label>
                                    <select 
                                        name="irrigation"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={additionalInfo.irrigation} onChange={handleAdditionalChange}
                                    >
                                        <option value="">Select...</option>
                                        <option value="DRIP">Drip</option>
                                        <option value="SPRINKLER">Sprinkler</option>
                                        <option value="NONE">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Own agricultural equipment?</label>
                                    <select 
                                        name="equipment"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={additionalInfo.equipment} onChange={handleAdditionalChange}
                                    >
                                        <option value="">Select...</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Received subsidy before?</label>
                                    <select 
                                        name="previous_subsidy"
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={additionalInfo.previous_subsidy} onChange={handleAdditionalChange}
                                    >
                                        <option value="">Select...</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                </div>
                                <button 
                                    type="submit" disabled={loading}
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg shadow-lg shadow-emerald-900/20 transition-colors flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Matches'}
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => setStep(1)}
                                    className="w-full mt-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm"
                                >
                                    Edit Basic Profile
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Results Area */}
                    <div className="flex-1">
                        {error && (
                            <div className="glass-panel p-4 bg-rose-500/10 border-rose-500/30 mb-6 rounded-xl">
                                <p className="text-rose-400">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Recommended Schemes <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-sm ml-2">{schemes.length}</span></h3>
                        </div>

                        {!loading && schemes.length === 0 && !error && (
                            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center rounded-3xl border border-slate-700/50">
                                <Landmark size={48} className="text-slate-500 mb-4" />
                                <p className="text-slate-300 text-lg">No agricultural schemes match this profile.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {schemes.map((r, idx) => {
                                    const title = r.scheme.toLowerCase();
                                    let Icon = Landmark;
                                    let color = "text-purple-400";
                                    let bg = "bg-purple-400/10";
                                    
                                    if (title.includes('drop') || title.includes('irrigation') || title.includes('pond')) {
                                        Icon = Droplet; color = "text-blue-400"; bg = "bg-blue-400/10";
                                    } else if (title.includes('mechanization')) {
                                        Icon = Tractor; color = "text-amber-400"; bg = "bg-amber-400/10";
                                    } else if (title.includes('horticulture') || title.includes('development')) {
                                        Icon = Sprout; color = "text-emerald-400"; bg = "bg-emerald-400/10";
                                    }

                                    return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="glass-card flex flex-col group relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm"
                                    >
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4 gap-4">
                                                <div className={`p-3 rounded-2xl ${bg}`}>
                                                    <Icon className={color} size={28} />
                                                </div>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    🟢 {(r.match || '').replace('_', ' ')}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-white mb-4 leading-snug">
                                                {r.scheme}
                                            </h3>

                                            {(r.details.benefit || (r.details.eligibility && r.details.eligibility.category)) && (
                                                <div className="mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                                                    <IndianRupee className="text-amber-400" size={20} />
                                                    <div>
                                                        <p className="text-[10px] uppercase text-slate-500 font-bold">Subsidy</p>
                                                        <p className="text-sm text-slate-200 font-medium">
                                                            {r.details.benefit && r.details.benefit.min ? `₹${r.details.benefit.min} - ₹${r.details.benefit.max}` : 'Based on component / category'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                                        <CheckCircle2 size={14} className="text-emerald-500" /> Why it matched
                                                    </h4>
                                                    <ul className="text-sm text-slate-300 space-y-1 ml-5 list-disc marker:text-emerald-500/50">
                                                        {r.matched.map((m, i) => <li key={i}>{m}</li>)}
                                                    </ul>
                                                </div>

                                                {(r.details.documents && r.details.documents.length > 0) && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                                            <FileText size={14} className="text-blue-400" /> Documents
                                                        </h4>
                                                        <ul className="text-sm text-slate-300 space-y-1 ml-5 list-disc marker:text-blue-400/50 line-clamp-3">
                                                            {r.details.documents.map((d, i) => <li key={i}>{d}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto border-t border-slate-700/50 bg-slate-900/30 p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Source</p>
                                                    <p className="text-xs text-slate-300">{r.details.source_type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Verified</p>
                                                    <p className="text-xs text-slate-300">
                                                        {new Date(r.details.last_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <a 
                                                href={r.details.official_source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold tracking-wide text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                                            >
                                                View Official Details <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Schemes;
