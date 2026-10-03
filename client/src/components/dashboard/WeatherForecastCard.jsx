import React from 'react';
import { Link } from 'react-router-dom';
import { CloudSun, Droplets, CloudRain, Wind, MapPin, ArrowRight, Sun, Cloud } from 'lucide-react';

const WeatherForecastCard = ({ weatherData }) => {
    // Default fallback matching reference image
    const location = weatherData?.location || 'Pune, Maharashtra';
    const temp = weatherData?.current?.temp !== undefined ? Math.round(weatherData.current.temp) : 28;
    const condition = weatherData?.current?.description || 'Partly Cloudy';
    const humidity = weatherData?.current?.humidity !== undefined ? weatherData.current.humidity : 62;
    const rainChance = weatherData?.current?.rainChance !== undefined ? weatherData.current.rainChance : 20;
    const windSpeed = weatherData?.current?.windSpeed !== undefined ? Math.round(weatherData.current.windSpeed * 3.6) : 12;

    const hourlyForecast = weatherData?.hourly || [
        { time: 'Now', temp: '28°', icon: 'sun-cloud' },
        { time: '12 PM', temp: '30°', icon: 'sun' },
        { time: '3 PM', temp: '31°', icon: 'sun' },
        { time: '6 PM', temp: '29°', icon: 'cloud' },
        { time: '9 PM', temp: '26°', icon: 'cloud' },
    ];

    const renderHourlyIcon = (type) => {
        if (type === 'sun') {
            return <Sun className="w-5 h-5 text-amber-400" />;
        }
        if (type === 'cloud') {
            return <Cloud className="w-5 h-5 text-sky-200" />;
        }
        return <CloudSun className="w-5 h-5 text-amber-300" />;
    };

    return (
        <div className="bg-[#0b2416]/75 backdrop-blur-md border border-[#1e4d30]/70 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col h-full">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                            <CloudSun className="w-5 h-5" />
                        </div>
                        <h3 className="text-white font-semibold text-base tracking-wide">Weather Forecast</h3>
                    </div>
                    <Link
                        to="/weather"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium group"
                    >
                        <span>View Full Forecast</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Location subline */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-200/80 mb-4 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{location}</span>
                </div>

                {/* Main Weather Display */}
                <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                    {/* Left: Temp & Condition */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Sun className="w-10 h-10 text-amber-400 animate-pulse" />
                            <Cloud className="w-7 h-7 text-sky-200 absolute -bottom-1 -right-1 drop-shadow" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white tracking-tight">
                                {temp}°C
                            </div>
                            <div className="text-xs text-emerald-100/90 font-medium">
                                {condition}
                            </div>
                        </div>
                    </div>

                    {/* Right: Humidity, Rain, Wind */}
                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-emerald-100/80">
                            <Droplets className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-emerald-200/70">Humidity</span>
                            <span className="font-semibold text-white ml-auto">{humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-100/80">
                            <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                            <span className="text-emerald-200/70">Rain Chance</span>
                            <span className="font-semibold text-white ml-auto">{rainChance}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-100/80">
                            <Wind className="w-3.5 h-3.5 text-teal-300" />
                            <span className="text-emerald-200/70">Wind</span>
                            <span className="font-semibold text-white ml-auto">{windSpeed} km/h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hourly Forecast strip */}
            <div className="pt-3 mt-2 border-t border-emerald-500/15 grid grid-cols-5 gap-1.5 text-center shrink-0">
                {hourlyForecast.map((hour, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5 py-1.5 px-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-colors"
                    >
                        <span className="text-[11px] text-emerald-200/70 font-medium">{hour.time}</span>
                        {renderHourlyIcon(hour.icon)}
                        <span className="text-xs font-semibold text-white">{hour.temp}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherForecastCard;
