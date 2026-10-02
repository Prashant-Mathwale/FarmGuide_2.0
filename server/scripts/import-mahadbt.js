const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Scheme = require('../models/Scheme');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedData = [
    {
        name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        slug: "pm-kisan",
        level: "CENTRAL",
        state: "All India",
        department: "Ministry of Agriculture & Farmers Welfare",
        source_type: "CENTRAL_GOVT",
        official_source_url: "https://pmkisan.gov.in/",
        eligibility: {
            max_area_hectare: 10,
            category: {
                SMALL_MARGINAL: { subsidy_percent: 100 },
                OTHER: { subsidy_percent: 100 }
            }
        },
        benefit: {
            min: 6000,
            max: 6000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Land Ownership Records (7/12 / Khatauni)",
            "Bank Account Details",
            "Mobile Number Linked to Aadhaar"
        ]
    },
    {
        name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        slug: "pmfby-crop-insurance",
        level: "CENTRAL",
        state: "All India",
        department: "Ministry of Agriculture & Farmers Welfare",
        source_type: "CENTRAL_GOVT",
        official_source_url: "https://pmfby.gov.in/",
        benefit: {
            min: 5000,
            max: 150000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Land Sowing Certificate",
            "Bank Passbook",
            "Land Possession Certificate"
        ]
    },
    {
        name: "PM-KUSUM Solar Pump Subsidy Scheme",
        slug: "pm-kusum-solar-pump",
        level: "CENTRAL",
        state: "All India",
        department: "Ministry of New and Renewable Energy",
        source_type: "CENTRAL_GOVT",
        official_source_url: "https://pmkusum.mnre.gov.in/",
        benefit: {
            min: 50000,
            max: 300000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Land Documents",
            "Bank Account Passbook",
            "Electricity Connection Status"
        ]
    },
    {
        name: "Kisan Credit Card (KCC) Low-Interest Loan Scheme",
        slug: "kisan-credit-card",
        level: "CENTRAL",
        state: "All India",
        department: "Reserve Bank of India & NABARD",
        source_type: "CENTRAL_GOVT",
        official_source_url: "https://www.myscheme.gov.in/schemes/kcc",
        benefit: {
            min: 50000,
            max: 300000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "PAN Card / Voter ID",
            "Land Revenue Receipt",
            "Passport Size Photograph"
        ]
    },
    {
        name: "Pradhan Mantri Krishi Sinchayee Yojana - Per Drop More Crop",
        slug: "pmksy-per-drop-more-crop",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51AC7B56240D6D84F28",
        benefit: {
            min: 15000,
            max: 85000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "7/12 Certificate",
            "8-A Certificate",
            "Electricity Bill"
        ]
    },
    {
        name: "Sub-mission on Farm Mechanization (SMAM)",
        slug: "farm-mechanization",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51A23C0254248DAFF28",
        benefit: {
            min: 25000,
            max: 125000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "7/12 Certificate",
            "8-A Certificate",
            "Equipment Quotation",
            "Testing Certificate"
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
        benefit: {
            min: 14433,
            max: 75000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "7/12 Record",
            "Bank Passbook"
        ]
    },
    {
        name: "UP Mukhyamantri Krishak Durghatna Kalyan Yojana",
        slug: "up-krishak-durghatna",
        level: "STATE",
        state: "Uttar Pradesh",
        department: "Department of Revenue, UP",
        source_type: "STATE_GOVT",
        official_source_url: "https://bor.up.nic.in/",
        benefit: {
            min: 50000,
            max: 500000,
            currency: "INR"
        },
        documents: [
            "Farmer Domicile Certificate",
            "Khatauni Record",
            "Bank Account Copy",
            "Aadhaar Card"
        ]
    },
    {
        name: "Mukhyamantri Fasal Bima Yojana (UP)",
        slug: "up-fasal-bima",
        level: "STATE",
        state: "Uttar Pradesh",
        department: "Agriculture Department UP",
        source_type: "STATE_GOVT",
        official_source_url: "https://upagripardarshi.gov.in/",
        benefit: {
            min: 10000,
            max: 100000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Khatauni Land Record",
            "Bank Passbook"
        ]
    },
    {
        name: "Mukhya Mantri Kheti Baadi Vikas Yojana (Punjab)",
        slug: "punjab-kheti-baadi",
        level: "STATE",
        state: "Punjab",
        department: "Department of Agriculture & Farmers Welfare, Punjab",
        source_type: "STATE_GOVT",
        official_source_url: "https://agri.punjab.gov.in/",
        benefit: {
            min: 12000,
            max: 60000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Fard / Land Record Punjab",
            "Bank Account Details"
        ]
    },
    {
        name: "Mukhyamantri Kisan Sahay Yojana (Gujarat)",
        slug: "gujarat-kisan-sahay",
        level: "STATE",
        state: "Gujarat",
        department: "Agriculture, Farmers Welfare & Co-operation Dept, Gujarat",
        source_type: "STATE_GOVT",
        official_source_url: "https://ikhedut.gujarat.gov.in/",
        benefit: {
            min: 20000,
            max: 25000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "8-A & 7/12 Land Records Gujarat",
            "Bank Account Details"
        ]
    },
    {
        name: "Mukhyamantri Solar Pump Yojana (Madhya Pradesh)",
        slug: "mp-solar-pump",
        level: "STATE",
        state: "Madhya Pradesh",
        department: "MP Urja Vikas Nigam",
        source_type: "STATE_GOVT",
        official_source_url: "https://cmsolarpump.mp.gov.in/",
        benefit: {
            min: 40000,
            max: 200000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Khasra / Khatoni MP",
            "Bank Passbook"
        ]
    },
    {
        name: "Tarbandi Yojana (Rajasthan Fencing Subsidy)",
        slug: "rajasthan-tarbandi",
        level: "STATE",
        state: "Rajasthan",
        department: "Department of Agriculture, Rajasthan",
        source_type: "STATE_GOVT",
        official_source_url: "https://rajkisan.rajasthan.gov.in/",
        benefit: {
            min: 20000,
            max: 40000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card / Jan Aadhaar",
            "Jamabandi Record",
            "Bank Passbook Copy"
        ]
    },
    {
        name: "YSR Rythu Bharosa (Andhra Pradesh)",
        slug: "ysr-rythu-bharosa",
        level: "STATE",
        state: "Andhra Pradesh",
        department: "Department of Agriculture, AP",
        source_type: "STATE_GOVT",
        official_source_url: "https://ysrrythubharosa.ap.gov.in/",
        benefit: {
            min: 13500,
            max: 13500,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Pattadar Passbook / Webland Record",
            "Ration Card",
            "Bank Account Details"
        ]
    },
    {
        name: "Rythu Bandhu Scheme (Telangana)",
        slug: "rythu-bandhu-telangana",
        level: "STATE",
        state: "Telangana",
        department: "Department of Agriculture, Telangana",
        source_type: "STATE_GOVT",
        official_source_url: "https://rythubandhu.telangana.gov.in/",
        benefit: {
            min: 10000,
            max: 50000,
            currency: "INR"
        },
        documents: [
            "Pattadar Passbook",
            "Aadhaar Card",
            "Voter ID / Bank Account"
        ]
    },
    {
        name: "KALIA Scheme (Odisha)",
        slug: "kalia-scheme-odisha",
        level: "STATE",
        state: "Odisha",
        department: "Agriculture & Farmers' Empowerment Department, Odisha",
        source_type: "STATE_GOVT",
        official_source_url: "https://kalia.odisha.gov.in/",
        benefit: {
            min: 10000,
            max: 25000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Land Record / Ration Card",
            "Bank Passbook"
        ]
    },
    {
        name: "Mukhyamantri Krishi Ashirwad Yojana (Jharkhand)",
        slug: "jharkhand-krishi-ashirwad",
        level: "STATE",
        state: "Jharkhand",
        department: "Department of Agriculture, Jharkhand",
        source_type: "STATE_GOVT",
        official_source_url: "https://mmkay.jharkhand.gov.in/",
        benefit: {
            min: 5000,
            max: 25000,
            currency: "INR"
        },
        documents: [
            "Aadhaar Card",
            "Khatian / Land Record",
            "Bank Passbook"
        ]
    },
    {
        name: "Krishi Yantra Subsidy Scheme (Bihar)",
        slug: "bihar-krishi-yantra",
        level: "STATE",
        state: "Bihar",
        department: "Department of Agriculture, Bihar",
        source_type: "STATE_GOVT",
        official_source_url: "https://dbtagriculture.bihar.gov.in/",
        benefit: {
            min: 10000,
            max: 80000,
            currency: "INR"
        },
        documents: [
            "DBT Farmer Registration Number",
            "LPC / Land Receipt Bihar",
            "Aadhaar Card"
        ]
    },
    {
        name: "Mukhya Mantri Raithu Vidya Nidhi & Mechanization (Karnataka)",
        slug: "karnataka-krishi-yojana",
        level: "STATE",
        state: "Karnataka",
        department: "Department of Agriculture, Karnataka",
        source_type: "STATE_GOVT",
        official_source_url: "https://raitamitra.karnataka.gov.in/",
        benefit: {
            min: 15000,
            max: 75000,
            currency: "INR"
        },
        documents: [
            "FID (Farmer ID) Karnataka",
            "Pahani / RTC Record",
            "Aadhaar Card"
        ]
    },
    {
        name: "Rainfed Area Development Programme",
        slug: "rainfed-area-development",
        level: "STATE",
        state: "Maharashtra",
        department: "Agriculture Department",
        source_type: "MAHADBT",
        official_source_url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51A1DD809A4CDCCB84A",
        benefit: {
            min: 10000,
            max: 50000,
            currency: "INR"
        },
        documents: [
            "7/12 Certificate",
            "Aadhaar Card",
            "Bank Account Passbook"
        ]
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
        console.log('Seed data for all states inserted successfully!');

        process.exit();
    } catch (err) {
        console.error('Error seeding schemes:', err);
        process.exit(1);
    }
};

connectDB();
