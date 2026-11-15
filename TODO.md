# TODO — Field Shift

> Everything unverified, placeholder, or needing expert review.
> Nothing fake should ship unnoticed.

Last updated: Phase 4 (Pre-Phase 5 Audit & Heuristics Polish)

---

## 🔴 Critical (must fix before any real use)

- [x] **Cultivation calendar**: Maha (Oct–Mar) and Yala (Apr–Sep) set from FAO report cc3682en (Maha Sep–Mar, Yala Apr–Sep; Oct–Mar follows the Maha definition in FAO's irrigation project, 1 Oct–30 Mar; marked `verified: false` pending formal DOA gazette verification).
- [x] **Default coordinates updated**: Padaviya coordinates set to ~8.83°N, 80.76°E (sourced from Wikipedia / BirdLife Sri Lanka).
- [ ] **Unmeasured crop water values**: Maize and Black Gram water requirements in mm are unverified in reviewed Sri Lanka Dry Zone publications and are strictly preserved as `null` in `data/crops.ts`. Engine marks water coverage as "not assessed" and surfaces explicit data gaps.
- [ ] **Rice water basis vs. Legume basis**: Rice water values (948–1,232 mm; DOA/RRDI Mahailluppallama) measure *total requirement* (including land preparation and percolation), whereas Green Gram (228/270 mm; Annals SL DOA 2014) and Cowpea (175–288 mm; Liyanage 1992) measure *crop water use* only. The engine compares each crop solely to its own requirement and never across bases.
- [x] **Coastal cell distortion**: Documented in UI and README. Coastal points mix land and marine models in NASA POWER; presets use inland stations (e.g., Mahailluppallama, Medawachchiya, Polonnaruwa).
- [x] **License**: MIT License added.
- [ ] **Sinhala & Tamil Translations Review**: Farmer-friendly UI strings in `data/translations.ts` and local crop names (e.g. paddy වී/நெல், mung bean මුං ඇට/பாசிப்பயறு, cowpea කවුපි/தட்டப்பயறு, black gram උළුඳු/உளுந்து, maize බඩඉරිඟු/மக்காச்சோளம்) need formal review by native Sri Lankan agricultural extension officers to verify dialectal terminology across farming districts.
- [ ] **Redesign Journo-style Flow Translations (Phase 1)**: New strings added for mobile-first onboarding, occupation selection, crop picker, and the rain-supported window result card in `data/translations.ts` (`journo*` keys) need formal review by native Sinhala and Tamil speakers.
- [ ] **Pre-Phase 2 Fixes Translations**: New strings added for privacy note update ("Used only to look up rain data for your area"), region guard (`outsideSriLanka*`), unmeasured crop handling (`noRainfallData*`), plain sowing time (`sowAround`), and plain water coverage (`waterCoveragePlain`) need native Sinhala and Tamil review.
- [ ] **Phase 2 Translations (Three Strategies, Dual-Season Crop Selection, Climate Indicators)**: New strings added for Maha/Yala dropdowns (`journoInMahaLabel`, `journoInYalaLabel`), single crop assumption (`journoSingleCropAssumption`), three rotation comparison cards (`journoCompareRotations*`, `journoStrategy*`), seasonal rainfall in words, hazard advice headers, climate & soil indicators (`journoClimateIndicators*`, `journoSoilWetnessLabel`), and month names need formal review by native Sri Lankan agricultural extension officers.
- [ ] **Phase 2.5 Farmer Flow Simplification Translations**: New strings added for multi-select crop checklist (`journoSelectCrops*`), sowing time picker (`journoSowingTime*`, `sowPeriod*`), hero best fit (`journoBestCropHeroTitle`, `journoTopMatchBadge`), ranked other crops (`journoOtherCropsRankedTitle`), and crop verdicts (`cropVerdicts`) in en/si/ta need formal native review.
- [ ] **Meteomatics Forecast Line Translations**: New strings added for the supplementary 7-day forecast line and NASA POWER weekly comparison (`journoForecast*` keys) need native Sinhala and Tamil review.
- [ ] **The Crop Recommendations Book Citation**: Publisher, official title, and publication year are unconfirmed for the crop recommendations book used for timeline operations, climate hazard advice, economics, and varieties. Fill in full bibliographic details (title, publisher, year) once verified.
- [ ] **Tamil Agricultural Glossary Review**: The following Tamil terms used in the assistant prompts and hazard guidance need review by native-speaker Sri Lankan agricultural experts: mulch (மூடாக்கு), drought-tolerant varieties (வறட்சியைத் தாங்கும் ரகங்கள்), short-duration varieties (குறுகிய கால ரகங்கள்), improve drainage (வடிகால் வசதியை மேம்படுத்துதல்), raised beds (மேட்டுப்பாத்திகள்), irrigate (நீர்ப்பாசனம் செய்தல்).

## 🟡 Model Assumptions (Not Validated by an Agronomist)

Centralized in `lib/engine/assumptions.ts` and displayed in the UI:
- [ ] **Water Window Divisor**: Assumed to span full months + proportional share of the last month, using `daysToMaturity / 30`.
- [ ] **Water Coverage Formula**: `min(1.0, window rainfall / crop requirement midpoint)`. No bonus for surplus rainfall.
- [ ] **Soil Health Baseline**: Heuristic base score of 0.60 before sequence adjustments.
- [ ] **Continuous Monoculture Penalty**: -0.25 if all 3 seasons grow the identical crop.
- [ ] **Continuous Cowpea Penalty**: -0.35 if cowpea is grown consecutively (DOA RARDC Kilinochchi warning; not applied if monoculture penalty is active).
- [ ] **Legume Nitrogen Fixation Bonus**: +0.12 per legume season for biological nitrogen fixation.
- [ ] **Waterlogging Soil Penalty**: -0.20 if Cowpea (high sensitivity, DOA RARDC Kilinochchi) is on poor/waterlogged soil.
- [ ] **Low Organic Carbon Penalty**: -0.08 if soil organic carbon is reported as low (unvalidated heuristic rule; '<1.0%' claim removed).
- [ ] **Soil pH & Texture**: Informational only; do not alter scores pending validated agronomic threshold tables for Dry Zone crops.
- [ ] **Economic Potential**: Marked "Not assessed" and excluded from composite score due to lack of verified production cost and farm-gate price data.

## 🟢 Nice to have (post-hackathon)

- [ ] Multi-farm comparison
- [ ] PDF export of rotation analysis
- [ ] Sinhala / Tamil localization
- [ ] Integration with field-level soil testing lab databases
- [ ] Historical yield data correlation
- [ ] Mobile-optimized layout
- [ ] Offline support (PWA)

## 📦 Dependencies & data sources

- [x] NASA POWER API — 11-year daily point data (2015–2025), validated, cached, and sanitized (-999 converted to null).
- [x] Leaflet tile server — OpenStreetMap tiles with attribution included.
- [x] Vitest — Unit tests covering pure determinism, water coverage formula, null handling, DOA continuous cowpea rule, and unknown crop exception.

---

*This file is maintained every phase. If you see something missing, add it.*
