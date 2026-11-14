# TODO — Field Shift

> Everything unverified, placeholder, or needing expert review.
> Nothing fake should ship unnoticed.

Last updated: Phase 3

---

## 🔴 Critical (must fix before any real use)

- [x] **Cultivation calendar**: Maha (Oct–Mar) and Yala (Apr–Sep) updated from FAO Sri Lanka Crop Calendar and DOA advisories in `data/seasons.ts`.
- [ ] **Unmeasured crop water values**: Maize and Black Gram water requirements in mm are unverified in local research publications and are preserved as `null` in `data/crops.ts`. Engine surfaces them as explicit data gaps and lowers confidence.
- [ ] **Rice water basis vs. Legume basis**: Rice water values (948–1,232 mm) measure *total requirement* (including land preparation and percolation), whereas Green Gram (~228–270 mm) and Cowpea (~175–288 mm) measure *crop water use* only. Engine strictly avoids cross-basis comparison.
- [ ] **Default coordinates**: Padaviya area coordinates (~8.48°N, 80.72°E) are approximate. User must check and verify on map.
- [x] **Coastal cell distortion**: Documented in UI and README. Coastal points mix land and marine models in NASA POWER; presets use inland stations (e.g., Mahailluppallama, Medawachchiya, Polonnaruwa).
- [ ] **License**: No license chosen yet.

## 🟡 Important (should fix for hackathon demo)

- [x] **DOA agronomic rules encoded**:
  - Cowpea continuous cropping prohibition (causes rapid soil-borne wilt/root rot buildup).
  - Waterlogging risk on poorly drained soils for Cowpea, Green Gram, and Maize.
  - Legume biological nitrogen fixation bonus.
- [ ] **Economic scoring**: Rule-based comparative diversification index (0–1); not a predictive yield or revenue forecast.
- [ ] **Soil type mapping**: No automated lookup table mapping Sri Lankan soil classes (e.g. RBE, LHG) to POWER grid cells; relies on user self-reporting with confidence labels.

## 🟢 Nice to have (post-hackathon)

- [ ] Multi-farm comparison
- [ ] PDF export of rotation analysis
- [ ] Sinhala / Tamil localization
- [ ] Integration with field-level soil testing lab databases
- [ ] Historical yield data correlation
- [ ] Mobile-optimized layout
- [ ] Offline support (PWA)

## 📦 Dependencies & data sources

- [x] NASA POWER API — daily point data (2015–2025), validated, cached, and sanitized (-999 converted to null).
- [x] Leaflet tile server — OpenStreetMap tiles with attribution included.
- [x] Vitest — 10 unit tests passing covering weights normalization, pure determinism, null handling, score bounds, DOA cowpea rule, and waterlogging.

---

*This file is maintained every phase. If you see something missing, add it.*
