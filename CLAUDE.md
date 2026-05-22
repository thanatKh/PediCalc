# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build → dist/
npm run preview    # serve the dist/ folder locally
npm run lint       # ESLint
```

No test suite is configured.

## Architecture

**PediCalc** is a single-page React app (Vite 8, React 19, Tailwind CSS v4) for calculating Neonatal/Pediatric TPN (Total Parenteral Nutrition) at Kabinburi Hospital.

### Routing

There is **no react-router-dom**. Navigation is a single `useState('tpn-newborn')` in `src/App.jsx`. The sidebar calls `onSelect(key)`; App renders the matching module.

### Calculation engine

`src/utils/tpnCalculator.js` — pure function `calculateTPN(inputs) → results`. All clinical logic lives here. It returns volumes (ml), GIR, osmolarity, DSF, energy breakdown, infusion rates, Ca×P, and `isWaterNegative`. **Edit this file when changing any clinical formula.**

### Main calculator component

`src/components/TPNCalculator.jsx` — the only active module. Key points:
- `DEFAULTS` object defines all input fields and their default values.
- `useMemo(() => calculateTPN(inputs), [inputs])` — results recalculate on every input change.
- `handleExportPDF` **lazy-loads** `@react-pdf/renderer` and `TPNPdfTemplate` on click (not on page load) to keep the initial bundle small (~54 KB gzip). Do not move these imports to the top of the file.
- Uses `NumberTicker` (from `@magicui`) for animated stat values and `ShimmerButton` for the export button.

### PDF export

`src/components/TPNPdfTemplate.jsx` — uses `@react-pdf/renderer` (`<Document>`, `<Page>`, `<Text>`, `<View>`, `<Image>`). **No HTML/CSS here** — all layout is via react-pdf's StyleSheet (pt units). Thai fonts (Sarabun + Kanit) are TTF files in `public/fonts/` and registered via `Font.register()` at the top of the file. The export handler in TPNCalculator pre-fetches the logo as a base64 data URL before rendering.

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin. Custom tokens defined in `src/index.css` under `@theme {}`. No `tailwind.config.js`.
- Brand color: `#0d6e6e` (deep teal). Alias: `teal-600`.
- Custom utility classes: `.bg-dot-grid`, `.glass-card`, `.stat-pill`, `.nav-item`, `.alert-enter`, `.animate-fade-up`, `.stagger`.
- Font classes: `font-sans` = Sarabun, `font-mitr` = Kanit.

### shadcn/ui

Config in `components.json`. Style: `new-york`, base: `radix`, no TypeScript. Install components with `npx shadcn@latest add <component>`. Installed: button, card, input, label, switch, number-ticker, shimmer-button.

### Key constraints

- **`html2canvas` and `jsPDF` have been removed.** The PDF pipeline is entirely `@react-pdf/renderer`. Do not re-add them.
- The `@` alias maps to `./src/`. Use `@/components/...`, `@/utils/...`, `@/lib/utils` etc.
- Vite 8 uses **rolldown** under the hood. `manualChunks` must be a function, not an object.
- `src/components/LandingPage.jsx` has been deleted. Do not reference it.
