# TODO — Field Shift

> Everything unverified, placeholder, or needing expert review.
> Nothing fake should ship unnoticed.

Last updated: Phase 1

---

## 🔴 Critical (must fix before any real use)

- [ ] **Crop data**: All quantitative values in `data/crops.ts` are `null` (unverified). Must be filled from Sri Lanka Dept. of Agriculture, FAO, or other authoritative sources.
- [ ] **Cultivation calendar**: Maha and Yala month definitions in `data/seasons.ts` are unverified placeholders. Must be verified against the official Sri Lanka Department of Agriculture (DOA) crop calendar.
- [ ] **Default coordinates**: Padaviya area coordinates (~8.48°N, 80.72°E) are approximate. User must check and verify on map.
- [ ] **Coastal cell distortion**: Note documented in UI and README. Avoid coastal points; use inland agricultural stations (e.g., Mahailluppallama, Medawachchiya).
- [ ] **License**: No license chosen yet.

## 🟡 Important (should fix for hackathon demo)

- [ ] **Rotation engine scoring weights**: Rule-based scoring logic needs agronomist review. Current rules are transparent but simplified.
- [ ] **Economic scoring**: No real price/yield data. Scoring is a placeholder framework.
- [ ] **Soil type mapping**: No lookup table mapping Sri Lankan soil types to POWER grid cells.
- [ ] **GWETROOT interpretation**: Root-zone soil wetness (0–1) thresholds for "too dry" / "adequate" / "waterlogged" need agronomic validation for Sri Lankan conditions.

## 🟢 Nice to have (post-hackathon)

- [ ] Multi-farm comparison
- [ ] PDF export of rotation analysis
- [ ] Sinhala / Tamil localization
- [ ] Integration with actual field-level soil data (e.g., from soil testing labs)
- [ ] Historical yield data correlation
- [ ] Mobile-optimized layout
- [ ] Offline support (PWA)

## 📦 Dependencies & data sources

- [ ] NASA POWER API — no auth needed, but check rate limits for production use
- [ ] Leaflet tile server — uses OpenStreetMap tiles (check attribution requirements ✅ included)

---

*This file is maintained every phase. If you see something missing, add it.*
