# 🌾 Field Shift — Crop Rotation Decision Support

> **NASA Space Apps 2026** — "Field Shift: Adapting Farms with NASA Data"

A decision-support tool that uses NASA Earth observations plus local soil information to help farmers explore crop-rotation strategies that strengthen soil health and resilience to changing weather and water conditions.

## What It Does

- **Farmer-Friendly Onboarding Wizard (`/`)**: Mobile-first, step-by-step guidance in English, Sinhala (සිංහල), or Tamil (தமிழ்):
  - Step 1: Language selection (English, Sinhala, Tamil) stored in React state.
  - Step 2: Farm location via browser GPS ("Use My Location", with a clear privacy notice that no locations are stored) or agricultural district presets (starts at Padaviya, Dry Zone).
  - Step 3: Current crop baseline for Maha and Yala seasons (forms Strategy A).
  - Step 4: Alternative crops to consider (dynamically configures Strategies B and C).
  - Step 5: Three plain-language recommendation cards citing NASA 11-year rainfall numbers, agronomic risks, and data gaps.
- **Farmer Support Assistant ("Need Help?")**: Floating on-screen help modal on every step:
  - Pre-written static guidance for each screen in the selected language.
  - Optional Q&A question box powered by server-side Gemini (`gemini-1.5-flash`). Strictly forbidden from offering pesticide/fertilizer dosage or yield predictions; directs farmers to their local Agrarian Service Centre or Department of Agriculture.
- **Expert Details View (`/expert`)**:
  - Full 11-year monthly NASA POWER climate charts (rainfall, temperature, root-zone soil wetness).
  - Interactive Leaflet map with Dry Zone bounding box and inland presets.
  - Interactive Soil Form with source tracking (Measured vs. Estimated).
  - Priority weight sliders and detailed heuristic score breakdowns.

## ⚠️ Important Disclaimer

This tool supports — and does not replace — farmers and local agricultural experts. NASA POWER data is at approximately 0.5° resolution (~55 km) and does not represent field-level conditions. Crop data must be verified against local sources (e.g., Sri Lanka Department of Agriculture, FAO) before making farming decisions.

## 🔍 Limitations & Uncertainty

In alignment with the challenge criteria, this tool explicitly highlights uncertainty rather than masking it with false precision:

