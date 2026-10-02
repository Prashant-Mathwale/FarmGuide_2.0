import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DiseaseDetectionCard from '../components/dashboard/DiseaseDetectionCard';
import QuickActions from '../components/dashboard/QuickActions';
import WeatherForecastCard from '../components/dashboard/WeatherForecastCard';
import MarketPricesCard from '../components/dashboard/MarketPricesCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import CommunityDiscussionsCard from '../components/dashboard/CommunityDiscussionsCard';

const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rain / Drizzle';
    if (code >= 71 && code <= 86) return 'Snow';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Partly Cloudy';
};

const getWeatherIconType = (code) => {
    if (code === 0) return 'sun';
    if (code === 1 || code === 2 || code === 3) return 'sun-cloud';
    return 'cloud';
};

const Dashboard = () => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo')) || null;
        } catch {
            return null;
        }
    });

    const [selectedLang, setSelectedLang] = useState(() => {
        return localStorage.getItem('i18nextLng') || 'en';
    });

    const [recentScan, setRecentScan] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('farmguide_recent_scan')) || null;
        } catch {
            return null;
        }
    });

    // Default weather matching reference image
    const [weatherData, setWeatherData] = useState({
        location: 'Pune, Maharashtra',
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 62,
        rainChance: 20,
        windSpeed: 12,
        current: {
            temp: 28,
            description: 'Partly Cloudy',
            humidity: 62,
            rainChance: 20,
            windSpeed: 3.3, // ~12 km/h
        },
        hourly: [
            { time: 'Now', temp: '28°', icon: 'sun-cloud' },
            { time: '12 PM', temp: '30°', icon: 'sun' },
            { time: '3 PM', temp: '31°', icon: 'sun' },
            { time: '6 PM', temp: '29°', icon: 'cloud' },
            { time: '9 PM', temp: '26°', icon: 'cloud' },
        ]
    });

    // Fetch live weather data if available
    useEffect(() => {
        let isMounted = true;

        const fetchLiveWeather = async (lat, lon, locName) => {
            try {
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&timezone=auto`
                );
                const data = await res.json();
                if (!isMounted || !data.current) return;

                const currTemp = Math.round(data.current.temperature_2m);
                const currHum = data.current.relative_humidity_2m;
                const currWind = Math.round(data.current.wind_speed_10m);
                const currDesc = getWeatherDescription(data.current.weather_code);

                // Build hourly intervals
                let hourlyList = [];
                if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
                    const currentHour = new Date().getHours();
                    const hoursToShow = [
                        { label: 'Now', offset: 0 },
                        { label: '12 PM', targetHour: 12 },
                        { label: '3 PM', targetHour: 15 },
                        { label: '6 PM', targetHour: 18 },
                        { label: '9 PM', targetHour: 21 },
                    ];

                    hourlyList = hoursToShow.map((item, idx) => {
                        let hourIdx = currentHour;
                        if (item.targetHour !== undefined) {
                            hourIdx = item.targetHour;
                        }
                        const tempVal = data.hourly.temperature_2m[hourIdx] !== undefined
                            ? Math.round(data.hourly.temperature_2m[hourIdx])
                            : 28;
                        const codeVal = data.hourly.weather_code?.[hourIdx] || 1;
                        return {
                            time: item.label,
                            temp: `${tempVal}°`,
                            icon: getWeatherIconType(codeVal)
                        };
                    });
                }

                setWeatherData({
                    location: locName,
                    temp: currTemp,
                    condition: currDesc,
                    humidity: currHum,
                    rainChance: 20,
                    windSpeed: currWind,
                    current: {
                        temp: currTemp,
                        description: currDesc,
                        humidity: currHum,
                        rainChance: 20,
                        windSpeed: currWind / 3.6,
                    },
                    hourly: hourlyList.length > 0 ? hourlyList : weatherData.hourly
                });
            } catch (err) {
                // Fall back to default
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = user?.district && user?.state ? `${user.district}, ${user.state}` : 'Your Farm';
                    fetchLiveWeather(pos.coords.latitude, pos.coords.longitude, loc);
                },
                () => {
                    // Default to Pune coordinates
                    fetchLiveWeather(18.5204, 73.8567, 'Pune, Maharashtra');
                },
                { timeout: 5000 }
            );
        } else {
            fetchLiveWeather(18.5204, 73.8567, 'Pune, Maharashtra');
        }

        return () => { isMounted = false; };
    }, [user]);

    const handleLangChange = (newLang) => {
        setSelectedLang(newLang);
        localStorage.setItem('i18nextLng', newLang);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-12">
            {/* 1. Header with greeting, farm status, location, date, language, notification, profile and weather summary */}
            <DashboardHeader
                user={user}
                weatherData={weatherData}
                selectedLang={selectedLang}
                onLangChange={handleLangChange}
            />

            {/* 2. Disease Detection (Primary Feature) + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-7 flex">
                    <DiseaseDetectionCard recentScan={recentScan} />
                </div>
                <div className="lg:col-span-5 flex">
                    <QuickActions />
                </div>
            </div>

            {/* 3. Weather Forecast + Market Prices + Recent Activity (3-Column Row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                <div className="flex">
                    <WeatherForecastCard weatherData={weatherData} />
                </div>
                <div className="flex">
                    <MarketPricesCard />
                </div>
                <div className="flex md:col-span-2 lg:col-span-1">
                    <RecentActivityCard />
                </div>
            </div>

            {/* 4. Community Discussions (Full-Width Card Near Bottom) */}
            <div>
                <CommunityDiscussionsCard />
            </div>
        </div>
    );
};

export default Dashboard;
