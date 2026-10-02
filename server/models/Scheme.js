const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    level: { type: String, required: true, default: 'STATE' },
    state: { type: String, required: true },
    department: { type: String },
    description: { type: String },
    benefit_description: { type: String },
    application_url: { type: String },
    official_source_url: { type: String, required: true },
    source_type: { type: String, default: 'MAHADBT' },
    status: { type: String, default: 'ACTIVE' },
    last_verified_at: { type: Date, default: Date.now },
    
    // Eligibility conditions mapped from JSONB-like structure
    eligibility: { type: mongoose.Schema.Types.Mixed, default: {} },
    conditions: { type: mongoose.Schema.Types.Mixed, default: {} },
    rules: { type: mongoose.Schema.Types.Mixed, default: {} },
    benefit: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    documents: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);
