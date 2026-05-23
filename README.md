# PediCalc

**Neonatal & Pediatric TPN Calculator** — โรงพยาบาลกบินทร์บุรี (Kabinburi Hospital)

A clinical web PWA for calculating Total Parenteral Nutrition (TPN) formulas for newborns and pediatric patients. Designed for physicians and pharmacists.

---

## Features

- **Real-time TPN calculation** — volumes, GIR, osmolarity, DSF, energy distribution, infusion rates
- **Clinical safety checks** — GIR, osmolarity, fat infusion rate, Ca × PO₄ compatibility
- **Hard input validation** — blocks export when values are outside safe clinical ranges (BW, dextrose%, protein, lipid, electrolytes, heparin); shows amber warnings for out-of-range but permissible values
- **Peripheral vs Central line** risk alerts
- **Text-based PDF export** — selectable, searchable, print-ready A4 order form with Thai/English fonts
- **PDF order fidelity** — when a prescribed lipid rate differs from calculated, the PDF shows both values and flags the deviation with a warning banner
- **PWA (Progressive Web App)** — installable on iPhone/Android ("Add to Home Screen"), works offline for the app shell, opens like a native app
- **Mobile PDF share** — on mobile, the PDF preview modal opens in-app; tap แชร์ to share via OS share sheet (Line, AirDrop, etc.) with the correct filename
- **Desktop print + download** — print button opens the PDF in a new tab for direct printing; download saves the file with a meaningful filename
- **iPhone safe area support** — Dynamic Island and notch are respected with `env(safe-area-inset-*)` on all fixed/sticky elements
- **Responsive UI** — works on desktop and mobile with collapsible sidebar
- **Animated interface** — spring-physics number counters, shimmer export button

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 (rolldown) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (new-york style) + MagicUI |
| PDF Generation | @react-pdf/renderer |
| Icons | Lucide React |
| PWA | Web App Manifest + Service Worker (sw.js) |
| Tests | Vitest |

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Run regression tests
npm test
```

## Project Structure

```
src/
├── App.jsx                        # State-based router (no react-router-dom)
├── index.css                      # Tailwind v4 theme tokens + custom utilities
├── main.jsx
├── hooks/
│   └── useTPNForm.js              # Form state, reset, results, validation, PDF export
├── utils/
│   ├── clinicalConstants.js       # All named clinical constants (no magic numbers)
│   ├── tpnCalculator.js           # Pure calculation engine (all clinical logic)
│   ├── tpnValidation.js           # Input validation — errors (block export) + warnings
│   ├── fmt.js                     # Shared number formatting helper
│   └── tpnCalculator.test.js      # Vitest regression tests (27 cases)
├── components/
│   ├── Sidebar.jsx                # Collapsible navigation sidebar (safe-area aware)
│   ├── TPNCalculator.jsx          # Thin shell — composes all section components
│   ├── TPNPdfTemplate.jsx         # react-pdf A4 document with embedded Thai fonts
│   ├── PdfModalContent.jsx        # PDF preview modal + blob generation for actions
│   ├── tpn/
│   │   ├── ui.jsx                 # Shared primitives: SectionCard, NumberField, StatPill
│   │   ├── PatientInfoSection.jsx
│   │   ├── MacroSection.jsx
│   │   ├── ElectrolyteSection.jsx
│   │   ├── VitaminSection.jsx
│   │   ├── HeparinSection.jsx
│   │   ├── RateSection.jsx
│   │   ├── ResultsPanel.jsx       # Always visible — shows — placeholders before BW entered
│   │   └── IngredientsTable.jsx
│   └── ui/                        # shadcn/ui + MagicUI components
public/
├── sw.js                          # Service Worker v2: app shell cache + PDF preview URLs
├── manifest.webmanifest           # PWA manifest (standalone, teal theme, Thai lang)
├── fonts/                         # Sarabun + Kanit TTF files (embedded in PDF)
├── icons/                         # 9 PNG icon sizes for PWA / Apple Touch Icon
└── logo-kabinburi.PNG             # Hospital logo
```

## Input Validation

`src/utils/tpnValidation.js` validates all clinical fields against physiological limits:

| Field | Hard error (blocks export) | Warning (amber, allows export) |
|---|---|---|
| BW | < 0.3 kg or > 20 kg | — |
| Fluid volume | < 20 or > 200 ml/kg | > 150 ml/kg |
| Dextrose | < 2% or > 25% | > 12.5% on peripheral |
| Protein | > 5 g/kg/day | > 4 g/kg/day |
| Lipid | > 4 g/kg/day | > 3 g/kg/day |
| Na (total) | > 10 mEq/kg/day | > 5 mEq/kg/day |
| K (total) | > 6 mEq/kg/day | > 4 mEq/kg/day |
| Ca | > 2 mmol/kg/day | > 1.5 mmol/kg/day |
| Mg | > 1.0 mEq/kg/day | > 0.5 mEq/kg/day |
| Heparin | > 1.0 IU/ml | — |

## PDF Export

The PDF is generated as a true text-based document (selectable, searchable) using `@react-pdf/renderer` with embedded Thai fonts (Sarabun + Kanit via absolute TTF URLs). The library is **lazy-loaded** on export click — not in the initial bundle — keeping initial load small.

When a prescribed lipid rate is entered and differs from the calculated rate by more than 0.5 ml/hr, the PDF banner shows both values and a `LIPID RATE MISMATCH` warning banner appears in the alerts section.

Thai text corruption is prevented by:
1. Registering fonts with `window.location.origin + '/fonts/...'` (absolute URL)
2. `Font.registerHyphenationCallback((word) => [word])` to disable English hyphenation on Thai text

## PWA / Mobile App

- Add to Home Screen on iPhone: tap Share → "Add to Home Screen" → opens full-screen with teal status bar
- Add to Home Screen on Android: browser prompts automatically via `manifest.webmanifest`
- Safe area: all fixed/sticky elements use `env(safe-area-inset-top)` so content clears Dynamic Island and notch
- Mobile PDF flow: Export opens an in-app modal with a PDF preview; tap แชร์ to share via the OS share sheet with the correct filename (Web Share API with `File` object)

## Regression Tests

```bash
npm test
```

27 table-driven tests in `src/utils/tpnCalculator.test.js` covering:
- Null return on zero/empty BW
- Normal newborn: total volume, TPN volume, DSF, sterile water, heparin, lipid rate
- GIR low / safe / high thresholds
- Water-negative case
- Peripheral line risk
- Fat rate safety (fatRateHigh)
- Ca × PO₄ precipitation flag
- Energy percentages summing to 100%
- Linear volume scaling across patient weights

## Clinical Modules

| Module | Status |
|---|---|
| TPN Calculator (Newborn / Pediatric) | Active |
| Pediatric Dosing | Coming soon |
| Fluid Resuscitation / BSA | Coming soon |
| Growth & Vitals | Coming soon |

---

> *PediCalc supports clinical decision-making only — the prescribing physician must review all outputs before use.*
> เอกสารสร้างจาก PediCalc — กรุณาตรวจสอบก่อนใช้งานทุกครั้ง
