import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, CloudRain, Thermometer, Droplets, Search, MapPin, 
  Sparkles, Camera, AlertTriangle, CheckCircle2, Info, ArrowRight, 
  RefreshCw, Filter, ExternalLink, Leaf, ShieldCheck, Compass
} from 'lucide-react';
import api from '../services/api';
import { addRecentActivity } from '../utils/activityTracker';

export default function DiseaseAdvisor() {
    const navigate = useNavigate();
    const routerLocation = useLocation();

    // Data lists
    const [crops, setCrops] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [agroRegions, setAgroRegions] = useState([]);

    // Query State
    const [selectedCrop, setSelectedCrop] = useState('');
    const [cropSearch, setCropSearch] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('Pune');
    const [temperature, setTemperature] = useState(26);
    const [humidity, setHumidity] = useState(78);
    const [rainfall, setRainfall] = useState(0);
    const [isRaining, setIsRaining] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    // Results & UI State
    const [advisoryResult, setAdvisoryResult] = useState(null);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [weatherSyncing, setWeatherSyncing] = useState(false);
    const [weatherSyncMessage, setWeatherSyncMessage] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [filterRisk, setFilterRisk] = useState('all'); // 'all' | 'high' | 'model_supported'
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Current District Object
    const currentDistrictObj = useMemo(() => {
        return districts.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase()) || null;
    }, [districts, selectedDistrict]);

    // Popular Maharashtra crops for quick chips
    const popularCrops = ['Cotton', 'Soybean', 'Tomato', 'Grapes', 'Onion', 'Pomegranate', 'Sugarcane', 'Chilli'];

    // 1. Fetch options on mount
    useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            try {
                const res = await api.get('/ml/disease-advisor/options');
                if (!isMounted) return;
                if (res.data && res.data.crops) {
                    setCrops(res.data.crops);
                    setDistricts(res.data.districts);
                    setAgroRegions(res.data.agro_regions || []);

                    // Check if navigated with initial crop from scanner
                    if (routerLocation.state?.crop) {
                        setSelectedCrop(routerLocation.state.crop);
                        setCropSearch(routerLocation.state.crop);
                    } else if (res.data.crops.length > 0) {
                        setSelectedCrop(res.data.crops[0].name);
                        setCropSearch(res.data.crops[0].name);
                    }

                    // Default district from user profile or Pune
                    try {
                        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                        if (userInfo && userInfo.district) {
                            const found = res.data.districts.find(d => d.name.toLowerCase() === userInfo.district.toLowerCase());
                            if (found) setSelectedDistrict(found.name);
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.error('Failed to load advisor options:', err);
                if (isMounted) setErrorMsg('Unable to connect to advisory service. Please refresh.');
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        fetchOptions();
        return () => { isMounted = false; };
    }, [routerLocation.state]);

    // 2. Sync weather from Open-Meteo for selected district
    const syncLiveWeather = async (districtOverride, coordsOverride) => {
        setWeatherSyncing(true);
        setWeatherSyncMessage(null);
        try {
            let lat = coordsOverride?.latitude;
            let lon = coordsOverride?.longitude;

            if (!lat || !lon) {
                const distName = districtOverride || selectedDistrict;
                const dObj = districts.find(d => d.name.toLowerCase() === distName.toLowerCase());
                if (dObj) {
                    lat = dObj.latitude;
                    lon = dObj.longitude;
                }
            }

            if (!lat || !lon) {
                lat = 18.52; // Default Pune
                lon = 73.85;
            }

            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`
            );
            const data = await res.json();

            if (data.current) {
                const temp = Math.round(data.current.temperature_2m);
                const hum = Math.round(data.current.relative_humidity_2m);
                const precip = data.current.precipitation || 0;
                const code = data.current.weather_code || 0;
                const raining = precip > 0 || (code >= 51 && code <= 67) || (code >= 95 && code <= 99);

                setTemperature(temp);
                setHumidity(hum);
                setRainfall(precip);
                setIsRaining(raining);
                setWeatherSyncMessage(`Live weather synced: ${temp}°C, ${hum}% RH${raining ? ', Rain active' : ''}`);
            }
        } catch (err) {
            console.error('Live weather sync failed:', err);
            setWeatherSyncMessage('Weather sync unavailable. Using manual conditions.');
        } finally {
            setWeatherSyncing(false);
        }
    };

    // Auto-sync weather when districts load or district changes
    useEffect(() => {
        if (districts.length > 0 && selectedDistrict) {
            syncLiveWeather(selectedDistrict);
        }
    }, [selectedDistrict, districts]);

    // 3. Auto-detect user GPS location
    const handleUseGPS = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        setWeatherSyncing(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Find nearest Maharashtra district
                let nearest = null;
                let minDist = Infinity;
                districts.forEach(d => {
                    const dist = Math.hypot(d.latitude - latitude, d.longitude - longitude);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = d;
                    }
                });

                if (nearest) {
                    setSelectedDistrict(nearest.name);
                    await syncLiveWeather(nearest.name, { latitude, longitude });
                } else {
                    await syncLiveWeather(null, { latitude, longitude });
                }
            },
            (err) => {
                console.warn('GPS position error:', err);
                setWeatherSyncing(false);
                alert('Could not access your location. Please select your district from the dropdown.');
            }
        );
    };

    // 4. Run Disease Advisory
    const handleRunAdvisory = async () => {
        if (!selectedCrop) {
            setErrorMsg('Please select a crop to evaluate.');
            return;
        }

        setAnalyzing(true);
        setErrorMsg(null);

        try {
            const payload = {
                crop: selectedCrop,
                district: selectedDistrict,
                temperature: Number(temperature),
                humidity: Number(humidity),
                rainfall: Number(rainfall),
                isRaining: Boolean(isRaining),
                month: Number(month)
            };

            const res = await api.post('/ml/disease-advisor/advisory', payload);
            setAdvisoryResult(res.data);

            addRecentActivity({
                type: 'advisor',
                title: 'Disease Advisor',
                subtitle: `${selectedCrop} advisory for ${selectedDistrict} (${res.data.summary?.high_risk_count || 0} high watch)`,
                to: '/disease-advisor'
            });
        } catch (err) {
            console.error('Disease advisor request failed:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to generate advisory. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    // Auto-run initial advisory when crops and districts are ready
    useEffect(() => {
        if (crops.length > 0 && selectedCrop && !advisoryResult && !analyzing) {
            handleRunAdvisory();
        }
    }, [crops, selectedCrop]);

    // Crop search filtering (checks crop name & Marathi aliases)
    const filteredCropSuggestions = useMemo(() => {
        if (!cropSearch.trim()) return crops.slice(0, 10);
        const q = cropSearch.toLowerCase().trim();
        return crops.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(q);
            const aliasMatch = (c.aliases || []).some(a => a.toLowerCase().includes(q));
            return nameMatch || aliasMatch;
        }).slice(0, 8);
    }, [crops, cropSearch]);

    // Filtered diseases to watch
    const displayedDiseases = useMemo(() => {
        if (!advisoryResult || !advisoryResult.diseases_to_watch) return [];
        let list = advisoryResult.diseases_to_watch;

        if (filterRisk === 'high') {
            list = list.filter(d => d.advisory_level === 'High');
        } else if (filterRisk === 'model_supported') {
            list = list.filter(d => d.model_supported === true);
        }
        return list;
    }, [advisoryResult, filterRisk]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="min-h-screen text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Header Hero Section */}
            <motion.div 
                initial={{ opacity: 0, y: -12 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2417] via-[#091a11] to-[#05110a] border border-emerald-500/20 p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.5)]"
            >
                <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2.5 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                            <ShieldAlert size={14} className="text-emerald-400" />
                            <span>Maharashtra Regional Knowledge Base</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                            Preventive Disease Advisor & Early Warning
                        </h1>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            Weather-driven regional risk modeling calibrated for Maharashtra's 6 agro-climatic zones. Grounded against university research by <span className="text-emerald-300 font-semibold">Dr. PDKV Akola, MPKV Rahuri, VNMKV Parbhani</span>, and <span className="text-emerald-300 font-semibold">ICAR</span>.
                        </p>
                    </div>

                    <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                            <Compass size={15} className="text-emerald-400" />
                            <span><strong>36</strong> Districts & <strong>6</strong> Agro-Zones</span>
                        </div>
                        <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                            <Leaf size={15} className="text-emerald-400" />
                            <span><strong>36</strong> Crops & <strong>530</strong> Curated Rules</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle size={18} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                    <button onClick={() => setErrorMsg(null)} className="text-xs underline hover:text-white">Dismiss</button>
                </div>
            )}

            {/* Control Panel (2 Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Crop & District Selection */}
                <div className="lg:col-span-6 bg-[#0b1b13]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <Leaf size={18} className="text-emerald-400" />
                            <span>1. Crop & Agro-Region</span>
                        </h2>
                        {currentDistrictObj && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-medium">
                                {currentDistrictObj.agro_region}
                            </span>
                        )}
                    </div>

                    {/* Crop Search / Selector */}
                    <div className="space-y-2 relative">
                        <label className="text-sm font-bold text-slate-300 block">
                            Search Crop
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={cropSearch}
                                onChange={(e) => {
                                    setCropSearch(e.target.value);
                                    setIsSearchFocused(true);
                                }}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Search e.g. Cotton, Tamatar, Kapus, Soyabean..."
                                className="w-full px-4 py-3 pl-10 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm transition-all"
                            />
                            <Search size={17} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {isSearchFocused && filteredCropSuggestions.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-[#0f281b] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                                >
                                    {filteredCropSuggestions.map(c => (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCrop(c.name);
                                                setCropSearch(c.name);
                                                setIsSearchFocused(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-emerald-500/20 transition-colors ${
                                                selectedCrop.toLowerCase() === c.name.toLowerCase() ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{c.name}</span>
                                                {c.category && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-400">
                                                        {c.category}
                                                    </span>
                                                )}
                                            </div>
                                            {c.aliases && c.aliases.length > 0 && (
                                                <span className="text-[11px] text-emerald-400/80 italic">
                                                    {c.aliases.slice(0, 2).join(', ')}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Quick Crop Chips */}
                    <div className="space-y-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Popular Maharashtra Crops:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {popularCrops.map(name => {
                                const isSelected = selectedCrop.toLowerCase() === name.toLowerCase();
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCrop(name);
                                            setCropSearch(name);
                                            setIsSearchFocused(false);
                                        }}
                                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                            isSelected 
                                                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
                                                : 'bg-white/[0.05] hover:bg-white/10 text-slate-300 border border-white/5'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* District Dropdown & GPS */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <label className="text-sm font-bold text-slate-300 block">
                            Select District
                        </label>
                        <button
                            type="button"
                            onClick={handleUseGPS}
                            className="w-full py-3 mb-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        >
                            <MapPin size={18} />
                            <span>Auto-detect via GPS</span>
                        </button>

                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            {districts.map(d => (
                                <option key={d.name} value={d.name} className="bg-[#0b1710] text-white">
                                    {d.name} ({d.agro_region})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month / Season Selector */}
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-sm font-bold text-slate-300 block">
                            Current Month
                        </label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                            {monthNames.map((name, idx) => {
                                const m = idx + 1;
                                let seasonTag = 'Summer';
                                if (m >= 6 && m <= 10) seasonTag = 'Kharif (Monsoon)';
                                else if (m >= 11 || m <= 2) seasonTag = 'Rabi (Winter)';
                                return (
                                    <option key={m} value={m} className="bg-[#0b1710] text-white">
                                        Month {m}: {name} — {seasonTag}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Right: Weather & Canopy Condition Panel */}
                <div className="lg:col-span-6 bg-[#0b1b13]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between">
                    <div className="space-y-5">
                        <div className="border-b border-white/10 pb-4 space-y-3">
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <CloudRain size={22} className="text-emerald-400" />
                                <span>2. Weather Conditions</span>
                            </h2>
                            <button
                                type="button"
                                onClick={() => syncLiveWeather()}
                                disabled={weatherSyncing}
                                className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
                            >
                                <RefreshCw size={20} className={weatherSyncing ? 'animate-spin' : ''} />
                                <span>{weatherSyncing ? 'Syncing Weather...' : 'Sync Live Weather'}</span>
                            </button>
                        </div>

                        {/* Sync Status Banner */}
                        {weatherSyncMessage && (
                            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 size={14} className="shrink-0" />
                                <span>{weatherSyncMessage}</span>
                            </div>
                        )}

                        {/* Interactive Weather Inputs / Sliders */}
                        <div className="space-y-4">
                            {/* Temperature */}
                            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                                        <Thermometer size={18} className="text-amber-400" />
                                        <span>Temperature</span>
                                    </span>
                                    <span className="text-xl font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl">{temperature}°C</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="45" 
                                    value={temperature}
                                    onChange={(e) => setTemperature(Number(e.target.value))}
                                    className="w-full h-3 rounded-full accent-amber-400 cursor-pointer"
                                />
                            </div>

                            {/* Relative Humidity */}
                            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                                        <Droplets size={18} className="text-cyan-400" />
                                        <span>Humidity</span>
                                    </span>
                                    <span className="text-xl font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl">{humidity}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="100" 
                                    value={humidity}
                                    onChange={(e) => setHumidity(Number(e.target.value))}
                                    className="w-full h-3 rounded-full accent-cyan-400 cursor-pointer"
                                />
                            </div>

                            {/* Rainfall & Leaf Wetness Toggle */}
                            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
                                <span className="font-bold text-slate-200 text-sm block">Is it Raining? (Wet Canopy)</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsRaining(true); if(rainfall===0) setRainfall(10); }}
                                        className={`py-4 rounded-2xl text-sm font-extrabold transition-all border ${
                                            isRaining 
                                                ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        🌧️ Yes, Raining
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsRaining(false); setRainfall(0); }}
                                        className={`py-4 rounded-2xl text-sm font-extrabold transition-all border ${
                                            !isRaining 
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        ☀️ No, Dry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generate Advisory Action */}
                    <button
                        type="button"
                        onClick={handleRunAdvisory}
                        disabled={analyzing || loadingOptions}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    >
                        {analyzing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                <span>Evaluating Regional Knowledge Base...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} className="stroke-[2.5]" />
                                <span>Evaluate Diseases To Watch</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* General Weather Alerts Section (From weather_rules.csv) */}
            {advisoryResult && advisoryResult.weather_alerts && advisoryResult.weather_alerts.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>Active Canopy Weather Alerts ({advisoryResult.weather_alerts.length})</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {advisoryResult.weather_alerts.map((alert) => (
                            <div 
                                key={alert.rule_id}
                                className="p-4 rounded-2xl bg-[#1f1606]/90 backdrop-blur-xl border border-amber-500/50 text-amber-200 space-y-2 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                                        {alert.rule_id} • {alert.risk_level.toUpperCase()}
                                    </span>
                                    <span className="text-[11px] text-amber-300/80 font-medium">Weather Trigger</span>
                                </div>
                                <h4 className="text-sm font-bold text-white">{alert.pattern}</h4>
                                <p className="text-xs text-amber-100/90 leading-relaxed">{alert.condition_details}</p>
                                <div className="pt-1.5 border-t border-amber-500/20 text-xs text-amber-300 font-medium flex items-start gap-1.5">
                                    <span className="shrink-0 font-bold">Action:</span>
                                    <span>{alert.action}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Advisory Results Section */}
            {advisoryResult && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 pt-4"
                >
                    {/* Results Subheader & Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                                <span>Diseases to Watch for {advisoryResult.query?.crop}</span>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {advisoryResult.query?.district} ({advisoryResult.query?.agro_region})
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Evaluated under {advisoryResult.query?.temperature}°C, {advisoryResult.query?.humidity}% RH, {advisoryResult.query?.is_wet ? 'Wet conditions' : 'Dry conditions'}.
                            </p>
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 shrink-0">
                            <button
                                onClick={() => setFilterRisk('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    filterRisk === 'all' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                All ({advisoryResult.diseases_to_watch?.length || 0})
                            </button>
                            <button
                                onClick={() => setFilterRisk('high')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    filterRisk === 'high' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                High Watch ({advisoryResult.summary?.high_risk_count || 0})
                            </button>
                            <button
                                onClick={() => setFilterRisk('model_supported')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    filterRisk === 'model_supported' ? 'bg-emerald-400 text-black' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                AI Scannable ({advisoryResult.summary?.model_supported_count || 0})
                            </button>
                        </div>
                    </div>

                    {/* Empty State */}
                    {displayedDiseases.length === 0 && (
                        <div className="p-8 text-center rounded-3xl bg-[#0b1710]/60 border border-white/10 space-y-3">
                            <ShieldCheck size={36} className="text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-bold text-white">No High-Risk Diseases Match Current Weather</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                The current temperature and moisture levels fall outside the high-favorability bands for major {advisoryResult.query?.crop} diseases in {advisoryResult.query?.district}.
                            </p>
                            <button
                                onClick={() => setFilterRisk('all')}
                                className="text-xs text-emerald-400 font-semibold underline hover:text-emerald-300"
                            >
                                View all evaluated diseases
                            </button>
                        </div>
                    )}

                    {/* Diseases Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {displayedDiseases.map((item, index) => {
                            const isHigh = item.advisory_level === 'High';
                            const isMedium = item.advisory_level === 'Medium';

                            return (
                                <motion.div
                                    key={item.disease + index}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-3xl border p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-xl transition-all hover:border-emerald-500/40 ${
                                        isHigh 
                                            ? 'bg-gradient-to-b from-[#1a140b]/90 to-[#10100d]/90 border-amber-500/30' 
                                            : 'bg-[#0d1c14]/85 border-white/10'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        {/* Card Top: Badges */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                                                    isHigh 
                                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                                                        : isMedium 
                                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                                }`}>
                                                    {isHigh ? 'High Risk' : isMedium ? 'Medium Risk' : 'Low Risk'}
                                                </span>
                                                <span className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-slate-300 capitalize font-bold">
                                                    {item.disease_type}
                                                </span>
                                            </div>

                                            {/* AI Model Support Badge */}
                                            {item.model_supported && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-[11px] font-bold text-emerald-300">
                                                    <Camera size={12} />
                                                    <span>AI Scan</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Disease Title */}
                                        <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                            {item.disease}
                                        </h3>

                                        {/* Simple Symptoms & Management List */}
                                        <div className="space-y-3">
                                            {item.symptoms && (
                                                <div>
                                                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                                                        <Search size={14} />
                                                        <span>What to look for:</span>
                                                    </span>
                                                    <p className="text-sm text-slate-200 leading-snug">
                                                        {item.symptoms}
                                                    </p>
                                                </div>
                                            )}

                                            {item.management_note && (
                                                <div>
                                                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                                                        <ShieldCheck size={14} />
                                                        <span>What to do:</span>
                                                    </span>
                                                    <p className="text-sm text-slate-200 leading-snug">
                                                        {item.management_note}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer: Camera Action */}
                                    <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-3">
                                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                            Source: {item.source_org || 'Agri Guide'}
                                        </div>

                                        {/* Scan Leaf shortcut if model_supported */}
                                        {item.model_supported && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigate('/disease-detect', {
                                                        state: {
                                                            initialCrop: advisoryResult.query?.crop,
                                                            targetDisease: item.disease
                                                        }
                                                    });
                                                }}
                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                                            >
                                                <Camera size={14} />
                                                <span>Scan Leaf</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
