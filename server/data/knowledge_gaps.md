# Knowledge Gaps & Dosage Verification Audit

This document tracks all 38 entries in [`disease_knowledge.json`](file:///c:/Users/Prashant/OneDrive/Documents/Desktop/Projects/Farmguide/farmGuide/server/data/disease_knowledge.json). It highlights entries where chemical dosages require human agronomist review, where secondary active ingredients have `dosage_verified: false`, or where local regional registration (CIBRC India / State SOPs) should be verified.

---

## 1. Summary Statistics

- **Total Classes Covered**: 38 / 38 (100% complete)
- **Healthy Plant Classes**: 12 (Chemical treatments: None, Prevention tips: Curated)
- **Disease / Pest Classes**: 26
- **Entries with Verified Primary Dosages**: 25
- **Entries Awaiting Secondary Dosage Verification**: 13
- **Entries with No Known Chemical Cure**: 1 (`Tomato___Tomato_mosaic_virus` — viral pathogen managed via sanitation and resistant cultivars)
- **Entries Missing Sources (`needs_source: true`)**: 0 (all 38 have citations from TNAU, ICAR, PlantwisePlus, or University Extension)
- **Overall Status**: `reviewed: false` on all entries (pending agronomist sign-off).

---

## 2. Chemical Dosage Verification Gaps (Priority Review List)

The following disease entries contain secondary active ingredients marked with `"dosage_verified": false` and text `"Follow the product label and local advisory"`. Before prescribing specific numbers to farmers, an agronomist must verify the label claim and CIBRC registration for that crop:

| Class Key | Crop | Disease | Active Ingredient | Current Dosage Status | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Apple___Black_rot` | Apple | Black rot | Thiophanate-methyl 70% WP | `dosage_verified: false` | Verify local pre-harvest interval & label rate |
| `Apple___Cedar_apple_rust` | Apple | Cedar apple rust | Myclobutanil 10% WP | `dosage_verified: false` | Check local state registration for apple rust |
| `Cherry_(including_sour)___Powdery_mildew` | Cherry | Powdery mildew | Tebuconazole 25.9% EC | `dosage_verified: false` | Check local commercial cherry advisory rate |
| `Grape___Black_rot` | Grape | Black rot | Myclobutanil 10% WP | `dosage_verified: false` | Confirm post-bloom spray interval |
| `Grape___Esca_(Black_Measles)` | Grape | Esca (Black Measles) | Carbendazim 50% WP | `dosage_verified: false` | Check trunk wound paint paste concentration |
| `Orange___Haunglongbing_(Citrus_greening)` | Orange | Citrus greening | Thiamethoxam 25% WG | `dosage_verified: false` | Confirm vector spray concentration during new flushes |
| `Peach___Bacterial_spot` | Peach | Bacterial spot | Oxytetracycline | `dosage_verified: false` | Check regional agricultural antibiotic regulations |
| `Pepper,_bell___Bacterial_spot` | Bell pepper | Bacterial spot | Streptocycline | `dosage_verified: false` | Verify permissible usage and dilution rate |
| `Strawberry___Leaf_scorch` | Strawberry | Leaf scorch | Azoxystrobin 23% SC | `dosage_verified: false` | Verify strawberry pre-harvest interval |
| `Tomato___Bacterial_spot` | Tomato | Bacterial spot | Streptocycline | `dosage_verified: false` | Confirm KVK tank-mix recommendation with copper |
| `Tomato___Leaf_Mold` | Tomato | Leaf mold | Difenoconazole 25% EC | `dosage_verified: false` | Check greenhouse / polyhouse label approval |
| `Tomato___Spider_mites Two-spotted_spider_mite` | Tomato | Spider mites | Fenazaquin 10% EC | `dosage_verified: false` | Verify acaricide label rate on solanaceous vegetables |
| `Tomato___Target_Spot` | Tomato | Target spot | Chlorothalonil 75% WP | `dosage_verified: false` | Confirm label rate and spray interval |
| `Tomato___Tomato_Yellow_Leaf_Curl_Virus` | Tomato | TYLCV (Whitefly) | Thiamethoxam 25% WG | `dosage_verified: false` | Confirm vector suppression concentration |

---

## 3. Verified Dosages Breakdown

The following primary active ingredients have verified dosages extracted from official university and extension package-of-practices (e.g. TNAU, CPRI, ICAR, Penn State, UC IPM):

- **Apple Scab**: Mancozeb 75% WP @ 2.5 g/L; Difenoconazole 25% EC @ 0.5 ml/L
- **Apple Black Rot**: Captan 50% WP @ 2 g/L
- **Apple Cedar Rust**: Mancozeb 75% WP @ 2.5 g/L
- **Cherry Powdery Mildew**: Wettable Sulfur 80% WP @ 2-3 g/L
- **Corn Gray Leaf Spot**: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L; Mancozeb 75% WP @ 2 g/L
- **Corn Common Rust**: Mancozeb 75% WP @ 2-2.5 g/L; Propiconazole 25% EC @ 1 ml/L
- **Corn Northern Leaf Blight**: Mancozeb 75% WP @ 2-2.5 g/L; Azoxystrobin 23% SC @ 1 ml/L
- **Grape Black Rot**: Mancozeb 75% WP @ 2 g/L
- **Grape Esca**: Copper Oxychloride 50% WP @ 2.5-3 g/L (wound paint)
- **Grape Leaf Blight**: Mancozeb 75% WP @ 2 g/L; Azoxystrobin 23% SC @ 1 ml/L
- **Citrus Greening**: Imidacloprid 17.8% SL @ 0.5 ml/L (vector control)
- **Peach Bacterial Spot**: Copper Oxychloride 50% WP @ 2.5 g/L (dormant spray)
- **Pepper Bacterial Spot**: Copper Hydroxide 53.8% DF @ 2 g/L (tank-mixed with Mancozeb)
- **Potato Early Blight**: Mancozeb 75% WP @ 2-2.5 g/L; Azoxystrobin 23% SC @ 1 ml/L
- **Potato Late Blight**: Mancozeb 75% WP @ 2.5 g/L; Metalaxyl 8% + Mancozeb 64% WP @ 2 g/L
- **Squash Powdery Mildew**: Wettable Sulfur 80% WP @ 2-3 g/L; Difenoconazole 25% EC @ 0.5 ml/L
- **Strawberry Leaf Scorch**: Captan 50% WP @ 2 g/L
- **Tomato Bacterial Spot**: Copper Oxychloride 50% WP @ 2.5 g/L
- **Tomato Early Blight**: Mancozeb 75% WP @ 2 g/L; Azoxystrobin 23% SC @ 1 ml/L
- **Tomato Late Blight**: Mancozeb 75% WP @ 2.5 g/L; Cymoxanil 8% + Mancozeb 64% WP @ 2 g/L
- **Tomato Leaf Mold**: Copper Oxychloride 50% WP @ 2.5 g/L
- **Tomato Septoria Leaf Spot**: Chlorothalonil 75% WP @ 2 g/L; Mancozeb 75% WP @ 2 g/L
- **Tomato Spider Mites**: Spiromesifen 22.9% SC @ 1 ml/L
- **Tomato Target Spot**: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L
- **Tomato TYLCV**: Diafenthiuron 50% WP @ 1.2 g/L (whitefly vector control)

---

## 4. Special Agronomic Considerations

1. **Viral Diseases (`Tomato___Tomato_mosaic_virus`, `Tomato___Tomato_Yellow_Leaf_Curl_Virus`)**:
   - Plant viruses have **no chemical cure**. Chemical recommendations are strictly targeted at insect vectors (whiteflies for TYLCV). For ToMV, hygiene (washing hands with milk/soap, disinfecting tools) and resistant seed (Tm-2 gene) are the only effective controls.
2. **Bacterial Greening (`Orange___Haunglongbing_(Citrus_greening)`)**:
   - The bacterium *Candidatus Liberibacter* resides systemically in phloem vessels. Foliar bactericides cannot eliminate it; management relies on rigorous psyllid suppression, disease-free nursery stock, and roguing unthrifty trees.
3. **Copper & Sulfur Temperature Cautions**:
   - Sulfur sprays on cucurbits (squash) or cherries must not be applied above 30°C to avoid severe foliar scorch.
   - Copper sprays on peaches must be restricted to dormant or delayed-dormant stages to avoid phytotoxicity on tender foliage.
