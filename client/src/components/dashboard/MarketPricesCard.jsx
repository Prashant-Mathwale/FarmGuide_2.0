import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import api from '../../services/api';

const TARGET_CROPS = [
    { name: 'Tomato', icon: '🍅', aliases: ['tomato', 'tamatar'], fallbackPrice: 2130, fallbackChange: 5, defaultUp: true },
    { name: 'Onion', icon: '🧅', aliases: ['onion', 'pyaz', 'kanda'], fallbackPrice: 2900, fallbackChange: 3, defaultUp: false },
    { name: 'Soybean', icon: '🫘', aliases: ['soyabean', 'soybean', 'soya'], fallbackPrice: 4700, fallbackChange: 2, defaultUp: true },
    { name: 'Cotton', icon: '🌱', aliases: ['cotton', 'kapas', 'kapaas'], fallbackPrice: 6200, fallbackChange: 1, defaultUp: true },
    { name: 'Maize', icon: '🌽', aliases: ['maize', 'makka', 'corn'], fallbackPrice: 2355, fallbackChange: 4, defaultUp: false },
    { name: 'Wheat', icon: '🌾', aliases: ['wheat', 'gehun', 'gehu'], fallbackPrice: 2450, fallbackChange: 2, defaultUp: true },
];

const DEFAULT_MARKET_DATA = [
    { name: 'Tomato', icon: '🍅', price: '2,130', change: 5, isUp: true },
    { name: 'Onion', icon: '🧅', price: '2,900', change: 3, isUp: false },
    { name: 'Soybean', icon: '🫘', price: '4,700', change: 2, isUp: true },
    { name: 'Cotton', icon: '🌱', price: '6,200', change: 1, isUp: true },
    { name: 'Maize', icon: '🌽', price: '2,355', change: 4, isUp: false },
];

const MarketPricesCard = ({ user }) => {
    const [prices, setPrices] = useState(DEFAULT_MARKET_DATA);
    const [lastUpdated, setLastUpdated] = useState('Just now');

    // Helper to map array of raw mandi items into display items
    const mapMandiDataToDisplay = (items) => {
        if (!Array.isArray(items) || items.length === 0) return null;

        const matched = [];
        for (const crop of TARGET_CROPS) {
            const apiItem = items.find(item => {
                const cName = (item.commodity || item.cropName || '').toLowerCase();
                return crop.aliases.some(alias => cName.includes(alias));
            });

            if (apiItem) {
                const modal = Number(apiItem.modal_price || apiItem.modalPrice || crop.fallbackPrice);
                const min = Number(apiItem.min_price || apiItem.minPrice || modal);
                const max = Number(apiItem.max_price || apiItem.maxPrice || modal);

                let change = crop.fallbackChange;
                let isUp = crop.defaultUp;

                if (max > min && modal > 0) {
                    const mid = (min + max) / 2;
                    const diff = Math.round(Math.abs((modal - mid) / mid) * 100);
                    change = diff > 0 ? diff : crop.fallbackChange;
                    isUp = modal >= mid;
                }

                matched.push({
                    name: crop.name,
                    icon: crop.icon,
                    price: modal.toLocaleString('en-IN'),
                    change,
                    isUp
                });
            } else {
                matched.push({
                    name: crop.name,
                    icon: crop.icon,
                    price: crop.fallbackPrice.toLocaleString('en-IN'),
                    change: crop.fallbackChange,
                    isUp: crop.defaultUp
                });
            }

            if (matched.length === 5) break;
        }

        return matched;
    };

    useEffect(() => {
        let isMounted = true;

        // 1. Try to load from cached storage first for instant response
        try {
            const cached = localStorage.getItem('farmguide_latest_market_prices');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed?.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
                    const mapped = mapMandiDataToDisplay(parsed.items);
                    if (mapped && isMounted) {
                        setPrices(mapped);
                        if (parsed.latestDate) setLastUpdated(`Data from ${parsed.latestDate}`);
                    }
                }
            }
        } catch {}

        // 2. Fetch fresh live prices from Mandi API
        const loadMarketPrices = async () => {
            try {
                const userState = user?.state || 'Maharashtra';
                const queryParams = new URLSearchParams({ state: userState });

                // Step 1: Query without date to get latest available date from metadata
                const metaRes = await fetch(`https://mandi-api.onrender.com/v1/prices?${queryParams.toString()}`);
                const metaJson = await metaRes.json();

                const latestDate = metaJson?.meta?.latest_fetched_at
                    ? metaJson.meta.latest_fetched_at.split('T')[0]
                    : metaJson?.data?.[0]?.arrival_date || null;

                let json = metaJson;
                if (latestDate) {
                    const dateRes = await fetch(`https://mandi-api.onrender.com/v1/prices?${queryParams.toString()}&date=${latestDate}`);
                    const dateJson = await dateRes.json();
                    if (dateJson.success && Array.isArray(dateJson.data) && dateJson.data.length > 0) {
                        json = dateJson;
                    }
                }

                if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
                    const mapped = mapMandiDataToDisplay(json.data);
                    if (mapped) {
                        setPrices(mapped);
                        setLastUpdated(latestDate ? `Data from ${latestDate}` : 'Just now');
                        
                        // Cache for subsequent page loads
                        try {
                            localStorage.setItem('farmguide_latest_market_prices', JSON.stringify({
                                timestamp: Date.now(),
                                latestDate: latestDate || 'Today',
                                items: json.data
                            }));
                        } catch {}
                    }
                }
            } catch (err) {
                // Graceful fallback to cached or default reference prices
            }
        };

        loadMarketPrices();

        // 3. Listen to real-time updates if user views MarketPrices page in another tab/component
        const handleSync = () => {
            try {
                const cached = localStorage.getItem('farmguide_latest_market_prices');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed?.items && isMounted) {
                        const mapped = mapMandiDataToDisplay(parsed.items);
                        if (mapped) {
                            setPrices(mapped);
                            if (parsed.latestDate) setLastUpdated(`Data from ${parsed.latestDate}`);
                        }
                    }
                }
            } catch {}
        };

        window.addEventListener('farmguide_market_prices_updated', handleSync);

        return () => {
            isMounted = false;
            window.removeEventListener('farmguide_market_prices_updated', handleSync);
        };
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
