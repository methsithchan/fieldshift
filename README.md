# 🌾 Field Shift — Crop Rotation Decision Support

> **NASA Space Apps 2026** — "Field Shift: Adapting Farms with NASA Data"

A decision-support tool that uses NASA Earth observations plus local soil information to help farmers explore crop-rotation strategies that strengthen soil health and resilience to changing weather and water conditions.

## What It Does

- **Map**: Click to select a farm location (defaults to Padaviya area, Anuradhapura, Sri Lanka)
- **NASA Climate Data**: 10 years of daily climate observations from NASA POWER (precipitation, temperature, humidity, root-zone soil wetness)
- **Charts**: Monthly rainfall totals, temperature trends, and soil moisture patterns
- **Soil Input**: Enter local soil characteristics (pH, texture, organic carbon, drainage) with confidence levels
- **Rotation Analysis**: Compare 3 crop-rotation scenarios side-by-side with transparent, rule-based scoring
- **Transparency**: Every data source cited, every uncertainty surfaced, every gap flagged

## ⚠️ Important Disclaimer

This tool supports — and does not replace — farmers and local agricultural experts. NASA POWER data is at approximately 0.5° resolution (~55 km) and does not represent field-level conditions. Crop data must be verified against local sources (e.g., Sri Lanka Department of Agriculture, FAO) before making farming decisions.

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
| Climate (precipitation, temperature, humidity, root-zone soil wetness) | [NASA POWER](https://power.larc.nasa.gov/) | ~0.5° (~55 km), daily | 2015–2025. Free, no API key. `-999` = missing value. |
| Soil properties | User input | Field-level | Self-reported with confidence labels |
| Crop characteristics | `data/crops.ts` | — | **Most values are UNVERIFIED placeholders.** See `TODO.md`. |

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
