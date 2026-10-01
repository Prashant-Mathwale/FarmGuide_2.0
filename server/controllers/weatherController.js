const axios = require('axios');

const getWeatherForecast = async (req, res) => {
    const { city, lat, lon } = req.query;
    console.log(`[Weather] Requesting weather for: ${city || 'Pune'}`);

    const apiKey = process.env.OPENWEATHER_API_KEY;

    try {
        if (!apiKey || apiKey === 'your_openweathermap_api_key_here' || apiKey === '') {
            // Return mock data if API key is not configured
            return res.json({
                success: true,
                source: 'mock',
                current: {
                    temp: 28,
                    humidity: 65,
                    windSpeed: 4.5,
                    description: 'scattered clouds',
                    icon: '03d'
                },
                forecast: [
                    { date: new Date(Date.now() + 86400000).toISOString(), temp: 29, description: 'clear sky' },
                    { date: new Date(Date.now() + 2 * 86400000).toISOString(), temp: 30, description: 'few clouds' },
                    { date: new Date(Date.now() + 3 * 86400000).toISOString(), temp: 27, description: 'light rain' },
                    { date: new Date(Date.now() + 4 * 86400000).toISOString(), temp: 26, description: 'moderate rain' },
                    { date: new Date(Date.now() + 5 * 86400000).toISOString(), temp: 28, description: 'scattered clouds' }
                ],
                location: city || 'Pune'
            });
        }

        // Fetch current weather
        let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`;
        // Fetch 5-day forecast
        let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?appid=${apiKey}&units=metric`;

        if (lat && lon) {
            weatherUrl += `&lat=${lat}&lon=${lon}`;
            forecastUrl += `&lat=${lat}&lon=${lon}`;
        } else if (city) {
            weatherUrl += `&q=${city}`;
            forecastUrl += `&q=${city}`;
        } else {
            // Default to Pune
            weatherUrl += `&q=Pune`;
            forecastUrl += `&q=Pune`;
        }

        const [weatherRes, forecastRes] = await Promise.all([
            axios.get(weatherUrl),
            axios.get(forecastUrl)
        ]);

        const current = weatherRes.data;
        const forecastData = forecastRes.data;

        // Extract one forecast per day (forecast API returns 3-hour intervals)
        const dailyForecasts = [];
        const seenDates = new Set();

        for (const item of forecastData.list) {
            const date = item.dt_txt.split(' ')[0];
            if (!seenDates.has(date) && date !== new Date().toISOString().split('T')[0]) {
                seenDates.add(date);
                dailyForecasts.push({
                    date: date,
                    temp: Math.round(item.main.temp),
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                });
            }
            if (dailyForecasts.length === 5) break;
        }

        res.json({
            success: true,
            source: 'api',
            current: {
                temp: Math.round(current.main.temp),
                humidity: current.main.humidity,
                windSpeed: current.wind.speed,
                description: current.weather[0].description,
                icon: current.weather[0].icon
            },
            forecast: dailyForecasts,
            location: current.name
        });

    } catch (error) {
        if (error.response) {
            console.error("Weather API Error Details:", {
                status: error.response.status,
                data: error.response.data,
                url: error.config.url
            });
        } else {
            console.error("Weather API Error:", error.message);
        }
        res.status(500).json({ success: false, message: 'Failed to fetch weather data. ' + (error.response?.data?.message || '') });
    }
};

module.exports = { getWeatherForecast };
