# PediCalc

**Neonatal & Pediatric TPN Calculator** — โรงพยาบาลกบินทร์บุรี (Kabinburi Hospital)

A clinical web PWA for calculating Total Parenteral Nutrition (TPN) formulas for newborns and pediatric patients. Designed for physicians and pharmacists.

---

## Features

- **Real-time TPN calculation** — volumes, GIR, osmolarity, DSF, energy distribution, infusion rates
- **Clinical safety checks** — GIR, osmolarity, fat infusion rate, Ca × PO₄ compatibility
- **Peripheral vs Central line** risk alerts
- **Text-based PDF export** — selectable, searchable, print-ready A4 order form with Thai/English fonts
- **PWA (Progressive Web App)** — installable on iPhone/Android ("Add to Home Screen"), works offline for the app shell, opens like a native app
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
```

## Project Structure

```
src/
├── App.jsx                        # State-based router (no react-router-dom)
├── index.css                      # Tailwind v4 theme tokens + custom utilities
├── main.jsx
├── hooks/
│   └── useTPNForm.js              # All form state, reset, results, PDF export logic
├── utils/
│   ├── clinicalConstants.js       # All named clinical constants (no magic numbers)
│   └── tpnCalculator.js           # Pure calculation engine (all clinical logic)
├── components/
│   ├── Sidebar.jsx                # Collapsible navigation sidebar (PWA-safe, safe-area aware)
│   ├── TPNCalculator.jsx          # Thin shell — composes all section components
│   ├── TPNPdfTemplate.jsx         # react-pdf A4 document with embedded Thai fonts
│   ├── tpn/
│   │   ├── ui.jsx                 # Shared primitives: fmt, SectionCard, NumberField, StatPill
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

## PDF Export

The PDF is generated as a true text-based document (selectable, searchable) using `@react-pdf/renderer` with embedded Thai fonts (Sarabun + Kanit via absolute TTF URLs). The library is **lazy-loaded** on export click — not in the initial bundle — keeping initial load small.

The Service Worker intercepts `/pdf-preview/<filename>` requests so the browser save dialog shows a meaningful filename (e.g. `TPN_HN_2.5kg_20260522.pdf`) instead of a UUID blob URL.

Thai text corruption is prevented by:
1. Registering fonts with `window.location.origin + '/fonts/...'` (absolute URL)
2. `Font.registerHyphenationCallback((word) => [word])` to disable English hyphenation on Thai text

## PWA / Mobile App

- Add to Home Screen on iPhone: tap Share → "Add to Home Screen" → opens full-screen with teal status bar
- Add to Home Screen on Android: browser prompts automatically via `manifest.webmanifest`
- Safe area: all fixed/sticky elements use `env(safe-area-inset-top)` so content clears Dynamic Island and notch

## Clinical Modules

| Module | Status |
|---|---|
| TPN Calculator (Newborn) | Active |
| Pediatric Dosing | Coming soon |
| Fluid Resuscitation / BSA | Coming soon |
| Growth & Vitals | Coming soon |

---

> *PediCalc supports clinical decision-making only — the prescribing physician must review all outputs before use.*
> เอกสารสร้างจาก PediCalc — กรุณาตรวจสอบก่อนใช้งานทุกครั้ง
