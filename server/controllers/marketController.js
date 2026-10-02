const axios = require('axios');
const MarketData = require('../models/MarketData');

const AGMARKNET_BASE = "https://api.agmarknet.gov.in/v1";
const AGMARKNET_HEADERS = {
  Accept: "application/json, text/plain, */*",
  Origin: "https://agmarknet.gov.in",
  Referer: "https://agmarknet.gov.in/",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
};

const agmarknet = axios.create({
  baseURL: AGMARKNET_BASE,
  timeout: 30000,
  headers: AGMARKNET_HEADERS,
});

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  const candidates = [response.data, response.records, response.states, response.markets, response.commodities, response.result];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

async function getFilters() {
  const response = await agmarknet.get("/daily-price-arrival/filters");
  return response.data;
}

function findByName(items, requestedName) {
  if (!requestedName || !Array.isArray(items)) return null;
  const target = normalize(requestedName);
  
  // Exact match
  let match = items.find((item) => {
    const names = [item.name, item.stateName, item.state_name, item.marketName, item.market_name, item.mkt_name, item.commodityName, item.commodity_name, item.cmdt_name, item.label, item.title];
    return names.some((name) => normalize(name) === target);
  });
  if (match) return match;
  
  // Substring match
  return items.find((item) => {
    const names = [item.name, item.stateName, item.state_name, item.marketName, item.market_name, item.mkt_name, item.commodityName, item.commodity_name, item.cmdt_name, item.label, item.title];
    return names.some((name) => normalize(name).includes(target));
  });
}

function getId(item) {
  if (!item) return null;
  return item.id ?? item.stateId ?? item.state_id ?? item.marketId ?? item.market_id ?? item.mkt_id ?? item.commodityId ?? item.commodity_id ?? item.cmdt_id ?? null;
}

async function resolveIds({ commodityName, stateName, marketName }) {
  const filters = await getFilters();
  const root = filters?.data || filters;
  const commodities = root?.cmdt_data || root?.commodity_data || root?.commodities || root?.commodityData || [];
  const states = root?.state_data || root?.states || root?.stateData || [];
  const markets = root?.market_data || root?.markets || root?.marketData || [];

  const commodity = findByName(commodities, commodityName);
  const state = findByName(states, stateName);
  let market = findByName(markets, marketName);

  if (!market && commodity && marketName) {
    const commodityId = getId(commodity);
    if (commodityId) {
        const response = await agmarknet.get(`/list-comm/${commodityId}`);
        const context = response.data?.data || response.data;
        const contextMarkets = context?.market_data || context?.markets || context?.marketData || [];
        market = findByName(contextMarkets, marketName);
    }
  }
  return { commodityId: getId(commodity), stateId: getId(state), marketId: getId(market) };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchDailyReport({ date, marketId, stateId }) {
  const payload = { date, includeExcel: false };
  if (marketId) payload.marketIds = [Number(marketId)];
  if (stateId) payload.stateIds = [Number(stateId)];
  const response = await agmarknet.post("/prices-and-arrivals/market-report/daily", payload);
  return response.data;
}

async function findLatestReport({ marketId, stateId, daysBack = 30 }) {
  const today = new Date();
  for (let i = 0; i <= daysBack; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = formatDate(date);
    try {
      const result = await fetchDailyReport({ date: dateString, marketId, stateId });
      const records = extractArray(result);
      if (records.length > 0) return { date: dateString, records, raw: result };
    } catch (error) {}
  }
  return null;
}

const getMarketPrices = async (req, res) => {
    try {
        const { cropName, stateName, marketName } = req.query;

        if (!cropName && !stateName && !marketName) {
             return res.json({ success: true, source: 'api', data: [] });
        }

        const ids = await resolveIds({ commodityName: cropName, stateName: stateName, marketName: marketName });

        if (!ids.commodityId && cropName) {
            return res.json({ success: true, source: 'api', data: [], message: 'Commodity not found' });
        }

        const latest = await findLatestReport({ marketId: ids.marketId, stateId: ids.stateId, daysBack: 30 });

        if (!latest) {
            return res.json({ success: true, source: 'api', data: [], message: 'No records found for current filters in last 30 days.' });
        }

        const targetCommodity = normalize(cropName);
        let matchingRecords = latest.records;
        
        if (targetCommodity) {
            matchingRecords = latest.records.filter((item) => {
                const name = item.commodityName || item.commodity || item.Commodity || item.name;
                return normalize(name).includes(targetCommodity);
            });
        }

        if (matchingRecords.length === 0 && cropName) {
            return res.json({ success: true, source: 'api', data: [], message: 'No matching commodity in recent reports.' });
        }

        const formattedData = matchingRecords.map(record => {
            const minPrice = record.min_price ?? record.minPrice ?? record.MinPrice ?? null;
            const maxPrice = record.max_price ?? record.maxPrice ?? record.MaxPrice ?? null;
            const modalPrice = record.modal_price ?? record.modalPrice ?? record.ModalPrice ?? null;
            const cName = record.commodityName || record.commodity || record.Commodity || record.name || cropName;
            const mName = record.marketName || record.market || record.Market || marketName || 'Unknown Mandi';
            const sName = record.stateName || record.state || record.State || stateName || 'Unknown State';
            const dName = record.districtName || record.district || record.District || 'Regional';
            
            return {
                cropName: cName,
                marketName: mName,
                districtName: dName,
                stateName: sName,
                minPrice: parseInt(minPrice) || 0,
                maxPrice: parseInt(maxPrice) || 0,
                modalPrice: parseInt(modalPrice) || 0,
                recordedDate: latest.date
            };
        });

        MarketData.insertMany(formattedData).catch(() => {});

        return res.json({ success: true, source: 'api', data: formattedData });
    } catch (error) {
        console.error("AGMARKNET error:", error.response?.data || error.message);
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
