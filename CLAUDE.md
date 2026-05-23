# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build → dist/
npm run preview    # serve the dist/ folder locally
npm run lint       # ESLint
npm test           # Vitest regression tests (27 cases)
```

## Architecture

**PediCalc** is a single-page React PWA (Vite 8, React 19, Tailwind CSS v4) for calculating Neonatal/Pediatric TPN (Total Parenteral Nutrition). Supports multiple hospitals with per-hospital branding.

### Routing

There is **no react-router-dom**. Navigation is a single `useState('tpn-newborn')` in `src/App.jsx`. The sidebar calls `onSelect(key)`; App renders the matching module.

### Multi-hospital support

`src/utils/hospitals.js` — `HOSPITALS` map keyed by hospital ID (currently `kabinburi`, `abhaibhubejhr`). Each entry has `nameTh`, `nameEn`, `shortName`, `logo`, `logoSidebar`, `logoForPdf`, `themeColor`, `sidebarBg`.

`src/hooks/useHospital.js` — reads/writes `pedicale-hospital` in `localStorage`. Returns `{ hospital, setHospital }`. Hospital object is passed down to `TPNCalculator` and `Sidebar`. The PDF and sidebar branding derive from the active hospital — **do not hardcode Kabinburi strings in new code**.

To add a new hospital: add an entry to `HOSPITALS`, add its logo files to `public/`, and optionally add a theme color token to `src/index.css`.

### Calculation engine

`src/utils/tpnCalculator.js` — pure function `calculateTPN(inputs) → results`. All clinical logic lives here. Returns volumes (ml), GIR, osmolarity, DSF, energy breakdown, infusion rates, Ca×P, and `isWaterNegative`. **Edit this file when changing any clinical formula.**

### Clinical constants

`src/utils/clinicalConstants.js` — every magic number used across the codebase is defined here as a named export (e.g. `CONC_NACL_3PCT`, `GIR_MAX_SAFE`, `CA_PO4_PRODUCT_THRESHOLD`). **Never hardcode clinical numeric literals elsewhere — add a constant here instead.**

### Input validation

`src/utils/tpnValidation.js` — `validateTPNInputs(inputs) → { errors, warnings }`. Called via `useMemo` in `useTPNForm` and exposed as `validation`. `errors` are hard blocks (export disabled); `warnings` are amber notices (export still allowed). **Add new clinical range checks here, not in the calculator or components.**

### Formatting helper

`src/utils/fmt.js` — single `fmt(n, d)` export. Used by both the web UI (via re-export from `tpn/ui.jsx`) and `TPNPdfTemplate.jsx`. **Do not add a second copy of this function anywhere.**

### Custom hook

`src/hooks/useTPNForm.js` — encapsulates all form state (`inputs`, `update`, `reset`), `results` (via `useMemo`), `validation` (via `useMemo`), `isExporting` (via `useTransition`), and `handleExportPDF`. The export handler pre-fetches the logo as a base64 data URL, then opens the PDF preview modal. Uses `createElement` from React — **not JSX** — since the file is `.js`.

Export is blocked when: `results` is null, `isWaterNegative`, currently exporting, or `validation.errors.length > 0`.

### Main calculator component

`src/components/TPNCalculator.jsx` — thin shell. Imports `useTPNForm` and composes all section components. **Do not add business logic here.** Key points:
- Header uses `env(safe-area-inset-top)` inline style to clear the iPhone Dynamic Island.
- `canExport` gates the ShimmerButton — disabled when `isWaterNegative`, no results, exporting, or any hard validation errors exist.
- `exportDisabledReason` is shown as a hint below the disabled button. On mobile, tapping the disabled button triggers an `alert()` with the reason.
- Validation errors render as a rose banner; warnings render as an amber banner above the input sections.

### Clinical Decision Support

`src/utils/clinicalDecisionSupport.js` — `evaluateClinicalTiers(inputs, results) → checks`. Evaluates 11 parameters (fluid, GIR, protein, lipid, Na, K, Ca, PO₄, Mg, osmolarity, dextrose %) against PediNAT B.E. 2565 thresholds. Each check returns `{ tier, value, message, risk }` where `tier` is `'critical'` | `'moderate'` | `'safe'`. **Critical tier does NOT block export** — it's advisory only; `tpnValidation.js` errors are what block export.

`countTiers(checks) → { critical, moderate, safe }` — convenience aggregator used by `ClinicalAlertsPanel`.

`src/components/tpn/ClinicalAlertsPanel.jsx` — renders the tiered alert panel. Shows a green "all safe" badge when everything passes; otherwise shows a rose/amber bordered panel with per-parameter rows. Receives `inputs`, `results`, `validation` props. Validation `errors` (from `tpnValidation.js`) render as ⛔ rows and are distinct from CDS `critical` tiers.

Animation replay on tier change uses a `transitionKey` state derived from `stateKey(hasErrors, critical, moderate, errorCount)`. When the key changes (safe↔alert or alert count changes) React remounts the component, replaying CSS `animation: ... both` keyframes. The animation classes (`cds-safe-enter`, `cds-alert-enter`, `cds-row-enter`, `cds-badge-pop`, `cds-safe-pulse`, `cds-safe-shimmer`) are defined in `src/index.css`.

**Add new clinical range checks to `clinicalDecisionSupport.js`, not to `tpnValidation.js`**, unless the check should hard-block export.

### Section components

All in `src/components/tpn/`:

| File | Purpose |
|---|---|
| `ui.jsx` | Shared primitives: `SectionCard`, `NumberField`, `StatPill`, `AutoBadge`; re-exports `fmt` from `@/utils/fmt` |
| `PatientInfoSection.jsx` | BW, patient type, line type |
| `MacroSection.jsx` | Dextrose %, protein, lipid targets |
| `ElectrolyteSection.jsx` | Na, K, Ca, Mg, PO₄ split-source inputs |
| `VitaminSection.jsx` | Soluvit, Vitalipid, Pediatrace (read-only calculated) |
| `HeparinSection.jsx` | Heparin concentration toggle + calculated units |
| `RateSection.jsx` | Manual TPN/lipid rate entry with deviation warning |
| `ResultsPanel.jsx` | Always visible — shows `—` when no results; alerts, stat pills, energy chart |
| `IngredientsTable.jsx` | Ingredients table with 2-in-1 / Lipid bag columns |
| `ClinicalAlertsPanel.jsx` | Tiered CDS alert panel — safe badge or rose/amber rows |

### PDF export

`src/components/TPNPdfTemplate.jsx` — uses `@react-pdf/renderer`. **No HTML/CSS** — all layout is via react-pdf's `StyleSheet` (pt units). Thai fonts (Sarabun + Kanit) are TTF files in `public/fonts/` registered with **absolute URLs** (`window.location.origin + '/fonts/...'`) to ensure react-pdf can fetch them. Hyphenation is disabled globally with `Font.registerHyphenationCallback((word) => [word])` to prevent Thai character corruption.

`fmt` is imported from `@/utils/fmt` — not redefined locally.

The PDF shows both calculated and prescribed lipid rates when a manual rate is entered. If the deviation exceeds `LIPID_RATE_WARN_THRESHOLD` (0.5 ml/hr), the banner is colored amber and a `LIPID RATE MISMATCH` warning banner appears in the alerts section.

`src/components/PdfModalContent.jsx` — lazy-loaded into the preview modal. Renders `PDFViewer` for in-app preview and fires `pdf(doc).toBlob()` in a `useEffect` to generate the blob URL for print/download/share buttons. Both use the same memoized `doc` instance — do **not** render `TPNPdfTemplate` twice concurrently (font cache corruption).

### PDF preview modal

`PdfPreviewModal` in `TPNCalculator.jsx` handles both desktop and mobile:
- **Desktop**: Print button (`window.open(blobUrl, '_blank')`) + Download link
- **Mobile** (`isMobile` constant, UA-sniffed at module level): Share button using Web Share API — `navigator.share({ files: [new File([blob], filename)] })` — to preserve the correct filename in the OS share sheet

### Service Worker

`public/sw.js` (SW v2, cache `pedicale-shell-v2`). Three behaviours:
1. **`REGISTER_PDF` message** — stores PDF ArrayBuffer in memory, maps it to `/pdf-preview/<filename>`, replies with the URL via MessageChannel.
2. **Navigate requests** — network-first with app-shell fallback (`/`).
3. **Static assets** — cache-first.

### PWA / Safe area

- `public/manifest.webmanifest` — `display: standalone`, `theme_color: #0d6e6e`, `lang: th`.
- `index.html` — `viewport-fit=cover`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`.
- All fixed/sticky elements that touch the top edge use `env(safe-area-inset-top)` in inline styles:
  - Sidebar header: `paddingTop: calc(env(safe-area-inset-top) + 1.25rem)`
  - App header inner div: `paddingTop: calc(env(safe-area-inset-top) + 0.75rem)`
  - Mobile menu button: `top: calc(env(safe-area-inset-top) + 0.625rem)`
- `body` background is `#ffffff` (white) so the iPhone home indicator area matches the white glass header; no bottom safe area padding.

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin. Custom tokens in `src/index.css` under `@theme {}`. No `tailwind.config.js`.
- Brand color: `#0d6e6e` (deep teal). Alias: `teal-600`.
- Custom classes: `.bg-dot-grid` (plain `#f0f4f4` background — no dot pattern), `.glass-card`, `.stat-pill`, `.nav-item`, `.alert-enter`, `.animate-fade-up`, `.stagger`.
- Font classes: `font-sans` = Sarabun, `font-mitr` = Kanit.
- `.glass-card:hover` — shadow only, **no transform** (transform causes input cards to shift while typing).

