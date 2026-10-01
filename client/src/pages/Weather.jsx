import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Wind, Droplets, CloudRain, Sun, Cloud, Thermometer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

function Weather() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchCity, setSearchCity] = useState('');

    const fetchWeather = async (city = 'Pune') => {
        setLoading(true);
        try {
            const res = await api.get('/weather', { params: { city } });
            setTimeout(() => {
                setWeatherData(res.data);
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Default on load
        fetchWeather();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchCity.trim()) {
            fetchWeather(searchCity);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Helper to get a proper dynamic icon
    const getWeatherIcon = (desc, size = 48) => {
        const d = desc.toLowerCase();
        if (d.includes('rain')) return <CloudRain size={size} className="text-blue-400" />;
        if (d.includes('cloud')) return <Cloud size={size} className="text-slate-300" />;
        if (d.includes('clear') || d.includes('sun')) return <Sun size={size} className="text-yellow-400" />;
        return <Sun size={size} className="text-yellow-400" />; // Default
    };

    // Helper to format chart data safely
    const chartData = weatherData?.forecast?.map(day => ({
        name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: day.temp
    })) || [];

    return (
        <div className="w-full max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Weather Insights</h2>
                    <p className="text-slate-400 text-lg">Hyper-local agricultural forecasting using live satellite data.</p>
                </div>

                <form onSubmit={handleSearch} className="glass-panel flex gap-3 p-2 rounded-xl border border-slate-700/50">
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Enter City..."
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            className="input-field !pl-12 pr-4 py-2 text-sm text-white w-48 md:w-64"
                        />
                    </div>
                    <button type="submit" className="bg-sky-600 hover:bg-sky-500 transition-colors text-white px-6 py-2 rounded-lg font-medium text-sm shadow-lg shadow-sky-500/20 flex items-center">
                        <Search size={16} className="mr-2" /> Search
                    </button>
                </form>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                </div>
            ) : weatherData ? (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Current Weather Card */}
                    <motion.div variants={itemVariants} className="glass-card p-8 lg:col-span-1 border-sky-500/20 relative overflow-hidden flex flex-col justify-between h-[380px]">
                        {/* Interactive Background Gradient based on temp/weather could go here */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                        <div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h3 className="text-2xl font-bold text-white tracking-wide">{weatherData.location}</h3>
                                {getWeatherIcon(weatherData.current.description, 42)}
                            </div>
                            <p className="text-sky-400 font-medium capitalize mb-6">{weatherData.current.description}</p>

                            <div className="flex items-start">
                                <span className="text-7xl font-bold text-white tracking-tighter">
                                    {weatherData.current.temp}
                                </span>
                                <span className="text-3xl text-sky-400 mt-2 font-medium">°C</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10 border-t border-slate-700/50 pt-6">
                            <div className="flex items-center">
                                <Droplets className="text-blue-400 mr-2" size={20} />
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Humidity</p>
                                    <p className="font-semibold text-white">{weatherData.current.humidity}%</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Wind className="text-teal-400 mr-2" size={20} />
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Wind</p>
                                    <p className="font-semibold text-white">{weatherData.current.windSpeed} m/s</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Chart / Forecast Area */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-6">

                        {/* 5 Day Trend Chart */}
                        <div className="glass-panel p-6 h-[200px] flex flex-col">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center">
                                <Thermometer className="mr-2 text-sky-400" size={16} /> Temperature Trend
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#64748B" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }}
                                            formatter={(value) => [`${value}°C`, 'Temp']}
                                        />
                                        <Area type="monotone" dataKey="temp" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 5 Day Mini Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {weatherData.forecast?.map((day, idx) => (
                                <div key={idx} className="glass-card p-4 text-center hover:-translate-y-1 transition-transform border border-slate-700/50 hover:border-sky-500/30">
                                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mb-3">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <div className="flex justify-center mb-3">
                                        {getWeatherIcon(day.description, 28)}
                                    </div>
                                    <p className="text-lg font-bold text-white">{day.temp}°</p>
                                    <p className="text-[10px] text-slate-500 mt-1 capitalize truncate w-full px-1">{day.description}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </motion.div>
            ) : (
                <div className="text-center py-20 text-slate-400">Failed to load weather data.</div>
            )}
        </div>
    );
}

export default Weather;
