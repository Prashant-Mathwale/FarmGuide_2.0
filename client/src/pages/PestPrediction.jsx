import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Leaf, Thermometer, Droplets, CloudRain, Wind, FlaskConical, CheckCircle2, XCircle, ChevronDown, ShieldAlert, Navigation, Search } from 'lucide-react';
import api from '../services/api';

const PEST_DATA = {
  wheat: {
    hot_humid: [
      { name: 'Aphids', risk: 'High', icon: '🦗', treatment: 'Apply Imidacloprid 17.8 SL @ 150ml/acre. Remove infected leaves.', prevention: 'Use resistant varieties, avoid excess nitrogen.' },
      { name: 'Stem Borer', risk: 'Medium', icon: '🐛', treatment: 'Use Chlorpyrifos 20 EC @ 2.5ml/L water. Apply at base of stems.', prevention: 'Crop rotation, field sanitation after harvest.' },
      { name: 'Rust Disease', risk: 'High', icon: '🍂', treatment: 'Spray Propiconazole 25 EC @ 1ml/L. Repeat after 15 days.', prevention: 'Use certified rust-resistant seed varieties.' },
    ],
    cool_dry: [
      { name: 'Termites', risk: 'Medium', icon: '🐜', treatment: 'Soil treatment with Chlorpyrifos 20 EC before sowing.', prevention: 'Avoid planting near termite mounds, use treated seeds.' },
      { name: 'Powdery Mildew', risk: 'Low', icon: '🌫️', treatment: 'Apply Karathane @ 1ml/L or Sulfur 80 WP @ 2.5g/L.', prevention: 'Improve air circulation, avoid overhead irrigation.' },
    ],
    warm_wet: [
      { name: 'Brown Plant Hopper', risk: 'High', icon: '🦟', treatment: 'Apply Buprofezin 25 SC @ 1.6ml/L or Thiamethoxam.', prevention: 'Avoid dense planting, use light traps at night.' },
      { name: 'Leaf Blight', risk: 'Medium', icon: '🍃', treatment: 'Spray Mancozeb 75 WP @ 2.5g/L water at 10-day intervals.', prevention: 'Use disease-free seeds, ensure field drainage.' },
    ],
  },
  rice: {
    hot_humid: [
      { name: 'Brown Plant Hopper', risk: 'High', icon: '🦟', treatment: 'Apply Buprofezin 25 SC @ 1.6ml/L. Drain fields temporarily.', prevention: 'Resistant varieties, balanced fertilization, avoid excess N.' },
      { name: 'Blast Disease', risk: 'High', icon: '💥', treatment: 'Spray Tricyclazole 75 WP @ 0.6g/L. Apply twice.', prevention: 'Use certified blast-resistant seeds, silicon application.' },
      { name: 'Stem Borer', risk: 'Medium', icon: '🐛', treatment: 'Apply Carbofuran 3G @ 10kg/acre in standing water.', prevention: 'Avoid ratoon cropping, destroy stubbles post-harvest.' },
    ],
    cool_dry: [
      { name: 'Thrips', risk: 'Low', icon: '🐞', treatment: 'Spray Dimethoate 30 EC @ 2ml/L of water.', prevention: 'Reflective mulches, sticky traps, proper irrigation.' },
    ],
    warm_wet: [
      { name: 'Sheath Blight', risk: 'High', icon: '🌾', treatment: 'Apply Hexaconazole 5 SC @ 2ml/L or Validamycin @ 2ml/L.', prevention: 'Reduce plant density, avoid high nitrogen doses.' },
      { name: 'Gundhi Bug', risk: 'Medium', icon: '🪲', treatment: 'Spray Malathion 50 EC @ 2ml/L in early morning.', prevention: 'Remove weeds from field boundaries, use light traps.' },
    ],
  },
  cotton: {
    hot_humid: [
      { name: 'Bollworm', risk: 'High', icon: '🐛', treatment: 'Apply Emamectin Benzoate 5 SG @ 0.4g/L. Use pheromone traps.', prevention: 'Bt cotton hybrids, timely sowing, destroy crop residues.' },
      { name: 'Whitefly', risk: 'High', icon: '🤍', treatment: 'Spray Pyriproxyfen 10 EC @ 1ml/L or Spiromesifen.', prevention: 'Reflective mulches, yellow sticky traps, natural enemies.' },
      { name: 'Aphids', risk: 'Medium', icon: '🦗', treatment: 'Apply Dimethoate 30 EC @ 1.5ml/L of water.', prevention: 'Conserve natural predators, avoid excess nitrogen.' },
    ],
    cool_dry: [
      { name: 'Thrips', risk: 'Medium', icon: '🐞', treatment: 'Spray Spinosad 45 SC @ 0.3ml/L or Fipronil 5 SC.', prevention: 'Use blue sticky traps, proper irrigation scheduling.' },
    ],
    warm_wet: [
      { name: 'Mealybugs', risk: 'High', icon: '🪱', treatment: 'Apply Profenofos 50 EC @ 2ml/L, uproot heavily infested plants.', prevention: 'Use mealybug-free planting material, check transplants.' },
    ],
  },
  sugarcane: {
    hot_humid: [
      { name: 'Top Shoot Borer', risk: 'High', icon: '🐛', treatment: 'Apply Carbofuran 3G in leaf axils @ 3kg/acre.', prevention: 'Early planting, use resistant varieties, remove dead hearts.' },
      { name: 'Pyrilla', risk: 'Medium', icon: '🦟', treatment: 'Release egg parasitoids, spray Malathion 50 EC @ 2ml/L.', prevention: 'Proper drainage, avoid waterlogging, biological control.' },
    ],
    cool_dry: [
      { name: 'Termites', risk: 'Medium', icon: '🐜', treatment: 'Soil drench with Chlorpyrifos 20 EC @ 4ml/L.', prevention: 'Well-decomposed manure, avoid dry irrigation, healthy ratoons.' },
    ],
    warm_wet: [
      { name: 'Red Rot', risk: 'High', icon: '🔴', treatment: 'Use disease-free setts, hot water treatment at 52°C for 30 min.', prevention: 'Resistant varieties, proper drainage, crop rotation every 3-4 years.' },
      { name: 'Stem Borer', risk: 'Medium', icon: '🐛', treatment: 'Trichogramma egg parasitoid release @ 50,000/acre/week.', prevention: 'Timely earthing up, synchronised planting.' },
    ],
  },
};

