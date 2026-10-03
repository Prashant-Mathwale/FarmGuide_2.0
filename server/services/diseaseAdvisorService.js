/**
 * diseaseAdvisorService.js — Rule-based Disease Advisor Service for FarmGuide
 *
 * Implements the curated Maharashtra Knowledge Base:
 * 1. locations_maharashtra.csv: 36 Maharashtra districts + agro-regions + coordinates
 * 2. crops.csv: Maharashtra-relevant crop master (36 crops)
 * 3. crop_aliases.csv: local Marathi/common aliases (tamatar, batata, kapus, etc.)
 * 4. diseases.csv: 111 disease condition master entries
 * 5. regional_disease_rules.csv: 530 curated regional rules
 * 6. weather_rules.csv: 8 normalized weather condition rules
 *
 * Grounded against: Dr. PDKV Akola, MPKV Rahuri, VNMKV Parbhani, and ICAR Maharashtra Advisories.
 */

const fs = require('fs');
const path = require('path');

// Safe CSV parser handling quoted commas, multiline entries, escaped quotes
function parseCSV(text) {
    if (!text) return [];
    const lines = [];
    let row = [];
    let curr = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                curr += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push(curr.trim());
            curr = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(curr.trim());
            if (row.some(x => x.length > 0)) lines.push(row);
            row = [];
            curr = '';
        } else {
            curr += c;
        }
    }
    if (curr.length > 0 || row.length > 0) {
        row.push(curr.trim());
        if (row.some(x => x.length > 0)) lines.push(row);
    }
    if (lines.length === 0) return [];
    const header = lines[0].map(h => h.trim());
    return lines.slice(1).map(line => {
        const obj = {};
        header.forEach((h, idx) => {
            obj[h] = line[idx] !== undefined ? line[idx] : '';
        });
        return obj;
    });
}

class DiseaseAdvisorService {
    constructor() {
        this.crops = [];
        this.cropsMap = new Map();
        this.aliasesMap = new Map();
        this.districts = [];
        this.districtsMap = new Map();
        this.agroRegions = [];
        this.diseases = [];
        this.diseasesMap = new Map();
        this.regionalRules = [];
        this.weatherRules = [];
        this.isLoaded = false;

        this.init();
    }

