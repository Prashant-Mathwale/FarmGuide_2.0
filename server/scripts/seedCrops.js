const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Crop = require('../models/Crop');

function formatCropName(raw) {
    return raw
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function makeSlug(raw) {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function seedCrops() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    // Path to disease classes
    const diseaseClassesPath = path.resolve(__dirname, '../../ml/models/disease_classes.json');
    if (!fs.existsSync(diseaseClassesPath)) {
        console.error(`❌ Disease classes file not found at: ${diseaseClassesPath}`);
        process.exit(1);
    }

    const rawClasses = JSON.parse(fs.readFileSync(diseaseClassesPath, 'utf-8'));
    
    // Programmatically extract the unique crop part from "Crop___Disease" names
    const uniqueRawCrops = Array.from(new Set(rawClasses.map(cls => cls.split('___')[0]))).filter(Boolean);
    console.log(`Found ${uniqueRawCrops.length} unique crops in disease_classes.json:`, uniqueRawCrops);

    // Load optional translations
    let translations = {};
    const transPath = path.resolve(__dirname, '../data/crop_translations.json');
    if (fs.existsSync(transPath)) {
        try {
            translations = JSON.parse(fs.readFileSync(transPath, 'utf-8'));
        } catch (e) {
            console.warn('⚠️ Could not load crop_translations.json, proceeding with default names');
        }
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    let upsertedCount = 0;

    for (const rawCrop of uniqueRawCrops) {
        const key = makeSlug(rawCrop);
        const name = formatCropName(rawCrop);
        const names = translations[key] || {
            en: name,
            hi: name,
            mr: name
        };

        await Crop.findOneAndUpdate(
            { key },
            {
                key,
                name: names.en || name,
                names,
                active: true
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        upsertedCount++;
    }

    console.log(`🎉 Successfully seeded ${upsertedCount} active crops in database.`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

if (require.main === module) {
    seedCrops().catch((err) => {
        console.error('❌ Error seeding crops:', err);
        process.exit(1);
    });
}

module.exports = { seedCrops };
