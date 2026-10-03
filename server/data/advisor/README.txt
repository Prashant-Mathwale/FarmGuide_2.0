FarmGuide Disease Advisor — Large Maharashtra Knowledge Base
Generated: 2026-10-03

PURPOSE
This package is a rule-based knowledge base for FarmGuide's Disease Advisor.
It is designed to answer: "Which diseases should I watch for this crop in my
region under the current/forecast weather?"

CONTENTS
- locations_maharashtra.csv: 36 Maharashtra districts + agro-region + fallback coordinates.
- crops.csv: Maharashtra-relevant crop master.
- crop_aliases.csv: common/local aliases for UI search.
- diseases.csv: disease-condition master with symptoms, weather windows and management notes.
- regional_disease_rules.csv: crop × disease × Maharashtra agro-region/district applicability rules.
- weather_rules.csv: normalized weather-condition rules.

DATA SIZE
- Districts: 36
- Crops: 36
- Disease/condition master rows: 111
- Regional/district applicability rules: 530
- Weather rules: 8

IMPORTANT DATA INTEGRITY NOTE
The regional rules are NOT prevalence/surveillance measurements. They are curated
applicability/risk-relevance rules intended for a rule-based advisor. Do not display
them as "X% prevalence" or "disease is present". Recommended UI wording:
"Diseases to watch", "weather is favorable", or "higher advisory relevance".

MODEL SUPPORTED
model_supported=True means the disease is represented in the current PlantVillage-style
38-class MobileNetV2 disease model discussed for FarmGuide. This field does NOT mean
the model has equal accuracy in real-world field images.

ADVISOR LOGIC RECOMMENDATION
1. Match crop.
2. Match exact district if available; otherwise agro-region.
3. Match current/forecast temperature and humidity to disease range.
4. Match rain/leaf-wetness condition.
5. Match season/month.
6. Rank by rule relevance and show top 3-5 "Diseases to watch".
7. If model_supported=False, do not show an "AI scan can detect this" promise.

SAFETY
Management notes intentionally avoid hard-coded pesticide doses. For chemical control,
FarmGuide should link to current local agricultural advisories and instruct users to
follow locally approved labels/recommendations. This prevents stale chemical advice.

SOURCE BASIS
- Dr. PDKV Plant Disease Guide: https://www.pdkv.ac.in/?page_id=11966
- PDKV Agro Advisory: https://www.pdkv.ac.in/?page_id=203
- VNMKV Extension / CROPSAP-Hort-SAP: https://www.vnmkv.ac.in/home_extension.php
- ICAR Maharashtra Kharif Agro-Advisory 2025:
  https://icar.gov.in/sites/default/files/Circulars/ICAR-En-Kharif-Agro-Advisories-for-Farmers-2025.pdf
- MPKV Rahuri official site: https://www.mpkv.ac.in/

VERIFICATION
This is a development dataset. Before production use, have crop/disease rows reviewed
by an agronomist/plant-pathologist or the relevant Maharashtra agricultural university.
last_verified is the package creation date, not a claim that every rule was individually
verified on that date.
