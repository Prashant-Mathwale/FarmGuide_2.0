const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Scheme = require('../models/Scheme');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedData = [
    {
        name: "Pradhan Mantri Krishi Sinchayee Yojana - Per Drop More Crop",
        slug: "pmksy-per-drop-more-crop",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51AC7B56240D6D84F28",
        eligibility: {
            max_area_hectare: 5,
            requires: ["AADHAAR", "7_12", "8_A", "ELECTRICITY_CONNECTION"],
            category: {
                SMALL_MARGINAL: { subsidy_percent: 55 },
                OTHER: { subsidy_percent: 45 }
            }
        },
        documents: [
            "Aadhaar Card",
            "7/12 Certificate",
            "8-A Certificate",
            "Electricity Bill"
        ]
    },
    {
        name: "Sub-mission on Farm Mechanization",
        slug: "farm-mechanization",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51A23C0254248DAFF28",
        conditions: {
            requires_aadhaar: true,
            requires_7_12: true,
            requires_8_a: true,
            same_component_reapplication_years: 10,
            component_rule: "TRACTOR_OR_EQUIPMENT"
        },
        documents: [
            "Aadhaar Card",
            "7/12 Certificate",
            "8-A Certificate",
            "Equipment Quotation",
            "Testing Certificate",
            "Self Declaration",
            "Pre Sanction Letter"
        ]
    },
    {
        name: "Magel Tyala Shettale (Chief Minister Sustainable Agriculture Irrigation Scheme)",
        slug: "magel-tyala-shettale",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MYSCHEME",
        official_source_url: "https://www.myscheme.gov.in/hi/schemes/chief-minister-sustainable-agriculture-irrigation-scheme",
        rules: {
            konkan: { min_land_hectare: 0.20 },
            other_maharashtra: { min_land_hectare: 0.40 }
        },
        benefit: {
            min: 14433,
            max: 75000,
            currency: "INR"
        }
    },
    {
        name: "Rainfed Area Development Programme",
        slug: "rainfed-area-development",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51A1DD809A4CDCCB84A",
        conditions: {
            mandatory_agristack: true,
            farm_size_limit: false,
            districts: "ALL_34"
        }
    }
];

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGO_URI is not set in .env');
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log('MongoDB Connected...');

        await Scheme.deleteMany({});
        console.log('Old schemes removed.');

        await Scheme.insertMany(seedData);
        console.log('Seed data inserted successfully!');

        process.exit();
    } catch (err) {
        console.error('Error importing data:', err.message);
        process.exit(1);
    }
};

connectDB();
