# 🌾 Field Shift

**A farmer-friendly crop-rotation decision-support tool built on NASA Earth observations.**

Built for the **NASA Space Apps Challenge 2026**, challenge *"Field Shift: Adapting Farms with NASA Data"*, by **Galactic HQ**.

Field Shift helps Sri Lankan Dry Zone farmers explore what they could grow over the next three seasons. It combines 11 years of NASA POWER climate data for the farmer's location with sourced crop information, then compares **three rotation strategies** (the farmer's existing rotation and two alternatives). Every comparison shows its evidence, its risks and its data gaps.

> **It supports farmers and local agricultural experts. It does not replace them.** Scores compare options. They are not yield predictions. See [Limitations](#limitations-and-uncertainty).

---

## Contents

- [What the app does](#what-the-app-does)
- [How the analysis works](#how-the-analysis-works)
- [Limitations and uncertainty](#limitations-and-uncertainty)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Testing and verification](#testing-and-verification)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Data sources and citations](#data-sources-and-citations)
- [Contributing and open items](#contributing-and-open-items)
- [Credits and license](#credits-and-license)

---

## What the app does

### Farmer path (`/`)

A mobile-first wizard, one screen at a time, in **English, සිංහල (Sinhala) or தமிழ் (Tamil)**. There are no logins or registrations.

1. **Role**: Farmer or Researcher (Researcher opens the expert view).
2. **Language**: English, Sinhala or Tamil.
3. **Location**: the browser's "Use my location" button, or a preset list of inland Dry Zone and Intermediate Zone locations. The default is the Padaviya area, Anuradhapura District. Location is used only to look up rain data for the area.
4. **Current crops**: what the farmer grows in Maha and in Yala. This becomes **Strategy A, the existing rotation**.
5. **Alternative crops**: which other crops the farmer would consider. These shape **Strategies B and C**.
6. **Results**: three plain-language cards, one per strategy, showing the three-season timeline, rainfall coverage using the location's NASA rainfall numbers, risks, data gaps and climate-hazard advice from the crop recommendations book.

The five crops covered are **rice, green gram, cowpea, black gram and maize**. These are the only crops with data behind them.

### "Need Help?" button

A button on every screen opens a help sheet:

- **Pre-written guidance for each screen** in the selected language. It always works, even offline.
- **An optional question box** backed by the Google Gemini API through a server route. Its instructions limit it to the screen, the results and the book advice it is given. It is told to refuse pesticide, fertilizer-dosage and yield questions and to refer them to the local Agrarian Service Centre or the Department of Agriculture.
- **If Gemini is unavailable** (no key, quota, network, timeout), the sheet falls back to the static guidance and says help is unavailable.

### Expert view (`/expert`)

- 11-year monthly NASA POWER charts: rainfall, temperature and root-zone soil wetness.
- Interactive Leaflet map with inland presets.
- Soil input form where each field can be *Unknown*, and each value is tagged *Measured* or *Estimated*.
- Priority sliders (rainfall coverage, soil health). Economic potential is shown disabled as **Not assessed**.
- Strategy A customizer, full scenario cards, and a **Model Assumptions (Not Validated)** panel listing every heuristic constant.

---

## How the analysis works

Everything is a **transparent, rule-based model**. There is no machine learning and no AI-generated scoring.

### 1. Climate data (NASA POWER)

The app fetches daily data for the selected point from 2015-01-01 to 2025-12-31 (11 years): `PRECTOTCORR` (precipitation), `T2M` (air temperature), `RH2M` (relative humidity) and `GWETROOT` (root-zone soil wetness, 0 to 1). The `-999` fill value is converted to `null`. Daily values are aggregated into monthly climatologies, then into Maha (Oct to Mar) and Yala (Apr to Sep) totals.

### 2. Rainfall coverage

For each crop in each season:

```
rainfall coverage = min(1, rainfall over the crop's growth window ÷ midpoint of the crop's own water requirement)
```

- **Growth window:** starts at the book's sowing time and lasts `days to maturity ÷ 30` months (full months plus a proportional share of the last month).
- **Rice in Yala** has no sowing timeline in the book. It uses a documented fallback assumption.
- **Crops with no sourced water requirement (maize, black gram)** are **"Not assessed"**. The engine does not invent a number. The strategy is marked **partial** and is not directly comparable.
- **It ignores irrigation.** `1.0` means rainfall alone meets the crop's requirement over the window. Many Dry Zone farms rely on tank or canal water.

### 3. Soil health score

A heuristic score with a baseline, a penalty for 3-season monoculture, a penalty for consecutive cowpea, a bonus per legume season, and penalties for waterlogging-sensitive crops on poorly drained soil and for low organic carbon. Soil pH and texture are recorded for information but do not change scores. **All of these constants are unvalidated heuristics** and are listed in `lib/engine/assumptions.ts`, in the app's assumptions panel and in `TODO.md`.

### 4. Strategies

- **A:** the farmer's existing rotation (baseline).
- **B and C:** alternatives built from the crops the farmer would consider, such as a legume rotation and a diversified rotation.

Each strategy spans three seasons (Maha, Yala, Maha). The cards never rank strategies or label one "best".

### 5. Input completeness

The percentage on each card reflects how many inputs were provided (soil fields, crop water data, climate data). It does **not** validate the model.

---

## Limitations and uncertainty

The challenge asks for tools that show uncertainty. These are the main limits:

1. **Crop data is sourced but not agronomist-validated.** Values come from published Department of Agriculture papers and a crop recommendations book, and several are old single-site studies. See [data sources](#data-sources-and-citations). Items marked "general knowledge, not sourced" or "unverified" are flagged in `data/crops.ts` and `TODO.md`.
2. **Scores compare options, not outcomes.** They are not harvest forecasts, production guarantees or financial projections.
3. **Rainfall coverage is not like-for-like across crops.** Rice uses a **total requirement** (land preparation, puddling, standing water and seepage: 948 to 1,232 mm). Legumes use **crop water use** (about 175 to 288 mm). Legume seasons therefore look better partly because of this difference in measurement.
4. **Coarse resolution.** NASA POWER is about 0.5° (roughly 55 km). It does not capture fields, tank command areas or local microclimates. **Coastal cells mix land and ocean** and can distort rainfall, so use inland points.
5. **Dry Zone only.** Crop data comes from Dry Zone research stations. Locations outside an approximate Dry Zone bounding box (7.0°N to 10.0°N, 79.5°E to 81.5°E) get a warning, and locations outside Sri Lanka are not supported. The box is a rough guide, not a zone boundary.
6. **Economics is not assessed.** The only price data found is from 2013 and 2015. It is shown as a historic reference where available and is not used in scores.
7. **Irrigation is not modeled.** Tank, canal and groundwater supply are not included.
8. **The help assistant is limited by design** and can be wrong. It must not be used for chemical or fertilizer dosage. Sinhala and Tamil text, including crop names and agricultural terms, still needs review by native-speaking extension officers.
9. **Farmer judgment stays primary.** No model accounts for pest history, labor, seed access or local markets.

---

## Tech stack

| Area | Tool |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 |
| Map | [Leaflet](https://leafletjs.com/) with [React Leaflet](https://react-leaflet.js.org/), OpenStreetMap tiles |
| Charts | [Recharts](https://recharts.org/) |
| Climate data | [NASA POWER](https://power.larc.nasa.gov/) daily API (no key needed) |
| Help assistant | Google Gemini API (server-side, default model `gemini-3.5-flash-lite`) |
| Tests | [Vitest](https://vitest.dev/) |
| Hosting | [Vercel](https://vercel.com/) |

No database, no user accounts, no cookies, and no hardware or IoT components.

---

## Getting started

**Requirements:** Node.js **22.12 or newer** (Vitest 5 requires it; Next.js 16 itself needs 20.9 or newer) and npm.

```bash
git clone https://github.com/methsithchan/fieldshift.git
cd fieldshift
npm install
cp .env.example .env.local   # then add your Gemini key (optional, see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app works without a Gemini key. Only the optional question box in the help sheet needs one.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (`next build --webpack`) |
| `npm start` | Serve the production build |
| `npm test` | Run the unit tests |
| `npm run lint` | Lint the code |
| `npm run verify` | Run the live verification script (needs the dev server running) |

---

## Environment variables

Copy `.env.example` to `.env.local`. `.env.local` is git-ignored and **must never be committed**.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Only for the question box | Google AI Studio key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Used only on the server and never sent to the browser. |
| `GEMINI_MODEL` | No | Overrides the default model (`gemini-3.5-flash-lite`). |

On Vercel, add the same variables under *Project Settings → Environment Variables* for **both Production and Preview**.

**Help route details** (`app/api/help/route.ts`): the key is sent in the `x-goog-api-key` header; questions are capped at 300 characters; requests time out after 10 seconds; and there is a simple in-memory limit of 5 requests per minute per IP. On serverless hosting this limit is best-effort and resets on cold starts. Free-tier quotas change, so check your current limits in Google AI Studio. If the key is missing or the call fails, the static help text is shown.

**NASA POWER proxy** (`app/api/nasa-power/route.ts`): validates `lat`, `lon` and dates, applies a 15-second timeout, caches results in memory for 24 hours, and declares `maxDuration = 60`.

---

## Testing and verification

```bash
npm test
```

Runs **32 unit tests** across three files (rotation engine, soil form state, farmer strategy builder). They cover null handling, weight normalization, score bounds, partial results, the continuous-cowpea rule, the unknown-crop error and the soil form's "Unknown" reset behavior.

Two helper scripts need the dev server running on `localhost:3000`:

```bash
npm run verify              # prints per-step rainfall coverage for two real locations using live NASA data
bash scripts/test_help_api.sh   # exercises the help route (needs curl, jq and a real key for live answers)
```

---

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Keep the detected Next.js settings. `.npmrc` sets `legacy-peer-deps=true`.
3. Add `GEMINI_API_KEY` (optional) for Production and Preview.
4. Deploy, then open the live URL on a phone.

Load each preset location once before a demo to warm the cache.

---

## Project structure

```
├── app/
│   ├── api/
│   │   ├── help/route.ts         # Gemini help route (validated, rate-limited, falls back safely)
│   │   └── nasa-power/route.ts   # NASA POWER proxy (validation, cache, timeout)
│   ├── expert/page.tsx           # Expert view: map, charts, soil form, scenario cards
│   ├── layout.tsx                # Layout, footer credits
│   └── page.tsx                  # Farmer wizard
├── components/
│   ├── Charts/                   # Rainfall, temperature, soil wetness charts
│   ├── Wizard/HelpSheet.tsx      # "Need Help?" sheet
│   ├── Map.tsx, MapInner.tsx     # Leaflet map
│   ├── SoilForm.tsx              # Soil input with measured/estimated/unknown sources
│   ├── PrioritySliders.tsx
│   ├── ExistingRotationSelector.tsx
│   ├── ResultsCards.tsx          # Strategy cards
│   └── ModelAssumptionsPanel.tsx # Every heuristic constant, labeled unvalidated
├── lib/
│   ├── engine/
│   │   ├── rotation.ts           # Pure scoring engine
│   │   ├── farmer-strategies.ts  # Builds Strategies A, B and C from the farmer's choices
│   │   └── assumptions.ts        # All heuristic constants in one file
│   ├── hooks/useNasaData.ts
│   ├── types/                    # nasa, crops, engine types
│   └── utils/climate.ts          # Daily → monthly → seasonal aggregation
├── data/
│   ├── crops.ts                  # Crop catalog with a source string on every value
│   ├── crop_sourcing.ts          # Sowing timelines, hazard advice, historic budgets, district notes
│   ├── seasons.ts                # Maha and Yala month definitions
│   └── translations.ts           # UI and help text (en, si, ta)
├── scripts/                      # Live verification and help-route test
├── __tests__/                    # Vitest suites
├── TODO.md                       # Every unverified or placeholder item
├── .env.example
├── LICENSE
└── README.md
```

---

## Data sources and citations

> Most entries below were identified from search excerpts and should be opened and checked against the original document before being treated as final. Items marked **(confirm)** need that check.

### NASA and platform data

| Source | Used for |
|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 derived, 2015 to 2025) | Rainfall, temperature, humidity, root-zone soil wetness |
| [Challenge page](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) | Challenge requirements |
| [Google Gemini API](https://ai.google.dev/gemini-api/docs/text-generation) | Optional help assistant |
| © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | Map tiles |

> Climate data provided by the NASA Langley Research Center POWER Project, funded through the NASA Earth Science Directorate Applied Science Program.

### Crop and agronomy sources

| Value | Source |
|---|---|
| Rice total water requirement, 948 to 1,232 mm (Maha, Mahailluppallama) | Department of Agriculture, Rice Research and Development Institute, water management pages, <https://doa.gov.lk/?p=25931> |
| Green gram water use, 228 mm (Maha) and 270 mm (Yala) | Crop coefficient and crop water requirement of mung bean in DL1b, *Annals of the Sri Lanka Department of Agriculture*, 2014, <https://dl-doa.nsf.gov.lk/bitstreams/db37faca-8071-4286-b12c-4f138430a939/download> |
| Cowpea water use, 175 to 288 mm | Liyanage (1992) thesis record, "Possibility of growing interseasonal crops using residual moisture in paddy fields in dry zone of Sri Lanka", <https://agris.fao.org/search/en/records/6472350508fd68d546000f1e> **(confirm author and year)** |
| Cowpea temperature, waterlogging sensitivity, no continuous cowpea, 75 to 90 days | DOA Regional Agriculture Research and Development Centre, Kilinochchi, <https://doa.gov.lk/?p=109021> |
| Maize maturity, 105 to 110 days | Karunaratne (2006), *Annals of the Sri Lanka Department of Agriculture*, <https://dl-doa.nsf.gov.lk/bitstreams/1af7b1cc-c5da-41cf-9189-db9bf5521665/download> **(confirm author and year)** |
| Black gram duration and temperature | Secondary copy of DOA text, <https://srikanchana.blogspot.com/2014/10/mungbean-introduction-blackgram-is-one.html>. **Find the original DOA text.** |
| Rice maturity classes | Illangakoon et al., *Annals of the Sri Lanka Department of Agriculture*, <https://dl-doa.nsf.gov.lk/bitstreams/8acb5a6f-fc5b-4147-8db4-7dbd79332e48/download> **(confirm authors)** |
| Planned area by crop and season, 2024/25 | Ministry of Agriculture, Sri Lanka, <https://agrimin.gov.lk/wp-content/uploads/2025/01/for_printing_data_2025.pdf> |
| Maha and Yala months | FAO report cc3682en, <https://www.fao.org/3/cc3682en/cc3682en.pdf> (Maha September to March, Yala April to September; the Oct to Mar definition follows the Maha period used in FAO's irrigation project) **(confirm in the document)** |
| Padaviya coordinates (about 8.83°N, 80.76°E) | [Wikipedia: Padaviya Divisional Secretariat](https://en.wikipedia.org/wiki/Padaviya_Divisional_Secretariat), [BirdLife Padaviya IBA](https://datazone.birdlife.org/site/factsheet/padaviya-iba-sri-lanka/map) |
| Sowing timelines, climate hazard advice, district recommendations, historic per-acre budgets (2013 and 2015 prices), pest calendar | **"The crop recommendations book"**. **Title, publisher and year are not yet confirmed.** Page numbers are recorded in `data/crop_sourcing.ts`. |

Values labeled *"general knowledge, not sourced"* (for example, legume nitrogen fixation) or *"unverified"* in `data/crops.ts` have no supporting source yet.

---

## Contributing and open items

`TODO.md` is the master list of everything unverified, placeholder or awaiting expert review. The most important items:

- Confirm the title, publisher and year of the crop recommendations book.
- Native-speaker review of all Sinhala and Tamil strings, crop names and the Tamil agricultural glossary.
- Verify the unconfirmed source details above and find the primary source for black gram.
- Validate or replace the heuristic scoring constants with agronomist-reviewed values.
- Add sourced water requirements for maize and black gram.
- Add irrigation (tank and canal) availability to the water model.

Possible future work: multi-farm comparison, PDF export, ground-based observations to complement satellite data, and finer-resolution climate sources.

---

## Credits and license

Developed by **Galactic HQ** for the NASA Space Apps Challenge 2026.

Released under the [MIT License](LICENSE).
