# 🌾 Field Shift — Crop Rotation Decision Support

> **NASA Space Apps 2026** — "Field Shift: Adapting Farms with NASA Data"

A decision-support tool that uses NASA Earth observations plus local soil information to help farmers explore crop-rotation strategies that strengthen soil health and resilience to changing weather and water conditions.

## What It Does

- **Map**: Click to select a farm location (defaults to Padaviya area, Anuradhapura, Sri Lanka)
- **NASA Climate Data**: 11 years of daily climate observations from NASA POWER (precipitation, temperature, humidity, root-zone soil wetness)
- **Charts**: Monthly rainfall totals, temperature trends, and soil moisture patterns
- **Soil Input**: Enter local soil characteristics (pH, texture, organic carbon, drainage) with confidence levels
- **Rotation Analysis**: Compare 3 crop-rotation scenarios side-by-side with transparent, rule-based scoring

## ⚠️ Important Disclaimer

This tool supports — and does not replace — farmers and local agricultural experts. NASA POWER data is at approximately 0.5° resolution (~55 km) and does not represent field-level conditions. Crop data must be verified against local sources (e.g., Sri Lanka Department of Agriculture, FAO) before making farming decisions.

## 🔍 Limitations & Uncertainty

In alignment with the challenge criteria, this tool explicitly highlights uncertainty rather than masking it with false precision:

1. **Crop Data Unverified by Agronomists**: Quantitative agronomic parameters (e.g., precise crop water requirements, yield responses, nutrient demands) originate from preliminary public sources and have **not** been validated by an accredited agronomist or local agricultural extension officer. All quantitative placeholders are explicitly flagged in `TODO.md` and `data/crops.ts`.
2. **Comparative Scores, Not Yield Predictions**: The 0–1 scenario scores are designed strictly to compare relative trade-offs between crop sequences under prevailing climate and soil constraints. They are **not** predictive harvest forecasts, production guarantees, or financial projections.
3. **Cross-Basis Water Comparison Caveat**: Rainfall coverage compares each crop with its own specific requirement. Rice uses **total requirement** (including land preparation, puddling, and standing water / seepage: 948–1,232 mm; DOA/RRDI Mahailluppallama), whereas legumes use **crop water use** (consumptive evapotranspiration: 175–288 mm). Therefore, rainfall coverage is **NOT like-for-like across crops**, and legume seasons will appear higher partly due to this differing measurement basis.
4. **Coarse Spatial Resolution & Coastal Mixing**: NASA POWER satellite and assimilation datasets operate at ~0.5° × 0.5° spatial resolution (~55 km). While well-suited for regional climatology and multi-year trend analysis (Maha vs. Yala patterns), they do not capture field-scale microclimates, depressions, or localized tank command areas. Crucially, **coastal and shoreline grid cells mix terrestrial and marine surface models**, which can significantly distort terrestrial rainfall estimates (e.g., coastal dry-zone points showing inflated precipitation). For decision-support, always rely on inland agricultural points.
5. **Farmer Judgment Remains Primary**: No algorithmic scoring can account for plot-level pest histories, farmer labor availability, seed accessibility, or localized market dynamics. Field Shift provides evidence-based context to aid dialogue, leaving all management decisions with the farmer and local extension personnel.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router) + TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Map**: [Leaflet](https://leafletjs.com/) via [React Leaflet](https://react-leaflet.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

No database. No authentication. No LLM calls. No IoT.

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
│   ├── api/nasa-power/     # POWER proxy route handler
│   ├── layout.tsx          # Root layout with footer credit
│   └── page.tsx            # Main application page
├── components/             # React components
│   └── Charts/             # Recharts chart components
├── lib/
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # React hooks (useNasaData, etc.)
│   ├── engine/             # Rotation scoring engine (pure functions)
│   └── utils/              # Data processing utilities
├── data/
│   └── crops.ts            # Crop characteristic data (mostly unverified)
├── __tests__/              # Unit tests
├── TODO.md                 # Unverified / placeholder items tracker
└── README.md
```

## License

TBD — hackathon submission.
