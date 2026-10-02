import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Search, ExternalLink, Loader2, CheckCircle2, FileText, IndianRupee, Droplet, Tractor, Sprout, Filter } from 'lucide-react';
import axios from 'axios';

function Schemes() {
    const [schemes, setSchemes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllSchemes();
    }, []);

    const fetchAllSchemes = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5000/api/schemes');
            if (res.data.success) {
                setSchemes(res.data.schemes || []);
            } else {
                setError(res.data.message || 'Failed to load agricultural schemes.');
            }
        } catch (err) {
            setError('Could not connect to the schemes engine.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique states for filter tabs
    const availableStates = ['ALL', ...Array.from(new Set(schemes.map(s => s.state || 'All India')))];

    const filteredSchemes = schemes.filter(s => {
        const title = (s.name || s.scheme || '').toLowerCase();
        const stateName = (s.state || 'All India').toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesTerm = title.includes(term) || stateName.includes(term);

        const matchesState = selectedState === 'ALL' || 
            (s.state || 'All India').toLowerCase() === selectedState.toLowerCase();

        return matchesTerm && matchesState;
    });

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">
            <header className="mb-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 flex justify-center items-center gap-4"
                >
                    <Landmark className="text-emerald-400" size={48} />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        Agricultural Schemes & Subsidies
                    </span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 text-base max-w-2xl mx-auto"
                >
                    Explore all central and state government welfare programs, subsidies, and grants for farmers across India.
                </motion.p>
            </header>

            {/* Controls Bar: Search + State Selector */}
            <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search schemes by keyword or state..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 backdrop-blur-xl text-sm transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <Filter className="text-slate-400 hidden md:block" size={18} />
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="bg-slate-900/80 border border-slate-700/80 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium transition-all"
                    >
                        <option value="ALL">🌐 All States & Central ({schemes.length})</option>
                        {availableStates.filter(st => st !== 'ALL').map(st => (
                            <option key={st} value={st}>📍 {st}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* State Filter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-5xl mx-auto px-4">
                {availableStates.map(st => {
                    const isActive = selectedState === st;
                    const count = st === 'ALL' 
                        ? schemes.length 
                        : schemes.filter(s => (s.state || 'All India') === st).length;

                    return (
                        <button
                            key={st}
                            onClick={() => setSelectedState(st)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                                isActive 
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-950/30' 
                                    : 'bg-slate-900/50 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {st === 'ALL' ? 'All Schemes' : st} ({count})
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="glass-panel p-4 bg-rose-500/10 border-rose-500/30 mb-6 rounded-xl max-w-3xl mx-auto text-center">
                    <p className="text-rose-400">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={40} className="animate-spin text-emerald-400 mb-3" />
                    <p className="text-sm font-medium">Loading agricultural schemes for all states...</p>
                </div>
            ) : (
                <div className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                            {selectedState === 'ALL' ? 'All Government Schemes' : `${selectedState} Schemes`}
                            <span className="text-emerald-400 bg-emerald-400/10 px-3 py-0.5 rounded-full text-sm ml-3">
                                {filteredSchemes.length}
                            </span>
                        </h3>
                    </div>

                    {filteredSchemes.length === 0 && !error && (
                        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center rounded-3xl border border-slate-700/50 max-w-xl mx-auto">
                            <Landmark size={48} className="text-slate-500 mb-4" />
                            <p className="text-slate-300 text-lg">No schemes found matching criteria.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredSchemes.map((s, idx) => {
                                const title = s.name || s.scheme || 'Government Scheme';
                                const stateBadge = s.state || 'All India';
                                let Icon = Landmark;
                                let color = "text-purple-400";
                                let bg = "bg-purple-400/10";
                                
                                const tLower = title.toLowerCase();
                                if (tLower.includes('drop') || tLower.includes('irrigation') || tLower.includes('pond') || tLower.includes('sinchayee')) {
                                    Icon = Droplet; color = "text-blue-400"; bg = "bg-blue-400/10";
                                } else if (tLower.includes('mechanization') || tLower.includes('tractor') || tLower.includes('pump') || tLower.includes('yantra')) {
                                    Icon = Tractor; color = "text-amber-400"; bg = "bg-amber-400/10";
                                } else if (tLower.includes('horticulture') || tLower.includes('kisan') || tLower.includes('bima') || tLower.includes('krishak')) {
                                    Icon = Sprout; color = "text-emerald-400"; bg = "bg-emerald-400/10";
                                }

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={s._id || idx}
                                        className="glass-card flex flex-col group relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-300 shadow-xl"
                                    >
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4 gap-3">
                                                <div className={`p-3 rounded-2xl ${bg}`}>
                                                    <Icon className={color} size={26} />
                                                </div>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    📍 {stateBadge}
                                                </span>
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                                                {title}
                                            </h3>

                                            {s.benefit && (
                                                <div className="mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center gap-3">
                                                    <IndianRupee className="text-amber-400" size={18} />
                                                    <div>
                                                        <p className="text-[10px] uppercase text-slate-500 font-bold">Subsidy / Benefit</p>
                                                        <p className="text-xs text-slate-200 font-semibold">
                                                            {s.benefit.min ? `₹${s.benefit.min.toLocaleString('en-IN')} ${s.benefit.max !== s.benefit.min ? `- ₹${s.benefit.max.toLocaleString('en-IN')}` : ''}` : 'Government Financial Subsidy'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-3">
                                                {s.documents && s.documents.length > 0 && (
                                                    <div>
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                            <FileText size={13} className="text-blue-400" /> Required Documents
                                                        </h4>
                                                        <ul className="text-xs text-slate-300 space-y-1 ml-4 list-disc marker:text-blue-400/50">
                                                            {s.documents.map((d, i) => <li key={i}>{d}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto border-t border-slate-700/50 bg-slate-900/30 p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Department</p>
                                                    <p className="text-xs text-slate-300 line-clamp-1">{s.department || 'Agriculture Dept'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Source</p>
                                                    <p className="text-xs text-slate-300">{s.source_type || 'Government'}</p>
                                                </div>
                                            </div>

                                            {s.official_source_url && (
                                                <a 
                                                    href={s.official_source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold tracking-wide text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    View Official Details <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Schemes;
