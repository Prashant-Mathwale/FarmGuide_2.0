/**
 * test_disease_advisor.js — Verification test suite for FarmGuide Disease Advisor.
 */

const assert = require('assert');
const diseaseAdvisorService = require('./services/diseaseAdvisorService');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ ${desc}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ ${desc}`);
        console.error(`     ${err.message}`);
        process.exitCode = 1;
    }
}

console.log('\n🧪 Running Disease Advisor Test Suite...\n');

// ── Test 1: Ingestion & Metadata Completeness ──────────────────────────────
it('Ingestion: Loads all 36 crops, 36 Maharashtra districts, 111 diseases, 530 rules and 8 weather rules', () => {
    assert.strictEqual(diseaseAdvisorService.isLoaded, true, 'Service must be loaded');
    assert.strictEqual(diseaseAdvisorService.crops.length, 36, 'Expected 36 crops');
    assert.strictEqual(diseaseAdvisorService.districts.length, 36, 'Expected 36 districts');
    assert.strictEqual(diseaseAdvisorService.diseases.length, 111, 'Expected 111 diseases');
    assert.strictEqual(diseaseAdvisorService.regionalRules.length, 530, 'Expected 530 regional rules');
    assert.strictEqual(diseaseAdvisorService.weatherRules.length, 8, 'Expected 8 weather rules');
    assert.strictEqual(diseaseAdvisorService.agroRegions.length, 6, 'Expected 6 Maharashtra agro-regions');
});

// ── Test 2: Local Marathi / Common Crop Alias Resolution ────────────────────
it('Alias Resolution: Maps local Marathi and common colloquial terms to canonical crops', () => {
    const testCases = [
        ['tamatar', 'Tomato'],
        ['batata', 'Potato'],
        ['mirchi', 'Chilli'],
        ['kanda', 'Onion'],
        ['vangi', 'Brinjal'],
        ['bhendi', 'Okra'],
        ['draksha', 'Grapes'],
        ['dalimb', 'Pomegranate'],
        ['kapus', 'Cotton'],
        ['soyabean', 'Soybean'],
        ['tur', 'Pigeonpea'],
        ['harbhara', 'Chickpea'],
        ['jowar', 'Sorghum'],
        ['gahu', 'Wheat'],
        ['bhat', 'Rice'],
        ['Tomato', 'Tomato'],
        ['cotton', 'Cotton']
    ];

    testCases.forEach(([alias, expected]) => {
        const resolved = diseaseAdvisorService.resolveCrop(alias);
        assert.strictEqual(resolved, expected, `Alias "${alias}" should resolve to "${expected}", got "${resolved}"`);
    });
});

// ── Test 3: District and Geolocation Resolution ─────────────────────────────
it('District Resolution: Maps district names and GPS coordinates to Maharashtra agro-regions', () => {
    const pune = diseaseAdvisorService.resolveDistrict('Pune');
    assert.ok(pune, 'Pune should resolve');
    assert.strictEqual(pune.district, 'Pune');
    assert.strictEqual(pune.agro_region, 'Western Maharashtra Plain');

    const nagpur = diseaseAdvisorService.resolveDistrict('Nagpur');
    assert.ok(nagpur, 'Nagpur should resolve');
    assert.strictEqual(nagpur.district, 'Nagpur');

    // GPS fallback near Nashik (approx 19.99, 73.78)
    const nearNashik = diseaseAdvisorService.resolveDistrict(null, 19.99, 73.78);
    assert.ok(nearNashik, 'Nearby coords should resolve to a district');
    assert.strictEqual(nearNashik.district, 'Nashik');
});

// ── Test 4: Advisory Scoring & Disease Ranking ──────────────────────────────
it('Advisory Logic: Correctly ranks diseases under favorable monsoon weather in Western Maharashtra', () => {
    const advisory = diseaseAdvisorService.getAdvisory({
        crop: 'Tomato',
        district: 'Pune',
        temperature: 24,
        humidity: 88,
        rainfall: 12,
        isRaining: true,
        month: 8 // August (Kharif)
    });

    assert.strictEqual(advisory.success, true);
    assert.strictEqual(advisory.query.crop, 'Tomato');
    assert.strictEqual(advisory.query.district, 'Pune');
    assert.strictEqual(advisory.query.agro_region, 'Western Maharashtra Plain');
    assert.ok(advisory.diseases_to_watch.length > 0, 'Must return diseases to watch');

    // First disease should have high advisory score
    const top = advisory.diseases_to_watch[0];
    assert.ok(top.advisory_score >= 68, `Top disease should have high score, got ${top.advisory_score}`);
    assert.strictEqual(top.advisory_level, 'High');
    assert.ok(top.match_reasons.length > 0, 'Must include specific match reasons');
    assert.ok(top.management_note && top.management_note.length > 0, 'Must provide management note');
});

// ── Test 5: Model Support Transparency Integrity ───────────────────────────
it('Model Support Integrity: Distinguishes AI-scannable vs Advisory-only diseases without false promises', () => {
    const tomatoAdvisory = diseaseAdvisorService.getAdvisory({
        crop: 'Tomato',
        district: 'Nashik',
        temperature: 25,
        humidity: 80,
        month: 7
    });

    const diseases = tomatoAdvisory.diseases_to_watch;
    const modelSupported = diseases.filter(d => d.model_supported === true);
    const advisoryOnly = diseases.filter(d => d.model_supported === false);

    assert.ok(modelSupported.length > 0, 'Should have some model-supported tomato diseases');
    // Check specific known values from dataset:
    // Tomato Early Blight is model_supported=True
    const earlyBlight = diseases.find(d => d.disease.toLowerCase().includes('early blight'));
    if (earlyBlight) {
        assert.strictEqual(earlyBlight.model_supported, true, 'Early blight should be model_supported');
    }

    // Tomato Powdery Mildew is model_supported=False in dataset
    const powdery = diseases.find(d => d.disease.toLowerCase().includes('powdery mildew'));
    if (powdery) {
        assert.strictEqual(powdery.model_supported, false, 'Powdery mildew should NOT be model_supported');
    }
});

// ── Test 6: General Weather Rules Triggering ─────────────────────────────────
it('Weather Rules: Triggers canopy disease risk alerts under cool wet conditions (WR001 / WR005 / WR007)', () => {
    // Cool & saturated (18°C, 92% RH, 25mm rain)
    const alerts = diseaseAdvisorService.evaluateWeatherRules(18, 92, 25, true);
    const ruleIds = alerts.map(a => a.rule_id);

    assert.ok(ruleIds.includes('WR001'), 'WR001 (Very high humidity + cool temps) should trigger');
    assert.ok(ruleIds.includes('WR005'), 'WR005 (Rain splash / saturated canopy) should trigger');
    assert.ok(ruleIds.includes('WR007'), 'WR007 (Waterlogging) should trigger');
});

// ── Test 7: Options Endpoint Data Contract ──────────────────────────────────
it('Options API: Returns complete lists for UI dropdowns and search auto-completion', () => {
    const options = diseaseAdvisorService.getAdvisorOptions();
    assert.strictEqual(options.success, true);
    assert.strictEqual(options.crops.length, 36);
    assert.strictEqual(options.districts.length, 36);
    assert.strictEqual(options.agro_regions.length, 6);
    assert.strictEqual(options.weather_rules_summary.length, 8);

    // Verify alias inclusion in crop objects
    const tomatoObj = options.crops.find(c => c.name === 'Tomato');
    assert.ok(tomatoObj, 'Tomato should be in crops options');
    assert.ok(tomatoObj.aliases.includes('tamatar'), 'Tomato aliases should include tamatar');
});

// ── Test 8: Unknown Crop Graceful Handling ──────────────────────────────────
it('Safety: Gracefully rejects unknown crop without throwing exception', () => {
    const result = diseaseAdvisorService.getAdvisory({ crop: 'KryptoniteHerb', district: 'Pune' });
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('not currently in the Maharashtra regional knowledge base'));
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);
if (passedTests === totalTests) {
    console.log('🎉 ALL ADVISOR TESTS PASSED SUCCESSFULLY!\n');
} else {
    process.exit(1);
}
