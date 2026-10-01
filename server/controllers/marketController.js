const axios = require('axios');
const MarketData = require('../models/MarketData');

const getMarketPrices = async (req, res) => {
    const { cropName, stateName, districtName } = req.query;
    const apiUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    const apiKey = process.env.DATA_GOV_API_KEY;

    try {
        const cacheWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const prices = await MarketData.find({
            ...(cropName    && { cropName:     new RegExp(cropName, 'i') }),
            ...(stateName   && { stateName:    new RegExp(stateName, 'i') }),
            ...(districtName && { districtName: new RegExp(districtName, 'i') }),
            createdAt: { $gte: cacheWindow }
        });

        if (prices.length > 0) return res.json({ success: true, source: 'cache', data: prices });

        const toTitleCase = (str) => !str ? '' : str.trim().toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const params = { 'api-key': apiKey.trim(), format: 'json', limit: 50 };

        if (stateName)    params['filters[state]']     = toTitleCase(stateName);
        if (districtName) params['filters[district]']  = toTitleCase(districtName);
        if (cropName)     params['filters[commodity]'] = toTitleCase(cropName);

        const response = await axios.get(apiUrl, { params });

        if (response.data?.records?.length > 0) {
            const parseDate = (d) => { if (!d) return new Date(); const p = d.split('/'); return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]) : new Date(d); };
            const newPrices = response.data.records.map(record => ({
                cropName:     record.commodity, marketName:   record.market, districtName: record.district,
                stateName:    record.state, minPrice:     parseInt(record.min_price), maxPrice:     parseInt(record.max_price),
                modalPrice:   parseInt(record.modal_price), recordedDate: parseDate(record.arrival_date)
            }));
            MarketData.insertMany(newPrices).catch(() => {});
            return res.json({ success: true, source: 'api', data: newPrices });
        }
        return res.json({ success: true, source: 'api', data: [], message: 'No records found for current filters.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Market prices unavailable.' });
    }
};

const getMarketTrend = async (req, res) => {
    try {
        const crop = req.query.crop || 'wheat';
        const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const pythonApiRes = await axios.post(`${mlUrl}/price_trend`, { crop });
        if (pythonApiRes.data.success) return res.json({ success: true, data: pythonApiRes.data });
        throw new Error(pythonApiRes.data.message || 'ML Server trend failure');
    } catch (error) {
        res.status(500).json({ success: false, message: 'Market trend unavailable.' });
    }
};

module.exports = { getMarketPrices, getMarketTrend };
