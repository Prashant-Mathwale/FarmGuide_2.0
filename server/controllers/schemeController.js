const Scheme = require('../models/Scheme');

// Basic rules engine evaluation function
function evaluateScheme(farmer, scheme) {
    let score = 100;
    let status = 'LIKELY_MATCH';
    const matched = [];
    const needs_verification = [];

    // Basic State Match
    if (scheme.state && farmer.state && scheme.state.toLowerCase() === farmer.state.toLowerCase()) {
        matched.push(scheme.state);
    } else if (scheme.state && farmer.state) {
        return { match: 'INELIGIBLE', score: 0 };
    }

    if (farmer.land_acres) {
        matched.push('Agricultural land');
        // Convert acres to hectares
        const hectares = farmer.land_acres * 0.404686;
        
        if (scheme.eligibility && scheme.eligibility.max_area_hectare) {
            if (hectares > scheme.eligibility.max_area_hectare) {
                 return { match: 'INELIGIBLE', score: 0, reason: 'Land exceeds maximum allowed area' };
            }
        }
    }

    // Add generic verifications based on documents and conditions
    if (scheme.documents && scheme.documents.length > 0) {
        needs_verification.push('Required documents');
    }
    
    needs_verification.push('Previous benefit history');
    needs_verification.push('Current application availability');
    matched.push('Applicable farmer profile');

    return {
        match: status,
        scheme: scheme.name,
        score: score,
        matched: matched,
        needs_verification: needs_verification,
        details: scheme
    };
}

exports.matchSchemes = async (req, res) => {
    try {
        const farmer = req.body;
        
        // Find ACTIVE schemes for the farmer's state (if state provided)
        let query = { status: 'ACTIVE' };
        if (farmer.state) {
            query.state = new RegExp('^' + farmer.state + '$', 'i');
        }

        const activeSchemes = await Scheme.find(query).lean();
        
        const results = activeSchemes
            .map(scheme => evaluateScheme(farmer, scheme))
            .filter(result => result.match !== 'INELIGIBLE')
            .sort((a, b) => b.score - a.score);

        res.status(200).json({ 
            success: true,
            count: results.length, 
            schemes: results 
        });
    } catch (error) {
        console.error('Error in matchSchemes:', error);
        res.status(500).json({ success: false, message: 'Server error matching schemes' });
    }
};

exports.getAllSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find().lean();
        res.status(200).json({ success: true, count: schemes.length, schemes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching schemes' });
    }
};