1. **Crop Data Unverified by Agronomists**: Quantitative agronomic parameters (e.g., precise crop water requirements, yield responses, nutrient demands) originate from preliminary public sources and have **not** been validated by an accredited agronomist or local agricultural extension officer. All quantitative placeholders are explicitly flagged in `TODO.md` and `data/crops.ts`.
2. **Comparative Scores, Not Yield Predictions**: The 0–1 scenario scores are designed strictly to compare relative trade-offs between crop sequences under prevailing climate and soil constraints. They are **not** predictive harvest forecasts, production guarantees, or financial projections.
3. **Cross-Basis Water Comparison Caveat**: Rainfall coverage compares each crop with its own specific requirement. Rice uses **total requirement** (including land preparation, puddling, and standing water / seepage: 948–1,232 mm; DOA/RRDI Mahailluppallama), whereas legumes use **crop water use** (consumptive evapotranspiration: 175–288 mm). Therefore, rainfall coverage is **NOT like-for-like across crops**, and legume seasons will appear higher partly due to this differing measurement basis.
4. **Coarse Spatial Resolution & Coastal Mixing**: NASA POWER satellite and assimilation datasets operate at ~0.5° × 0.5° spatial resolution (~55 km). While well-suited for regional climatology and multi-year trend analysis (Maha vs. Yala patterns), they do not capture field-scale microclimates, depressions, or localized tank command areas. Crucially, **coastal and shoreline grid cells mix terrestrial and marine surface models**, which can significantly distort terrestrial rainfall estimates (e.g., coastal dry-zone points showing inflated precipitation). For decision-support, always rely on inland agricultural points.
5. **Farmer Judgment Remains Primary**: No algorithmic scoring can account for plot-level pest histories, farmer labor availability, seed accessibility, or localized market dynamics. Field Shift provides evidence-based context to aid dialogue, leaving all management decisions with the farmer and local extension personnel.
6. **Geographic Scope Restricted to Sri Lanka Dry Zone**: Crop data is sourced strictly from Sri Lanka Dry Zone research station publications (DOA Mahailluppallama, RARDC Kilinochchi). Results for coordinates outside the approximate Dry Zone bounding box (~7.0°N–10.0°N, 79.5°E–81.5°E) are not meaningful.
7. **Input Completeness, Not Model Validation**: The percentage metric reflects data availability and input completion. It does not validate the model or scoring weights, which remain unvalidated heuristic rules.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router) + TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Map**: [Leaflet](https://leafletjs.com/) via [React Leaflet](https://react-leaflet.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI Help Assistant**: Google Gemini API via Google AI Studio (`gemini-1.5-flash`)
- **Testing**: [Vitest](https://vitest.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

No database. No user accounts. No IoT devices.

## Environment Variables

For the optional farmer Q&A help sheet, add a `.env.local` file (this file is ignored by Git in `.gitignore` and is never committed or sent to the client):

```bash
# Google AI Studio API Key (server-side only)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

> **Google AI Studio Free Tier Specifications for `gemini-1.5-flash`:**
> - Rate limits: 15 Requests Per Minute (RPM), 1,000,000 Tokens Per Minute (TPM), 1,500 Requests Per Day (RPD).
> - If `GEMINI_API_KEY` is not provided or fails, the Help Sheet automatically falls back to static pre-written expert guidance in the farmer's selected language.

## Data Sources

| Data | Source | Resolution | Notes |
|------|--------|------------|-------|
| Climate (precipitation, temperature, humidity, root-zone soil wetness) | [NASA POWER](https://power.larc.nasa.gov/) | ~0.5° (~55 km), daily | 2015–2025 (11 years). Free, no API key. `-999` = missing value. |
| Soil properties | User input | Field-level | Self-reported with confidence labels |
| Crop characteristics | `data/crops.ts` | — | Sourced, not agronomist-validated. See `TODO.md`. |

### NASA POWER Credit

Climate data provided by the [NASA Langley Research Center POWER Project](https://power.larc.nasa.gov/), funded through the NASA Earth Science Directorate Applied Science Program.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npx vitest run

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect the GitHub repository to Vercel for automatic deploys on push.

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── help/           # Server-side Gemini help route (rate-limited, sanitized)
│   │   └── nasa-power/     # NASA POWER proxy handler (maxDuration = 60s)
│   ├── expert/             # Expert details view (map, charts, soil form)
│   ├── layout.tsx          # Root layout with footer & team credits
│   └── page.tsx            # Farmer onboarding wizard (Steps 1–5)
├── components/             # React components
│   ├── Wizard/             # Farmer wizard components (HelpSheet)
│   ├── Charts/             # Recharts visualization components
│   ├── Map.tsx             # Interactive Leaflet map
│   ├── SoilForm.tsx        # Soil input form with atomic state updates
│   └── ResultsCards.tsx    # Scenario evaluation cards
├── lib/
│   ├── types/              # TypeScript definitions (engine, crops, NASA)
│   ├── hooks/              # React hooks (useNasaData)
│   ├── engine/             # Rotation scoring engine, farmer strategies & heuristics
│   └── utils/              # Data processing & climatology utilities
├── data/
│   ├── crops.ts            # Crop characteristic catalog (sourced, not agronomist-validated)
│   ├── seasons.ts          # Cultivation calendar definitions (FAO report cc3682en)
│   └── translations.ts     # Multilingual UI strings & static help (en, si, ta)
├── scripts/                # Live evaluation & climatology verification scripts
├── __tests__/              # Unit tests (Vitest: rotation, soil form, farmer strategies)
├── TODO.md                 # Unverified / placeholder items tracker
├── LICENSE                 # MIT License
└── README.md
```

## Team & Credits

- **Methsith Chandrasena and Team** — Developed for the NASA Space Apps Challenge 2026.

## License

[MIT License](LICENSE) — see the LICENSE file for details.
