import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Camera, Sprout, TrendingUp, Cloud } from 'lucide-react';
import { getRecentActivities } from '../../utils/activityTracker';

const TYPE_CONFIG = {
    disease: { icon: Camera, color: 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30', defaultTo: '/disease-detect' },
    crop: { icon: Sprout, color: 'bg-green-600/30 text-green-400 border-green-500/30', defaultTo: '/crop-rec' },
    market: { icon: TrendingUp, color: 'bg-amber-600/30 text-amber-400 border-amber-500/30', defaultTo: '/market-prices' },
    weather: { icon: Cloud, color: 'bg-sky-600/30 text-sky-400 border-sky-500/30', defaultTo: '/weather' }
};

const DEFAULT_ACTIVITIES = [
    {
        id: '1',
        type: 'disease',
        title: 'Disease Detection',
        subtitle: 'Tomato → Early Blight (91%)',
        time: 'Today, 10:42 AM',
        icon: Camera,
        color: 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
        to: '/disease-detect'
    },
    {
        id: '2',
        type: 'crop',
        title: 'Crop Recommendation',
        subtitle: 'Recommended: Soybean',
        time: 'Yesterday, 4:20 PM',
        icon: Sprout,
        color: 'bg-green-600/30 text-green-400 border-green-500/30',
        to: '/crop-rec'
    },
    {
        id: '3',
        type: 'market',
        title: 'Market Prices',
        subtitle: 'Checked tomato prices',
        time: 'Yesterday, 2:15 PM',
        icon: TrendingUp,
        color: 'bg-amber-600/30 text-amber-400 border-amber-500/30',
        to: '/market-prices'
    },
    {
        id: '4',
        type: 'weather',
        title: 'Weather',
        subtitle: 'Viewed 5-day forecast',
        time: '2 days ago',
        icon: Cloud,
        color: 'bg-sky-600/30 text-sky-400 border-sky-500/30',
        to: '/weather'
    }
];

const RecentActivityCard = () => {
    const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);

    const refreshActivities = () => {
        const stored = getRecentActivities();
        if (stored.length > 0) {
            const mapped = stored.map(item => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.disease;
                return {
                    ...item,
                    icon: config.icon,
                    color: config.color,
                    to: item.to || config.defaultTo
                };
            });
            setActivities(mapped);
        } else {
            setActivities(DEFAULT_ACTIVITIES);
        }
    };

    useEffect(() => {
        refreshActivities();
        window.addEventListener('farmguide_activity_updated', refreshActivities);
        return () => {
            window.removeEventListener('farmguide_activity_updated', refreshActivities);
        };
    }, []);

    return (
        <div className="bg-[#0b2416]/75 backdrop-blur-md border border-[#1e4d30]/70 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-full">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="text-white font-semibold text-base tracking-wide">Recent Activity</h3>
                    </div>
                    <Link
                        to="/disease-detect"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium group"
                    >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Activity Items (shows 4 items, scrollable for more) */}
                <div
                    className="space-y-2.5 max-h-[244px] overflow-y-auto pr-1 select-none"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(16, 185, 129, 0.4) transparent'
                    }}
                >
                    {activities.map((item) => {
                        const IconComponent = item.icon || Camera;
                        return (
                            <Link
                                key={item.id}
                                to={item.to || '#'}
                                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                                            item.color || 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
                                        }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-[11px] text-emerald-200/70 truncate max-w-[140px] sm:max-w-[170px]">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-emerald-300/60 font-medium shrink-0 ml-2">
                                    {item.time}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Scroll indicator footer if more than 4 activities */}
            {activities.length > 4 && (
                <div className="pt-2.5 mt-2 border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-300/60">
                    <span>{activities.length} activities</span>
                    <span className="text-[10px] text-emerald-400/80 font-medium">Scroll to view more ↓</span>
                </div>
            )}
        </div>
    );
};

export default RecentActivityCard;
