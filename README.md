# PediCalc

**Pediatric Clinical Calculator — เครื่องคำนวณทางคลินิกสำหรับเด็ก**

PediCalc is a multi-module, multi-hospital Progressive Web App (PWA) for pediatric and neonatal clinical use in Thai hospitals. It provides real-time calculations with built-in Clinical Decision Support (CDS) based on Thai national guidelines (PedNAT B.E. 2565).

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?logo=pwa&logoColor=white)

---

## Modules

| Module | Status | Description |
|---|---|---|
| Neonatal TPN Calculator | ✅ Live | TPN formulation for neonates — volumes, electrolytes, energy, CDS alerts, PDF export |
| Pediatric Drug Dosing | 🔜 Soon | Weight-based drug dose calculator |
| IV Fluid Resuscitation | 🔜 Soon | Fluid resuscitation and maintenance calculator |
| Growth & Vitals | 🔜 Soon | Growth chart and vital signs reference |

---

## Features

- **Real-time calculation** — all results update instantly as inputs change
- **Clinical Decision Support (CDS)** — 15-parameter tiered alerts (critical / caution) based on PedNAT 2565: fluid, GIR, protein, lipid, Na, K, Ca, PO₄, Mg, osmolarity, dextrose %, Ca×PO₄ precipitation, Ca/PO₄ balance, total energy, NPC:N ratio
- **Hard input validation** — blocks PDF export when values are outside safe clinical ranges; amber warnings for out-of-range but permissible values
- **PDF export** — opens in a new browser tab as a native PDF (A4, hospital logo, Thai fonts Sarabun + Kanit, full CDS alert summary); on iOS/Android users share directly from the browser's native share sheet with the correct filename
- **Multi-hospital** — hospital identity (logo, color) scoped to the PDF header and hospital picker; app chrome stays consistently teal
- **PWA** — installable on iOS and Android, works offline, iPhone Dynamic Island / notch safe-area aware
- **Mobile-first** — unified PDF flow across desktop and mobile (Service Worker intercept), responsive collapsible sidebar

---

## Supported Hospitals

- โรงพยาบาลกบินทร์บุรี (Kabinburi Hospital)
- โรงพยาบาลเจ้าพระยาอภัยภูเบศร (Chaophraya Abhaibhubejhr Hospital)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 (rolldown) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (new-york, radix base) |
| PDF | @react-pdf/renderer |
| Icons | lucide-react |
| Fonts | Sarabun + Kanit (self-hosted TTF) |
| Tests | Vitest (28 regression cases) |
| PWA Icons | sharp |

---

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint
npm test          # Vitest regression tests
```

---

## Project Structure

```
src/
├── App.jsx                        # State-based router (no react-router-dom)
├── index.css                      # Tailwind v4 theme tokens + custom utilities
├── hooks/
│   ├── useHospital.js             # Hospital selection — reads/writes localStorage
│   └── useTPNForm.js              # Form state, results, validation, PDF export
├── utils/
│   ├── hospitals.js               # HOSPITALS map + APP_LOGO + APP_COLOR constants
│   ├── clinicalConstants.js       # All named clinical numeric constants
│   ├── clinicalDecisionSupport.js # 15-parameter CDS tier evaluator
│   ├── tpnCalculator.js           # Pure TPN calculation engine
│   ├── tpnValidation.js           # Hard-block errors + amber warnings
│   ├── fmt.js                     # Shared number formatter
│   └── tpnCalculator.test.js      # Vitest regression tests
├── components/
│   ├── Sidebar.jsx                # Collapsible nav — PediCalc brand + hospital picker
│   ├── TPNCalculator.jsx          # TPN module shell — composes section components
│   ├── TPNPdfTemplate.jsx         # react-pdf A4 document, Thai fonts
│   └── tpn/
│       ├── ui.jsx                 # SectionCard, NumberField, StatPill, AutoBadge
│       ├── PatientInfoSection.jsx
│       ├── MacroSection.jsx
│       ├── ElectrolyteSection.jsx
│       ├── VitaminSection.jsx
│       ├── HeparinSection.jsx
│       ├── RateSection.jsx
│       ├── ResultsPanel.jsx
│       ├── IngredientsTable.jsx
│       └── ClinicalAlertsPanel.jsx
public/
├── sw.js                          # Service Worker v20 — app shell, PDF preview intercept, stale-URL redirect
├── manifest.webmanifest           # PWA manifest (standalone, teal, Thai)
├── logo-pedicale.PNG              # PediCalc app logo (web UI, PWA icons source)
├── logo-kabinburi.PNG             # Kabinburi hospital logo (PDF)
├── logo-abhaibhubejhr.png         # Abhaibhubejhr hospital logo (PDF)
├── fonts/                         # Sarabun + Kanit TTF (embedded in PDF)
└── icons/                         # PWA icons 72–512px
```

---

## Clinical Reference

- **PedNAT B.E. 2565** — Pediatric Nutrition Association of Thailand Neonatal Nutrition Guideline
- **ASPEN / ESPGHAN** neonatal nutrition guidelines (energy, NPC:N ratio)

---

## Developer

จัดทำโดย พญ.สมิตา สมโภชน์

---

> PediCalc supports clinical decision-making only. The prescribing physician must review all outputs before use with real patients.
> เอกสารสร้างจาก PediCalc — กรุณาตรวจสอบก่อนใช้งานทุกครั้ง