    findDatasetDir() {
        const candidates = [
            path.resolve(__dirname, '../data/advisor'),
            path.resolve(__dirname, '../../FarmGuide_Disease_Advisor_Large_Dataset'),
            path.resolve(__dirname, '../FarmGuide_Disease_Advisor_Large_Dataset')
        ];
        for (const dir of candidates) {
            if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'crops.csv'))) {
                return dir;
            }
        }
        return null;
    }

    init() {
        try {
            const dataDir = this.findDatasetDir();
            if (!dataDir) {
                console.warn('[DiseaseAdvisor] Dataset directory not found. Advisor will run with empty datasets.');
                return;
            }

            const readCsv = (filename) => {
                const filePath = path.join(dataDir, filename);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return parseCSV(content);
                }
                return [];
            };

            // 1. Crops
            const rawCrops = readCsv('crops.csv');
            this.crops = rawCrops.map(c => ({
                crop_id: c.crop_id,
                crop: c.crop,
                scientific_name: c.scientific_name,
                category: c.category,
                common_seasons: c.common_seasons,
                source_org: c.source_org,
                source_url: c.source_url,
                aliases: []
            }));

            this.cropsMap.clear();
            this.crops.forEach(c => {
                const norm = c.crop.toLowerCase().trim();
                this.cropsMap.set(norm, c);
            });

            // 2. Crop Aliases (Marathi / local names)
            const rawAliases = readCsv('crop_aliases.csv');
            this.aliasesMap.clear();
            rawAliases.forEach(a => {
                const normAlias = a.alias.toLowerCase().trim();
                const normCrop = a.crop.toLowerCase().trim();
                this.aliasesMap.set(normAlias, a.crop);

                const cropObj = this.cropsMap.get(normCrop);
                if (cropObj && !cropObj.aliases.includes(a.alias)) {
                    cropObj.aliases.push(a.alias);
                }
            });

            // 3. Locations Maharashtra (36 districts)
            const rawLocations = readCsv('locations_maharashtra.csv');
            this.districts = rawLocations.map(d => ({
                district: d.district,
                state: d.state || 'Maharashtra',
                agro_region: d.agro_region,
                latitude: parseFloat(d.latitude) || 0,
                longitude: parseFloat(d.longitude) || 0,
                country: d.country || 'India'
            }));

            this.districtsMap.clear();
            const agroSet = new Set();
            this.districts.forEach(d => {
                this.districtsMap.set(d.district.toLowerCase().trim(), d);
                if (d.agro_region) agroSet.add(d.agro_region);
            });
            this.agroRegions = Array.from(agroSet).sort();

            // 4. Disease Master
            const rawDiseases = readCsv('diseases.csv');
            this.diseases = rawDiseases.map(d => ({
                disease_id: d.disease_id,
                crop: d.crop,
                disease: d.disease,
                disease_type: d.disease_type,
                model_supported: String(d.model_supported).toLowerCase() === 'true',
                current_model_note: d.current_model_note,
                temp_min_c: parseFloat(d.temp_min_c) || 0,
                temp_max_c: parseFloat(d.temp_max_c) || 45,
                humidity_min_pct: parseFloat(d.humidity_min_pct) || 0,
                humidity_max_pct: parseFloat(d.humidity_max_pct) || 100,
                rainfall_trigger: d.rainfall_trigger,
                leaf_wetness: d.leaf_wetness,
                symptoms: d.symptoms,
                management_note: d.management_note,
                source_org: d.source_org,
                source_url: d.source_url
            }));

            this.diseasesMap.clear();
            this.diseases.forEach(d => {
                const key = `${d.crop.toLowerCase().trim()}_${d.disease.toLowerCase().trim()}`;
                this.diseasesMap.set(key, d);
            });

            // 5. Regional Disease Rules
            const rawRules = readCsv('regional_disease_rules.csv');
            this.regionalRules = rawRules.map(r => ({
                rule_id: r.rule_id,
                crop: r.crop,
                disease: r.disease,
                disease_type: r.disease_type,
                model_supported: String(r.model_supported).toLowerCase() === 'true',
                state: r.state || 'Maharashtra',
                agro_region: r.agro_region,
                district_scope: r.district_scope,
                season: r.season,
                month_window: r.month_window,
                temp_min_c: parseFloat(r.temp_min_c) || 0,
                temp_max_c: parseFloat(r.temp_max_c) || 45,
                humidity_min_pct: parseFloat(r.humidity_min_pct) || 0,
                humidity_max_pct: parseFloat(r.humidity_max_pct) || 100,
                rainfall_trigger: r.rainfall_trigger,
                leaf_wetness: r.leaf_wetness,
                risk_level: (r.risk_level || 'medium').toLowerCase(),
                weather_reason: r.weather_reason,
                symptoms: r.symptoms,
                management_note: r.management_note,
                source_org: r.source_org,
                source_url: r.source_url,
                verification_status: r.verification_status
            }));

            // 6. Weather Rules
            const rawWeatherRules = readCsv('weather_rules.csv');
            this.weatherRules = rawWeatherRules.map(w => ({
                rule_id: w.rule_id,
                weather_pattern: w.weather_pattern,
                relevance: w.relevance,
                trigger: w.trigger,
                action: w.action,
                risk_level: (w.risk_level || 'medium').toLowerCase(),
                source_org: w.source_org,
                source_url: w.source_url
            }));

            this.isLoaded = true;
            console.log(`[DiseaseAdvisor] Successfully loaded: ${this.crops.length} crops, ${this.districts.length} districts, ${this.diseases.length} diseases, ${this.regionalRules.length} regional rules, ${this.weatherRules.length} weather rules.`);
        } catch (err) {
            console.error('[DiseaseAdvisor] Initialization error:', err);
            this.isLoaded = false;
        }
    }

    // Resolve user input or alias to canonical crop name
    resolveCrop(input) {
        if (!input || typeof input !== 'string') return null;
        const norm = input.toLowerCase().trim();

        // Direct crop name match
        if (this.cropsMap.has(norm)) {
            return this.cropsMap.get(norm).crop;
        }

        // Alias match (e.g. tamatar, batata, mirchi, kapus)
        if (this.aliasesMap.has(norm)) {
            return this.aliasesMap.get(norm);
        }

        // Substring or fuzzy check in crop names
        for (const [key, cropObj] of this.cropsMap.entries()) {
            if (key.includes(norm) || norm.includes(key)) {
                return cropObj.crop;
            }
        }

        // Substring check in aliases
        for (const [alias, canonical] of this.aliasesMap.entries()) {
            if (alias.includes(norm) || norm.includes(alias)) {
                return canonical;
            }
        }

        return null;
    }

    // Resolve district by name or approximate by coordinates
    resolveDistrict(districtName, lat, lon) {
        if (districtName && typeof districtName === 'string') {
            const norm = districtName.toLowerCase().trim();
            if (this.districtsMap.has(norm)) {
                return this.districtsMap.get(norm);
            }
            for (const [key, distObj] of this.districtsMap.entries()) {
                if (key.includes(norm) || norm.includes(key)) {
                    return distObj;
                }
            }
        }

        // Geolocation fallback
        if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
            let closest = null;
            let minDist = Infinity;
            for (const d of this.districts) {
                const dist = Math.hypot(d.latitude - lat, d.longitude - lon);
                if (dist < minDist) {
                    minDist = dist;
                    closest = d;
                }
            }
            return closest;
        }

        // Fallback default: Pune (Western Maharashtra Plain)
        return this.districtsMap.get('pune') || this.districts[0] || null;
    }

    // Check if month falls in window (e.g. "6-10" or "11-3" or "all")
    isMonthInWindow(month, windowStr) {
        if (!windowStr || windowStr.toLowerCase() === 'all' || windowStr.trim() === '') return true;
        if (!month || isNaN(month)) return true;
        const parts = windowStr.split('-').map(p => parseInt(p.trim(), 10));
        if (parts.length === 1 && !isNaN(parts[0])) return month === parts[0];
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const [start, end] = parts;
            if (start <= end) {
                return month >= start && month <= end;
            } else {
                return month >= start || month <= end;
            }
        }
        return true;
    }

    // Evaluate weather rules (WR001-WR008) against current weather
    evaluateWeatherRules(temp, humidity, rainfall, isRaining) {
        const activeAlerts = [];
        const t = typeof temp === 'number' ? temp : null;
        const h = typeof humidity === 'number' ? humidity : null;
        const r = typeof rainfall === 'number' ? rainfall : (isRaining ? 10 : 0);

        for (const rule of this.weatherRules) {
            let triggered = false;
            let conditionDetails = '';

            switch (rule.rule_id) {
                case 'WR001': // Very high humidity + cool temperatures
                    if (h !== null && h >= 80 && t !== null && t >= 10 && t <= 26) {
                        triggered = true;
                        conditionDetails = `High relative humidity (${h}%) and cool temperature (${t}°C) prolong leaf surface wetness.`;
                    }
                    break;
                case 'WR002': // Warm + humid canopy
                    if (h !== null && h >= 70 && t !== null && t >= 20 && t <= 33) {
                        triggered = true;
                        conditionDetails = `Warm temperature (${t}°C) coupled with high humidity (${h}%) accelerates fungal spore germination.`;
                    }
                    break;
                case 'WR003': // Warm + vector-favorable weather
                    if (t !== null && t >= 20 && t <= 34 && h !== null && h >= 45 && h <= 80 && r <= 2) {
                        triggered = true;
                        conditionDetails = `Moderate warm dry-to-humid condition (${t}°C) favors aphid/whitefly vector proliferation.`;
                    }
                    break;
                case 'WR004': // Hot + moisture stress
                    if (t !== null && t >= 30 && h !== null && h <= 45) {
                        triggered = true;
                        conditionDetails = `High temperature (${t}°C) and low atmospheric moisture (${h}%) trigger soil and plant moisture stress.`;
                    }
                    break;
                case 'WR005': // Rain splash / saturated canopy
                    if ((r > 0 || isRaining) && h !== null && h >= 70) {
                        triggered = true;
                        conditionDetails = `Rain splash and dense humidity (${h}%) disperse bacterial exudates across leaves.`;
                    }
                    break;
                case 'WR006': // Cool humid winter crop canopy
                    if (t !== null && t >= 10 && t <= 25 && h !== null && h >= 68) {
                        triggered = true;
                        conditionDetails = `Cool winter condition (${t}°C, ${h}% RH) promotes downy/powdery mildew and rusts.`;
                    }
                    break;
                case 'WR007': // Waterlogging
                    if (r >= 20 || (r >= 10 && h !== null && h >= 85)) {
                        triggered = true;
                        conditionDetails = `Heavy rainfall / saturated root zone (${r} mm) increases risk of Phytophthora / root rot.`;
                    }
                    break;
                case 'WR008': // Dry foliage + humid nights
                    if (h !== null && h >= 50 && h <= 85 && r <= 0.5) {
                        triggered = true;
                        conditionDetails = `Humid nights with dry daytime foliage favor powdery mildew conidial dispersal.`;
                    }
                    break;
            }

            if (triggered) {
                activeAlerts.push({
                    rule_id: rule.rule_id,
                    pattern: rule.weather_pattern,
                    relevance: rule.relevance,
                    action: rule.action,
                    risk_level: rule.risk_level,
                    condition_details: conditionDetails,
                    source_url: rule.source_url
                });
            }
        }

        return activeAlerts;
    }

    // Core Advisory Engine
    getAdvisory({ crop, district, latitude, longitude, temperature, humidity, rainfall, isRaining, month }) {
        if (!this.isLoaded) {
            this.init();
        }

        // 1. Resolve crop
        const canonicalCrop = this.resolveCrop(crop);
        if (!canonicalCrop) {
            return {
                success: false,
                message: `Crop "${crop}" is not currently in the Maharashtra regional knowledge base. Available crops include Tomato, Potato, Chilli, Cotton, Soybean, Onion, Grapes, Pomegranate, etc.`
            };
        }

        // 2. Resolve location & agro-region
        const locationInfo = this.resolveDistrict(district, latitude, longitude);
        const agroRegion = locationInfo?.agro_region || 'Western Maharashtra Plain';
        const districtName = locationInfo?.district || 'Maharashtra';

        // 3. Resolve weather & timing parameters
        const temp = typeof temperature === 'number' ? temperature : (parseFloat(temperature) || 28.0);
        const hum = typeof humidity === 'number' ? humidity : (parseFloat(humidity) || 70.0);
        const rain = typeof rainfall === 'number' ? rainfall : (parseFloat(rainfall) || 0.0);
        const wet = isRaining === true || isRaining === 'true' || rain > 0;
        const currentMonth = month ? parseInt(month, 10) : (new Date().getMonth() + 1);

        // 4. Match regional rules for this crop
        let matchingRules = this.regionalRules.filter(r => {
            const cropMatch = r.crop.toLowerCase() === canonicalCrop.toLowerCase();
            const regionMatch = r.agro_region.toLowerCase() === agroRegion.toLowerCase();
            return cropMatch && regionMatch;
        });

        // Fallback: If no rules match the specific agro-region, check state-wide rules for that crop
        if (matchingRules.length === 0) {
            matchingRules = this.regionalRules.filter(r => r.crop.toLowerCase() === canonicalCrop.toLowerCase());
        }

        // Second fallback: disease master rows for this crop if regional rules are sparse
        if (matchingRules.length === 0) {
            const masterDiseases = this.diseases.filter(d => d.crop.toLowerCase() === canonicalCrop.toLowerCase());
            matchingRules = masterDiseases.map(d => ({
                rule_id: `FALLBACK_${d.disease_id}`,
                crop: d.crop,
                disease: d.disease,
                disease_type: d.disease_type,
                model_supported: d.model_supported,
                agro_region: agroRegion,
                temp_min_c: d.temp_min_c,
                temp_max_c: d.temp_max_c,
                humidity_min_pct: d.humidity_min_pct,
                humidity_max_pct: d.humidity_max_pct,
                rainfall_trigger: d.rainfall_trigger,
                leaf_wetness: d.leaf_wetness,
                risk_level: 'medium',
                weather_reason: `General Maharashtra weather window favorable for ${d.disease}.`,
                symptoms: d.symptoms,
                management_note: d.management_note,
                source_org: d.source_org,
                source_url: d.source_url,
                verification_status: d.verification_status
            }));
        }

        // 5. Score and rank rules
        const scoredDiseases = matchingRules.map(rule => {
            let score = 0;
            const matchDetails = [];

            // A. Temperature match (30 max)
            const tMin = rule.temp_min_c;
            const tMax = rule.temp_max_c;
            if (temp >= tMin && temp <= tMax) {
                score += 30;
                matchDetails.push(`Temperature (${temp}°C) is in optimal disease range (${tMin}–${tMax}°C)`);
            } else if (temp >= tMin - 3 && temp <= tMax + 3) {
                score += 15;
                matchDetails.push(`Temperature (${temp}°C) is borderline near disease threshold (${tMin}–${tMax}°C)`);
            }

            // B. Humidity match (30 max)
            const hMin = rule.humidity_min_pct;
            const hMax = rule.humidity_max_pct;
            if (hum >= hMin && hum <= hMax) {
                score += 30;
                matchDetails.push(`Relative humidity (${hum}%) satisfies disease window (${hMin}–${hMax}%)`);
            } else if (hum >= hMin - 10 && hum <= hMax + 10) {
                score += 15;
                matchDetails.push(`Relative humidity (${hum}%) is near disease threshold (${hMin}–${hMax}%)`);
            }

            // C. Month / Season window (20 max)
            const inMonthWindow = this.isMonthInWindow(currentMonth, rule.month_window);
            if (inMonthWindow) {
                score += 20;
                matchDetails.push(`Current month (${currentMonth}) falls within Maharashtra high-incidence window (${rule.month_window || 'all seasons'})`);
            }

            // D. Rainfall / Leaf wetness condition (15 max)
            const triggerText = (rule.rainfall_trigger || '').toLowerCase();
            const leafWetness = (rule.leaf_wetness || '').toLowerCase();
            if (wet) {
                if (triggerText.includes('rain') || triggerText.includes('splash') || triggerText.includes('wet') || leafWetness.includes('high')) {
                    score += 15;
                    matchDetails.push(`Rainfall/leaf-wetness condition matches trigger: "${rule.rainfall_trigger}"`);
                } else {
                    score += 5;
                }
            } else {
                if (triggerText.includes('dry') || leafWetness.includes('low') || leafWetness.includes('medium')) {
                    score += 12;
                    matchDetails.push(`Dry foliage condition matches trigger: "${rule.rainfall_trigger}"`);
                }
            }

            // E. Curated Base Risk Level Weight (15 max)
            if (rule.risk_level === 'high') score += 15;
            else if (rule.risk_level === 'medium-high') score += 10;
            else score += 5;

            // Normalize score to 100 max
            const finalScore = Math.min(100, Math.round((score / 110) * 100));

            let advisoryLevel = 'Low';
            if (finalScore >= 68) advisoryLevel = 'High';
            else if (finalScore >= 45) advisoryLevel = 'Medium';

            return {
                rule_id: rule.rule_id,
                disease: rule.disease,
                disease_type: rule.disease_type,
                model_supported: Boolean(rule.model_supported),
                advisory_score: finalScore,
                advisory_level: advisoryLevel,
                temp_range: `${rule.temp_min_c}°C – ${rule.temp_max_c}°C`,
                humidity_range: `${rule.humidity_min_pct}% – ${rule.humidity_max_pct}%`,
                rainfall_trigger: rule.rainfall_trigger,
                leaf_wetness: rule.leaf_wetness,
                weather_reason: rule.weather_reason,
                symptoms: rule.symptoms,
                management_note: rule.management_note,
                match_reasons: matchDetails,
                season: rule.season,
                source_org: rule.source_org,
                source_url: rule.source_url
            };
        });

        // Deduplicate diseases (keep the highest advisory score if multiple regional rules exist for the same disease)
        const diseaseMap = new Map();
        scoredDiseases.forEach(d => {
            const key = d.disease.toLowerCase();
            if (!diseaseMap.has(key) || diseaseMap.get(key).advisory_score < d.advisory_score) {
                diseaseMap.set(key, d);
            }
        });

        const sortedDiseases = Array.from(diseaseMap.values()).sort((a, b) => b.advisory_score - a.advisory_score);

        // 6. Evaluate 8 General Weather Rules
        const weatherAlerts = this.evaluateWeatherRules(temp, hum, rain, wet);

        return {
            success: true,
            query: {
                crop: canonicalCrop,
                district: districtName,
                agro_region: agroRegion,
                temperature: temp,
                humidity: hum,
                rainfall: rain,
                is_wet: wet,
                month: currentMonth
            },
            summary: {
                total_evaluated: sortedDiseases.length,
                high_risk_count: sortedDiseases.filter(d => d.advisory_level === 'High').length,
                medium_risk_count: sortedDiseases.filter(d => d.advisory_level === 'Medium').length,
                model_supported_count: sortedDiseases.filter(d => d.model_supported).length
            },
            diseases_to_watch: sortedDiseases,
            weather_alerts: weatherAlerts,
            safety_disclaimer: "Curated preventive guidance grounded in Maharashtra agro-advisory guidelines (Dr. PDKV, MPKV, VNMKV, ICAR). These rules indicate advisory relevance under favorable weather, NOT field prevalence measurements. Do not spray chemicals without verifying with your local Krishi Vigyan Kendra (KVK) and checking approved product labels.",
            verification: {
                status: "curated_grounded",
                basis: ["Dr. PDKV Plant Disease Guide", "MPKV Rahuri Extension", "VNMKV Parbhani Advisory", "ICAR Maharashtra Kharif Agro-Advisory"]
            }
        };
    }

    // Options for UI dropdowns and search
    getAdvisorOptions() {
        if (!this.isLoaded) {
            this.init();
        }

        return {
            success: true,
            crops: this.crops.map(c => ({
                id: c.crop_id,
                name: c.crop,
                category: c.category,
                seasons: c.common_seasons,
                aliases: c.aliases
            })),
            districts: this.districts.map(d => ({
                name: d.district,
                agro_region: d.agro_region,
                latitude: d.latitude,
                longitude: d.longitude
            })),
            agro_regions: this.agroRegions,
            weather_rules_summary: this.weatherRules.map(w => ({
                rule_id: w.rule_id,
                pattern: w.weather_pattern,
                relevance: w.relevance,
                trigger: w.trigger,
                action: w.action,
                risk_level: w.risk_level
            }))
        };
    }
}

// Singleton instance
const diseaseAdvisorService = new DiseaseAdvisorService();
module.exports = diseaseAdvisorService;
