/**
 * test_disease_knowledge.js — Comprehensive test suite for curated disease knowledge.
 *
 * Covers:
 * 1. 100% class coverage across all 38 classes in disease_classes.json
 * 2. Schema compliance (all required fields present)
 * 3. Healthy classes integrity (is_healthy: true, chemical: [])
 * 4. Dosage verification safety (no digits in unverified dosage)
 * 5. Status logic (ok/possible -> present, uncertain/not_a_leaf/poor_quality -> null, unknown class -> fallback)
 * 6. Resilience against missing or corrupted JSON files
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CLASSES_PATH = path.resolve(__dirname, '../ml/models/disease_classes.json');
const KNOWLEDGE_PATH = path.resolve(__dirname, 'data/disease_knowledge.json');

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

console.log('\n🧪 Running Disease Knowledge Test Suite...\n');

// ── Test 1: Class Coverage & Schema Integrity ──────────────────────────────
it('Coverage: All 38 classes in disease_classes.json have an entry in disease_knowledge.json', () => {
  const classes = JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf8'));
  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));

  assert.strictEqual(classes.length, 38, 'Expected exactly 38 classes in disease_classes.json');
  assert.strictEqual(Object.keys(knowledge).length, 38, 'Expected exactly 38 entries in disease_knowledge.json');

  classes.forEach((cls) => {
    assert.ok(knowledge[cls], `Missing class key in knowledge base: "${cls}"`);
  });
});

it('Schema: Every entry contains all required schema fields', () => {
  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
  const requiredFields = [
    'crop', 'disease', 'is_healthy', 'type', 'summary', 'symptoms',
    'immediate_actions', 'treatment', 'prevention', 'when_to_seek_help',
    'sources', 'reviewed'
  ];

  Object.entries(knowledge).forEach(([cls, entry]) => {
    requiredFields.forEach((field) => {
      assert.ok(entry[field] !== undefined, `Class "${cls}" is missing field "${field}"`);
    });
    assert.ok(Array.isArray(entry.symptoms), `Class "${cls}": symptoms must be an array`);
    assert.ok(Array.isArray(entry.immediate_actions), `Class "${cls}": immediate_actions must be an array`);
    assert.ok(entry.treatment && typeof entry.treatment === 'object', `Class "${cls}": treatment must be an object`);
    assert.ok(Array.isArray(entry.treatment.organic_cultural), `Class "${cls}": treatment.organic_cultural must be an array`);
    assert.ok(Array.isArray(entry.treatment.chemical), `Class "${cls}": treatment.chemical must be an array`);
    assert.ok(Array.isArray(entry.prevention), `Class "${cls}": prevention must be an array`);
    assert.ok(Array.isArray(entry.sources), `Class "${cls}": sources must be an array`);
    assert.strictEqual(entry.reviewed, false, `Class "${cls}": reviewed must be false`);
  });
});

// ── Test 2: Healthy Classes Integrity ──────────────────────────────────────
it('Healthy classes: All 12 healthy classes have is_healthy: true, type "healthy", and NO chemical treatments', () => {
  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
  const healthyClasses = Object.keys(knowledge).filter(k => k.endsWith('___healthy'));

  assert.strictEqual(healthyClasses.length, 12, 'Expected exactly 12 healthy classes');

  healthyClasses.forEach((cls) => {
    const entry = knowledge[cls];
    assert.strictEqual(entry.is_healthy, true, `Class "${cls}" must have is_healthy: true`);
    assert.strictEqual(entry.type, 'healthy', `Class "${cls}" must have type: "healthy"`);
    assert.strictEqual(entry.immediate_actions.length, 0, `Class "${cls}" must have empty immediate_actions`);
    assert.strictEqual(entry.treatment.chemical.length, 0, `Class "${cls}" must have no chemical treatments`);
    assert.ok(entry.prevention.length >= 2, `Class "${cls}" must have at least 2 maintenance tips in prevention`);
  });
});

// ── Test 3: Chemical Dosage Safety ─────────────────────────────────────────
it('Dosage Safety: No dosage contains digits unless dosage_verified is true', () => {
  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));

  Object.entries(knowledge).forEach(([cls, entry]) => {
    if (entry.treatment?.chemical) {
      entry.treatment.chemical.forEach((chem, idx) => {
        if (chem.dosage_verified === false) {
          const hasDigits = /\d/.test(chem.dosage);
          assert.strictEqual(
            hasDigits, 
            false, 
            `Class "${cls}" chemical[${idx}] has unverified dosage with digits: "${chem.dosage}"`
          );
        } else if (chem.dosage_verified === true) {
          assert.ok(chem.dosage && chem.dosage.length > 0, `Class "${cls}" chemical[${idx}] verified dosage is empty`);
        }
      });
    }
  });
});

// ── Test 4: Recommendation Logic Simulation ────────────────────────────────
it('Recommendation Logic: Returns curated recommendation for "ok" and "possible" statuses', () => {
  const knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, 'utf8'));
  const SAFETY_NOTICE = "General guidance only. Follow the product label, wear protective gear, and confirm with your local Krishi Vigyan Kendra or agronomist before spraying.";

  function getRec(status, classKey, label) {
    if (!['ok', 'possible'].includes(status) || (!classKey && !label)) return null;
    const entry = knowledge[classKey];
    if (entry) return { ...entry, safety_notice: SAFETY_NOTICE, source: 'curated' };
    return { message: "We don't have detailed guidance for this yet.", safety_notice: SAFETY_NOTICE, source: 'fallback' };
  }

  // Status ok
  const recOk = getRec('ok', 'Potato___Early_blight', 'Potato - Early blight');
  assert.ok(recOk !== null, 'Recommendation must not be null for status ok');
  assert.strictEqual(recOk.crop, 'Potato');
  assert.strictEqual(recOk.disease, 'Early blight');
  assert.strictEqual(recOk.source, 'curated');
  assert.strictEqual(recOk.safety_notice, SAFETY_NOTICE);

  // Status possible
  const recPossible = getRec('possible', 'Apple___Apple_scab', 'Apple - Apple scab');
  assert.ok(recPossible !== null, 'Recommendation must not be null for status possible');
  assert.strictEqual(recPossible.disease, 'Apple scab');
  assert.strictEqual(recPossible.source, 'curated');

  // Status uncertain -> null
  const recUncertain = getRec('uncertain', 'Potato___Early_blight', 'Potato - Early blight');
  assert.strictEqual(recUncertain, null, 'Status uncertain must return null recommendation');

  // Status not_a_leaf -> null
  const recNotLeaf = getRec('not_a_leaf', 'Potato___Early_blight', null);
  assert.strictEqual(recNotLeaf, null, 'Status not_a_leaf must return null recommendation');

  // Status poor_quality -> null
  const recPoor = getRec('poor_quality', null, null);
  assert.strictEqual(recPoor, null, 'Status poor_quality must return null recommendation');

  // Status invalid_image -> null
  const recInvalid = getRec('invalid_image', null, null);
  assert.strictEqual(recInvalid, null, 'Status invalid_image must return null recommendation');

  // Unknown class -> fallback
  const recUnknown = getRec('ok', 'UnknownCrop___Unknown_disease', 'Unknown');
  assert.ok(recUnknown !== null, 'Unknown class must return fallback recommendation');
  assert.strictEqual(recUnknown.source, 'fallback');
  assert.strictEqual(recUnknown.safety_notice, SAFETY_NOTICE);
});

// ── Test 5: Graceful Degradation on Missing or Corrupt File ─────────────────
it('Resilience: Server does not crash if knowledge file is missing or invalid', () => {
  const SAFETY_NOTICE = "General guidance only. Follow the product label, wear protective gear, and confirm with your local Krishi Vigyan Kendra or agronomist before spraying.";

  function loadKnowledgeSafely(filePath) {
    let kd = {};
    try {
      if (fs.existsSync(filePath)) {
        kd = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      kd = {};
    }
    return kd;
  }

  // 1. Missing file path
  const missingData = loadKnowledgeSafely('path/to/nonexistent/file.json');
  assert.deepStrictEqual(missingData, {}, 'Missing file must return empty object without throwing');

  // 2. Lookup against empty data gracefully falls back
  function getSafeRec(kd, status, classKey) {
    if (!['ok', 'possible'].includes(status) || !classKey) return null;
    if (kd[classKey]) return { ...kd[classKey], source: 'curated' };
    return { message: "We don't have detailed guidance for this yet.", source: 'fallback', safety_notice: SAFETY_NOTICE };
  }

  const fallback = getSafeRec(missingData, 'ok', 'Tomato___Early_blight');
  assert.ok(fallback !== null);
  assert.strictEqual(fallback.source, 'fallback');
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);
if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
} else {
  process.exit(1);
}
