import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Leaf, Thermometer, Droplets, CloudRain, Wind, FlaskConical, CheckCircle2, XCircle, ChevronDown, ShieldAlert } from 'lucide-react';
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
      
      const temp = parseFloat(form.temperature);
      const hum = parseFloat(form.humidity);
      const condKey = getConditionKey(temp, hum);
      const cropData = PEST_DATA[form.crop] || PEST_DATA.wheat;
      const pests = cropData[condKey] || cropData['warm_wet'];

      // Merge ML results with UI data
      setResults({ 
        pests, 
        condition: condKey, 
        crop: form.crop,
        mlProbability: res.data.probability 
      });
    } catch (err) {
      console.error("ML Pest Error:", err);
      // Fallback to local logic if ML fails
      const temp = parseFloat(form.temperature);
      const hum = parseFloat(form.humidity);
      const condKey = getConditionKey(temp, hum);
      const cropData = PEST_DATA[form.crop] || PEST_DATA.wheat;
      const pests = cropData[condKey] || cropData['warm_wet'];
      setResults({ pests, condition: condKey, crop: form.crop });
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
                <div className="glass-panel rounded-2xl px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Condition Detected</p>
                    <p className="text-lg font-headline font-bold text-on-surface mt-1">{conditionLabel[results.condition]}</p>
                  </div>
                  {results.mlProbability && (
                    <div className="text-center px-4 border-l border-r border-white/10">
                      <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Outbreak Prob.</p>
                      <p className={`text-xl font-black ${results.mlProbability > 0.6 ? 'text-red-400' : 'text-green-400'}`}>{(results.mlProbability * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant">Pests identified</p>
                    <p className="text-3xl font-black text-orange-400">{results.pests.length}</p>
                  </div>
                </div>

                {/* Pest Cards */}
                {results.pests.map((pest, i) => (
                  <motion.div
                    key={pest.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className={`glass-panel rounded-2xl border overflow-hidden ${riskBg[pest.risk]}`}
                  >
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pest.icon}</span>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{pest.name}</p>
                          <div className={`flex items-center gap-1 mt-0.5 text-xs font-bold ${riskColor[pest.risk]}`}>
                            {riskIcon[pest.risk]} {pest.risk} Risk
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-on-surface-variant transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {expanded === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 flex flex-col gap-3 border-t border-white/10 pt-4">
                            <div>
                              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">💊 Treatment</p>
                              <p className="text-sm text-on-surface-variant leading-relaxed">{pest.treatment}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">🛡️ Prevention</p>
                              <p className="text-sm text-on-surface-variant leading-relaxed">{pest.prevention}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
