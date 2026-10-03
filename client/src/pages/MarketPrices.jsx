import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Tag, TrendingUp, Store } from 'lucide-react';
import api from '../services/api';
import { addRecentActivity } from '../utils/activityTracker';

function MarketPrices() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ cropName: '', stateName: '', marketName: '' });
    const [errorMessage, setErrorMessage] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    
    // Autocomplete data
    const [statesList, setStatesList] = useState([]);
    const [commoditiesList, setCommoditiesList] = useState([]);
    const [marketsList, setMarketsList] = useState([]);

    const fetchPrices = async (overrideFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (overrideFilters.stateName) queryParams.append('state', overrideFilters.stateName);
            if (overrideFilters.cropName) queryParams.append('commodity', overrideFilters.cropName);
            if (overrideFilters.marketName) queryParams.append('market', overrideFilters.marketName);
            
            // Mandi API requires at least state or commodity. Fallback to user's state or Maharashtra
            if (!overrideFilters.stateName && !overrideFilters.cropName) {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                queryParams.append('state', userInfo?.state || 'Maharashtra');
            }

            // Step 1: Fetch without date to get the latest available date from API meta
            const metaRes = await fetch(`https://mandi-api.onrender.com/v1/prices?${queryParams.toString()}`);
            const metaJson = await metaRes.json();
            
            // Extract the latest date the API has data for
            const latestDate = metaJson?.meta?.latest_fetched_at
                ? metaJson.meta.latest_fetched_at.split('T')[0]
                : metaJson?.data?.[0]?.arrival_date || null;

            // Step 2: If we have a specific date, re-fetch with it for consistent results
            let json = metaJson;
            if (latestDate) {
                const res = await fetch(`https://mandi-api.onrender.com/v1/prices?${queryParams.toString()}&date=${latestDate}`);
                json = await res.json();
            }
            
            if (json.success && json.data) {
                const mappedData = json.data.map(item => ({
                    _id: item.id,
                    cropName: item.commodity,
                    marketName: item.market,
                    districtName: item.district,
                    recordedDate: item.arrival_date || item.fetched_at,
                    minPrice: item.min_price,
                    maxPrice: item.max_price,
                    modalPrice: item.modal_price
                }));
                setPrices(mappedData);
                setErrorMessage('');
                // Show the actual data date in the footer
                if (latestDate) setLastUpdated(`Data from ${latestDate}`);

                // Cache for dashboard MarketPricesCard
                try {
                    localStorage.setItem('farmguide_latest_market_prices', JSON.stringify({
                        timestamp: Date.now(),
                        latestDate: latestDate || 'Today',
                        items: mappedData
                    }));
                    window.dispatchEvent(new Event('farmguide_market_prices_updated'));
                } catch (e) {
                    // Ignore localStorage quotas
                }

                const topCrop = mappedData[0];
                const subtitleText = overrideFilters.cropName
                    ? `Checked ${overrideFilters.cropName} (₹${topCrop?.modalPrice || '—'}/Qtl)`
                    : `Checked ${topCrop?.cropName || 'commodities'} (₹${topCrop?.modalPrice || '—'}/Qtl)`;

                addRecentActivity({
                    type: 'market',
                    title: 'Market Prices',
                    subtitle: subtitleText,
                    to: '/market-prices'
                });
            } else {
                setPrices([]);
                setErrorMessage(json.error?.message || 'No aggregate data found for the specified query.');
            }
        } catch (err) {
            console.error(err);
            setPrices([]);
            setErrorMessage('Failed to fetch market prices. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
        
        // Fetch autocomplete data
        const fetchAutocompleteData = async () => {
            try {
                const [statesRes, commRes] = await Promise.all([
                    fetch('https://mandi-api.onrender.com/v1/states').then(r => r.json()),
                    fetch('https://mandi-api.onrender.com/v1/commodities').then(r => r.json())
                ]);
                if (statesRes.success && statesRes.data) setStatesList(statesRes.data);
                if (commRes.success && commRes.data) setCommoditiesList(commRes.data);
            } catch (err) {
                console.error("Failed to fetch autocomplete data", err);
            }
        };
        fetchAutocompleteData();
    }, []);

    // Fetch markets when state changes
    useEffect(() => {
        if (!filters.stateName) {
            setMarketsList([]);
            return;
        }
        const fetchMarkets = async () => {
            try {
                const res = await fetch(`https://mandi-api.onrender.com/v1/markets?state=${encodeURIComponent(filters.stateName)}`);
                const json = await res.json();
                if (json.success && json.data) {
                    setMarketsList(json.data.map(m => m.market));
                }
            } catch (err) {
                console.error("Failed to fetch markets", err);
            }
        };
        
        // Debounce slightly to avoid fetching on every keystroke immediately
        const timer = setTimeout(() => {
            fetchMarkets();
        }, 300);
        
        return () => clearTimeout(timer);
    }, [filters.stateName]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    const [locating, setLocating] = useState(false);

    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setErrorMessage('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        setErrorMessage('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const geo = await res.json();
                    const addr = geo.address || {};
                    const state = addr.state || '';
                    // Prioritize nearest city/town over administrative divisions
                    const district = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || addr.state_district || '';
                    if (state || district) {
                        const newFilters = {
                            ...filters,
                            stateName: state || filters.stateName,
                            marketName: district || filters.marketName,
                        };
                        setFilters(newFilters);
                        fetchPrices(newFilters);
                    } else {
                        setErrorMessage('Could not determine your state from GPS. Please enter manually.');
                    }
                } catch (err) {
                    setErrorMessage('Failed to reverse geocode your location.');
                } finally {
                    setLocating(false);
                }
            },
            () => {
                setLocating(false);
                setErrorMessage('Location access denied. Please allow location permission and try again.');
            },
            { timeout: 8000 }
        );
    };

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
                        Latest available wholesale spot prices across regional agricultural markets.
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
                            list="commodities-list"
                            className="input-field !pl-12 pr-5 py-3 w-full sm:w-48 text-white placeholder:text-white/80 bg-black/30 border border-white/20 focus:bg-black/50"
                        />
                        <datalist id="commodities-list">
                            {commoditiesList.map((item, idx) => <option key={idx} value={item} />)}
                        </datalist>
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={18} />
                        <input
                            type="text" name="stateName" placeholder="State (e.g. Gujarat)" value={filters.stateName} onChange={handleFilterChange}
                            list="states-list"
                            className="input-field !pl-12 pr-5 py-3 w-full sm:w-40 text-white placeholder:text-white/80 bg-black/30 border border-white/20 focus:bg-black/50"
                        />
                        <datalist id="states-list">
                            {statesList.map((item, idx) => <option key={idx} value={item} />)}
                        </datalist>
                    </div>
                    <div className="relative">
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={18} />
                        <input
                            type="text" name="marketName" placeholder="Mandi (e.g. Surat)" value={filters.marketName} onChange={handleFilterChange}
                            list="markets-list"
                            className="input-field !pl-12 pr-5 py-3 w-full sm:w-40 text-white placeholder:text-white/80 bg-black/30 border border-white/20 focus:bg-black/50"
                        />
                        <datalist id="markets-list">
                            {marketsList.map((item, idx) => <option key={idx} value={item} />)}
                        </datalist>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => fetchPrices(filters)} className="btn-primary flex-1 sm:flex-none py-3 px-8 shadow-[0_4px_15px_rgba(76,175,80,0.3)] text-sm font-bold tracking-wide">
                            Query Market
                        </button>
                        <button
                            onClick={handleUseCurrentLocation}
                            disabled={locating}
                            className="flex-1 sm:flex-none py-3 px-5 flex items-center justify-center gap-2 border border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm font-bold tracking-wide rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Use Current GPS Location"
                        >
                            {locating ? (
                                <><div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> Locating...</>
                            ) : (
                                <><MapPin size={18} /> Current Loc</>
                            )}
                        </button>
                    </div>
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
                            
                            <div className="mb-6 relative z-10">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2 group-hover:text-green-300 transition-colors">
                                    <Tag className="text-green-400" size={22} />
                                    {item.cropName}
                                </h3>
                                <p className="text-sm text-white/60 flex items-center mt-2 font-medium">
                                    <MapPin className="mr-1.5 text-green-500/70" size={16} /> {item.marketName}, {item.districtName}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-6 relative z-10">
                                <div className="flex-1 text-center rounded-xl p-2 border border-white/5">
                                    <span className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Low</span>
                                    <span className="text-sm font-semibold text-white/80 truncate block">₹{Number(item.minPrice).toLocaleString('en-IN')}<span className="text-[9px] text-white/40 ml-0.5">/qtl</span></span>
                                </div>
                                <div className="flex-[1.2] glass-card text-center bg-gradient-to-b from-green-500/10 to-transparent rounded-xl p-2.5 border border-green-500/20 shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-10 relative -mt-2">
                                    <span className="block text-[10px] text-green-400 uppercase tracking-widest font-black mb-1">Modal</span>
                                    <span className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(76,175,80,0.5)] truncate block">₹{Number(item.modalPrice).toLocaleString('en-IN')}<span className="text-[10px] font-medium text-green-400/70 ml-0.5">/qtl</span></span>
                                </div>
                                <div className="flex-1 text-center rounded-xl p-2 border border-white/5">
                                    <span className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">High</span>
                                    <span className="text-sm font-semibold text-white/80 truncate block">₹{Number(item.maxPrice).toLocaleString('en-IN')}<span className="text-[9px] text-white/40 ml-0.5">/qtl</span></span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {prices.length === 0 && (
                        <div className="glass-panel col-span-full h-64 flex flex-col items-center justify-center text-white/50 rounded-3xl border-2 border-dashed border-white/10 p-6 text-center">
                            <TrendingUp size={48} className="text-white/20 mb-4" />
                            <p className="font-medium text-lg tracking-wide">{errorMessage}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MarketPrices;
