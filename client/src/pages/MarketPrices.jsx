import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Tag, TrendingUp } from 'lucide-react';
import api from '../services/api';

function MarketPrices() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ cropName: '', stateName: '' });

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/market/prices', { params: filters });
            setTimeout(() => {
                setPrices(res.data.data);
                setLoading(false);
            }, 600);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    return (
        <div className="w-full max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                <div>
                    <motion.h2 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold tracking-tight text-white mb-3 text-glow-strong flex items-center gap-4"
                    >
                        <TrendingUp className="text-green-400 drop-shadow-[0_0_10px_rgba(76,175,80,0.8)]" size={36} />
                        Market Intelligence
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/70 text-lg tracking-wide"
                    >
                        Real-time commodity spot prices across regional agricultural markets.
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-4 glass-panel p-3 border-green-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={18} />
                        <input
                            type="text" name="cropName" placeholder="Commodity" value={filters.cropName} onChange={handleFilterChange}
                            className="input-field !pl-12 pr-5 py-3 w-full sm:w-48 text-white placeholder:text-white/80 bg-black/30 border border-white/20 focus:bg-black/50"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={18} />
                        <input
                            type="text" name="stateName" placeholder="State (e.g. Gujarat)" value={filters.stateName} onChange={handleFilterChange}
                            className="input-field !pl-12 pr-5 py-3 w-full sm:w-48 text-white placeholder:text-white/80 bg-black/30 border border-white/20 focus:bg-black/50"
                        />
                    </div>
                    <button onClick={fetchPrices} className="btn-primary w-full sm:w-auto py-3 px-8 shadow-[0_4px_15px_rgba(76,175,80,0.3)] text-sm font-bold tracking-wide">
                        Query Market
                    </button>
                </motion.div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-80">
                    <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin drop-shadow-[0_0_15px_rgba(76,175,80,0.5)]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {prices.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            key={item._id || idx}
                            className="glass-card p-8 group hover:-translate-y-2 transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] group-hover:bg-green-500/10 transition-colors pointer-events-none" />
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2 group-hover:text-green-300 transition-colors">
                                        <Tag className="text-green-400" size={22} />
                                        {item.cropName}
                                    </h3>
                                    <p className="text-sm text-white/60 flex items-center mt-2 font-medium">
                                        <MapPin className="mr-1.5 text-green-500/70" size={16} /> {item.marketName}, {item.districtName}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold tracking-wider text-green-300 px-4 py-1.5 rounded-full border border-green-500/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                    {new Date(item.recordedDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6 relative z-10">
                                <div className="text-center rounded-xl p-3 border border-white/5">
                                    <span className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Low</span>
                                    <span className="font-semibold text-white/80">₹{item.minPrice}<span className="text-[10px] text-white/40 ml-0.5">/qtl</span></span>
                                </div>
                                <div className="glass-card text-center transform scale-[1.15] bg-gradient-to-b from-green-500/10 to-transparent rounded-xl p-3 border border-green-500/20 shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-10">
                                    <span className="block text-[10px] text-green-400 uppercase tracking-widest font-black mb-1">Modal</span>
                                    <span className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(76,175,80,0.5)]">₹{item.modalPrice}<span className="text-xs font-medium text-green-400/70 ml-0.5">/qtl</span></span>
                                </div>
                                <div className="text-center rounded-xl p-3 border border-white/5">
                                    <span className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">High</span>
                                    <span className="font-semibold text-white/80">₹{item.maxPrice}<span className="text-[10px] text-white/40 ml-0.5">/qtl</span></span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {prices.length === 0 && (
                        <div className="glass-panel col-span-full h-64 flex flex-col items-center justify-center text-white/50 rounded-3xl border-2 border-dashed border-white/10">
                            <TrendingUp size={48} className="text-white/20 mb-4" />
                            <p className="font-medium text-lg tracking-wide">No aggregate data found for the specified query.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MarketPrices;