### shadcn/ui

Config in `components.json`. Style: `new-york`, base: `radix`, no TypeScript. Install components with `npx shadcn@latest add <component>`. Installed: alert, alert-dialog, badge, button, card, input, label, number-ticker, progress, separator, shimmer-button, slider, switch, tooltip.

### Regression tests

`src/utils/tpnCalculator.test.js` — 28 Vitest tests for `calculateTPN`. Run with `npm test`. Config in `vite.config.js` under the `test` key (`environment: 'node'`). **When changing any formula in `tpnCalculator.js`, run `npm test` to check for regressions.**

### Key constraints

- **`html2canvas` and `jsPDF` have been removed.** PDF pipeline is entirely `@react-pdf/renderer`. Do not re-add them.
- The `@` alias maps to `./src/`. Use `@/components/...`, `@/utils/...`, `@/lib/utils` etc.
- Vite 8 uses **rolldown**. `manualChunks` must be a function, not an object.
- `src/components/LandingPage.jsx` and `src/assets/` have been deleted. Do not reference them.
- `useTPNForm.js` is a `.js` file — use `createElement` from React, not JSX syntax.
- `ResultsPanel` always renders (no early `return null`) — uses `results?.field ?? '—'` for placeholders.
- `pako` must remain as a direct dependency — it is an undeclared transitive dep of `@react-pdf/pdfkit` and the build fails without it even though app code never imports it directly.
- `motion` (Framer Motion) has been removed. Do not re-add it.
- `class-variance-authority` has been removed. Do not use `cva()`.
- `fmt` lives in `src/utils/fmt.js`. Do not redeclare it in component files.
