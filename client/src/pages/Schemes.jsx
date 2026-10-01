import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, MapPin, Search, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';

function Schemes() {
    const [searchParams, setSearchParams] = useState({
        state: 'All India',
        land_size: '',
        gender: 'Male',
        caste: 'General'
    });
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const states = [
        "All India", "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Gujarat", 
        "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", 
        "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
    ];

    const fetchSchemes = async (params) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://127.0.0.1:8000/schemes/search', params);

            if (res.data.success) {
                setSchemes(res.data.data);
            } else {
                setError(res.data.message || 'Failed to load agricultural schemes.');
            }
        } catch (err) {
            setError('Could not connect to the Government Schemes database server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes(searchParams);
    }, []);

    const handleChange = (e) => {
        setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSchemes(searchParams);
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-10">
            <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="flex-1">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3"
                    >
                        <Landmark className="text-purple-400" size={36} />
                        Government Subsidies & Schemes
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mb-6"
                    >
                        Enter your farming profile below. Our AI matching engine will rank and identify the exact government grants and subsidies you are eligible for.
                    </motion.p>
                    
                    <motion.form 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={handleSearch} 
                        className="glass-panel grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full p-4 rounded-2xl border border-slate-700/50"
                    >
                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Region</label>
                            <select 
                                name="state"
                                className="input-field text-sm appearance-none cursor-pointer border-slate-700"
                                value={searchParams.state}
                                onChange={handleChange}
                            >
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Land (Acres)</label>
                            <input 
                                type="number"
                                name="land_size"
                                placeholder="e.g. 2.5"
                                className="input-field text-sm border-slate-700"
                                value={searchParams.land_size}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Gender</label>
                            <select 
                                name="gender"
                                className="input-field text-sm appearance-none cursor-pointer border-slate-700"
                                value={searchParams.gender}
                                onChange={handleChange}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        
                        <div className="relative">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Category</label>
                            <select 
                                name="caste"
                                className="input-field text-sm appearance-none cursor-pointer border-slate-700"
                                value={searchParams.caste}
                                onChange={handleChange}
                            >
                                <option value="General">General/OBC</option>
                                <option value="SC/ST">SC / ST</option>
                            </select>
                        </div>

                        <div className="relative flex items-end">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-[42px] rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18}/> Match Me</>}
                            </button>
                        </div>
                    </motion.form>
                </div>
            </header>

            {error && (
                <div className="glass-panel p-6 bg-rose-500/10 border-rose-500/30 mb-8">
                    <p className="text-slate-300">{error}</p>
                </div>
            )}

            {!loading && schemes.length === 0 && !error && (
                <div className="glass-panel p-12 flex flex-col items-center justify-center text-center opacity-50">
                    <Landmark size={48} className="text-slate-500 mb-4" />
                    <p className="text-slate-300 text-lg">No agricultural schemes perfectly match this exact profile.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {schemes.map((scheme, idx) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            key={scheme.name + idx}
                            className="glass-card p-6 flex flex-col group hover:border-purple-500/40 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {scheme.level.includes('Central') ? 'Central Scheme' : 'State Scheme'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                                {scheme.name}
                            </h3>
                            
                            <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-4 leading-relaxed">
                                {scheme.details.replace(/<[^>]*>?/gm, '') || 'No rich description available.'}
                            </p>
                            
                            <a 
                                href={scheme.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full py-3 hover:bg-purple-600/20 border border-slate-700 hover:border-purple-500/50 rounded-lg text-purple-400 font-bold tracking-wide text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                Eligibility & Apply <ExternalLink size={14} />
                            </a>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Schemes;