const getConditionKey = (temp, humidity) => {
  if (temp > 32 && humidity > 70) return 'hot_humid';
  if (temp < 25 && humidity < 50) return 'cool_dry';
  return 'warm_wet';
};

const riskColor = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-green-400',
};

const riskBg = {
  High: 'bg-red-400/10 border-red-400/30',
  Medium: 'bg-amber-400/10 border-amber-400/30',
  Low: 'bg-green-400/10 border-green-400/30',
};

const riskIcon = {
  High: <XCircle size={16} className="text-red-400" />,
  Medium: <AlertTriangle size={16} className="text-amber-400" />,
  Low: <CheckCircle2 size={16} className="text-green-400" />,
};

export default function PestPrediction() {
  const [form, setForm] = useState({
    crop: 'wheat',
    temperature: '',
    humidity: '',
    rainfall: '',
    windSpeed: '',
    soilMoisture: '',
    season: 'kharif',
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [searchCity, setSearchCity] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchWeatherData = async (lat, lon) => {
    try {
      setLocationLoading(true);
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto`);
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        temperature: data.current?.temperature_2m ?? '',
        humidity: data.current?.relative_humidity_2m ?? '',
        windSpeed: data.current?.wind_speed_10m ?? '',
        rainfall: data.current?.precipitation ?? ''
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch weather data.");
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchUserLocation = () => {
    if ("geolocation" in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error(error);
          alert("Location access denied.");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const fetchCityLocation = async () => {
    if (!searchCity) return;
    try {
      setLocationLoading(true);
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchCity}&count=1&language=en&format=json`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        fetchWeatherData(data.results[0].latitude, data.results[0].longitude);
      } else {
        alert("City not found.");
        setLocationLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Search failed.");
      setLocationLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const payload = {
        Temperature_C: parseFloat(form.temperature),
        Humidity_percent: parseFloat(form.humidity),
        Rainfall_mm: parseFloat(form.rainfall),
        Soil_pH: 7.0, // Default or could be added to form
        Nitrogen_N: 80,
        Phosphorus_P: 40,
        Potassium_K: 40,
        Crop_Type: form.crop,
        Location: "Gujarat" // Default
      };

      const res = await api.post('/ml/pest-predict', payload);
      
      if (res.data.success) {
          const prob = Number(res.data.riskProbability ?? res.data.probability ?? 0);
          setResults({ 
            success: true,
            mlProbability: isNaN(prob) ? 0 : prob,
            riskLevel: res.data.riskLevel || (prob > 70 ? 'HIGH' : prob > 40 ? 'MEDIUM' : 'LOW'),
            riskWindow: res.data.riskWindow || 'Next 5-7 days',
            actionPlan: res.data.actionPlan || 'Monitor crop regularly and maintain optimal field hygiene.',
            crop: form.crop,
            pestName: res.data.pestName || res.data.pest || '',
          });
      } else {
          alert("Pest prediction failed: " + res.data.message);
      }
    } catch (err) {
      console.error("ML Pest Error:", err);
      alert("Pest prediction failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const conditionLabel = {
    hot_humid: '🌡️ Hot & Humid',
    cool_dry: '❄️ Cool & Dry',
    warm_wet: '🌧️ Warm & Wet',
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Header */}
      <section className="mb-8 mt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle size={26} className="text-orange-400" />
          </div>
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              Pest <span className="text-orange-400" style={{ textShadow: '0 0 20px rgba(251,146,60,0.4)' }}>Prediction</span>
            </h2>
            <p className="text-on-surface-variant text-sm">AI-powered pest & disease risk assessment for your crop</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={handlePredict}
          className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col gap-5"
        >
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <FlaskConical size={18} className="text-orange-400" /> Field Parameters
          </h3>

          {/* Auto Fill Section */}
          <div className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={fetchUserLocation} 
                disabled={locationLoading} 
                className="flex-1 bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 transition-colors py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                <Navigation size={14} /> {locationLoading ? 'Loading...' : 'Auto-fill from My Location'}
              </button>
            </div>
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                placeholder="Or search city..." 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchCityLocation(); } }}
                className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50" 
              />
              <button 
                type="button" 
                onClick={fetchCityLocation} 
                disabled={locationLoading} 
                className="bg-sky-600 hover:bg-sky-500 transition-colors px-4 py-2 rounded-lg text-white"
              >
                <Search size={14} />
              </button>
            </div>
          </div>

          {/* Crop Select */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
              <Leaf size={12} /> Crop Type
            </label>
            <div className="relative">
              <select
                name="crop"
                value={form.crop}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface appearance-none pr-10 focus:outline-none focus:border-orange-400/50"
              >
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="cotton">Cotton</option>
                <option value="sugarcane">Sugarcane</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          {/* Season */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Season</label>
            <div className="relative">
              <select
                name="season"
                value={form.season}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface appearance-none pr-10 focus:outline-none focus:border-orange-400/50"
              >
                <option value="kharif">Kharif (Jun–Oct)</option>
                <option value="rabi">Rabi (Nov–Apr)</option>
                <option value="zaid">Zaid (Apr–Jun)</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
              <Thermometer size={12} /> Temperature (°C)
            </label>
            <input
              type="number"
              step="any"
              name="temperature"
              value={form.temperature}
              onChange={handleChange}
              placeholder="e.g. 30"
              required
              min={0} max={55}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-400/50"
            />
          </div>

          {/* Humidity */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
              <Droplets size={12} /> Humidity (%)
            </label>
            <input
              type="number"
              step="any"
              name="humidity"
              value={form.humidity}
              onChange={handleChange}
              placeholder="e.g. 65"
              required
              min={0} max={100}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-400/50"
            />
          </div>

          {/* Rainfall */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
              <CloudRain size={12} /> Rainfall (mm)
            </label>
            <input
              type="number"
              step="any"
              name="rainfall"
              value={form.rainfall}
              onChange={handleChange}
              placeholder="e.g. 120"
              required
              min={0}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-400/50"
            />
          </div>

          {/* Wind Speed */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
              <Wind size={12} /> Wind Speed (km/h)
            </label>
            <input
              type="number"
              step="any"
              name="windSpeed"
              value={form.windSpeed}
              onChange={handleChange}
              placeholder="e.g. 15"
              min={0}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-orange-400/50"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_4px_20px_rgba(249,115,22,0.35)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing Field Data...
              </>
            ) : (
              <><AlertTriangle size={16} /> Predict Pest Risks</>
            )}
          </motion.button>
        </motion.form>

        {/* Results Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!results && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <div className="w-20 h-20 rounded-full bg-orange-400/10 flex items-center justify-center mb-4">
                  <ShieldAlert size={36} className="text-orange-400/50" />
                </div>
                <p className="text-on-surface-variant font-body text-sm max-w-xs">
                  Fill in your field parameters and click <span className="text-orange-400 font-bold">Predict Pest Risks</span> to get AI-driven pest & disease assessment.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] gap-4"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-400/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-t-orange-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-5 rounded-full bg-orange-400/20 flex items-center justify-center">
                    <ShieldAlert size={18} className="text-orange-400" />
                  </div>
                </div>
                <p className="text-on-surface-variant text-sm">Running pest risk analysis...</p>
              </motion.div>
            )}

            {results && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4"
              >
                {/* Summary Bar */}
                <div className="glass-panel rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">General Pest Risk Level</p>
                    <p className={`text-2xl font-headline font-bold mt-1 ${results.riskLevel === 'HIGH' ? 'text-red-400' : results.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'}`}>{results.riskLevel || 'LOW'}</p>
                    <p className="text-xs mt-1 text-on-surface-variant opacity-70">({results.riskWindow || 'Next 5-7 days'})</p>
                  </div>
                  <div className="flex-1 text-center md:border-l md:border-r border-white/10">
                    <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Outbreak Probability</p>
                    <p className={`text-3xl font-black ${(results.mlProbability ?? 0) > 50 ? 'text-red-400' : 'text-green-400'}`}>
                      {(results.mlProbability ?? 0).toFixed(1)}%
                    </p>
                    {results.pestName && (
                      <p className="text-xs text-orange-300 font-semibold mt-1">
                        Pest Identified: {results.pestName}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-on-surface-variant">Crop Vulnerability</p>
                    <p className="text-lg font-black text-on-surface capitalize">{results.crop}</p>
                  </div>
                </div>

                {/* Gemini Action Plan */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-panel rounded-2xl border overflow-hidden ${(results.mlProbability ?? 0) > 50 ? 'bg-red-400/10 border-red-400/30' : 'bg-amber-400/10 border-amber-400/30'}`}
                >
                  <div className="px-6 py-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🤖</span>
                        <p className="font-bold text-on-surface text-lg">AI Action Plan</p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                          {results.actionPlan}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
