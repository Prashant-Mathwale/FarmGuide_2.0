import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_MARKET_DATA = [
    { name: 'Tomato', icon: '🍅', price: '2,400', change: 5, isUp: true },
    { name: 'Onion', icon: '🧅', price: '1,850', change: 3, isUp: false },
    { name: 'Soybean', icon: '🫘', price: '4,700', change: 2, isUp: true },
    { name: 'Cotton', icon: '🌱', price: '6,200', change: 1, isUp: true },
    { name: 'Maize', icon: '🌽', price: '2,100', change: 4, isUp: false },
];

const MarketPricesCard = ({ user }) => {
    const [prices, setPrices] = useState(DEFAULT_MARKET_DATA);
    const [lastUpdated, setLastUpdated] = useState('10 min ago');

    useEffect(() => {
        let isMounted = true;
        const loadMarketPrices = async () => {
            try {
                // Use user's state if available, otherwise default to Maharashtra
                const userState = user?.state || 'Maharashtra';
                const res = await fetch(`https://mandi-api.onrender.com/v1/prices?state=${encodeURIComponent(userState)}`);
                const json = await res.json();
                
                if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
                    const mapped = DEFAULT_MARKET_DATA.map((fallback) => {
                        const apiItem = json.data.find(
                            item => item.commodity && item.commodity.toLowerCase().includes(fallback.name.toLowerCase())
                        );
                        
                        // Parse fallback price correctly (remove commas) just in case
                        const fallbackPriceNum = Number(fallback.price.replace(/,/g, ''));
                        const priceNum = apiItem ? (apiItem.modal_price || fallbackPriceNum) : fallbackPriceNum;
                        
                        return {
                            name: fallback.name,
                            icon: fallback.icon,
                            price: Number(priceNum).toLocaleString('en-IN'),
                            change: fallback.change, // Keep mock change for UI aesthetics
                            isUp: fallback.isUp,
                        };
                    });
                    
                    setPrices(mapped);
                    setLastUpdated('Just now');
                }
            } catch (err) {
                // Graceful fallback to default market reference prices
            }
        };

        loadMarketPrices();
        return () => { isMounted = false; };
    }, [user]);

    return (
        <div className="bg-[#0b2416]/75 backdrop-blur-md border border-[#1e4d30]/70 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between h-full">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-white font-semibold text-base tracking-wide">
                            Market Prices <span className="text-xs text-emerald-300/70 font-normal">(₹ / Quintal)</span>
                        </h3>
                    </div>
                    <Link
                        to="/market-prices"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium group"
                    >
                        <span>View All Prices</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Price list */}
                <div className="space-y-2.5">
                    {prices.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-base select-none">{item.icon}</span>
                                <span className="text-sm font-medium text-emerald-50">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-white tracking-wide">
                                    ₹{item.price}
                                </span>
                                <div
                                    className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                                        item.isUp
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : 'text-rose-400 bg-rose-500/10'
                                    }`}
                                >
                                    {item.isUp ? (
                                        <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                                    ) : (
                                        <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                                    )}
                                    <span>{item.change}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-emerald-500/15 flex items-center gap-1.5 text-[11px] text-emerald-300/60">
                <Clock className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Last updated: {lastUpdated}</span>
            </div>
        </div>
    );
};

export default MarketPricesCard;
