# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build → dist/
npm run preview    # serve the dist/ folder locally
npm run lint       # ESLint
npm test           # Vitest regression tests (28 cases)
```

## What PediCalc Is

**PediCalc** is a multi-hospital, multi-module pediatric clinical calculator PWA (React 19, Vite 8, Tailwind CSS v4). It is the **app brand** — not tied to any specific module or hospital.

- The **sidebar** carries the PediCalc identity: app logo (`public/logo-pedicale.PNG`), brand teal `#0d6e6e`, "Pediatric Drug Calculator" subtitle. This never changes regardless of hospital selection.
- The **hospital identity** (logo, color) is scoped only to: the hospital picker badge in the sidebar, and the PDF header on printed documents.
- Each **module** owns its own header title (e.g. "Neonatal TPN Calculator") — no hospital branding bleeds into module headers.
- The **app UI chrome** (nav active states, buttons, sidebar) always uses `APP_COLOR = '#0d6e6e'` — hospital switching never changes UI colors.

### Current modules

| Key | Status | Description |
|---|---|---|
| `tpn-newborn` | Live | Neonatal TPN Calculator |
| `pediatric-dose` | Soon | Pediatric Drug Dosing |
| `fluid-resus` | Soon | IV Fluid Resuscitation |
| `growth-chart` | Soon | Growth & Vitals |

## Architecture

### Routing

No react-router-dom. Navigation is a single `useState('tpn-newborn')` in `src/App.jsx`. The sidebar calls `onSelect(key)`; App renders the matching module.

### Multi-hospital support

`src/utils/hospitals.js` — exports `APP_LOGO`, `APP_COLOR` (app-level, always teal), and `HOSPITALS` map keyed by hospital ID (`kabinburi`, `abhaibhubejhr`). Each hospital entry has `nameTh`, `nameEn`, `shortName`, `logo`, `logoSidebar`, `logoForPdf`, `themeColor`, `sidebarBg`.

- `APP_COLOR` and `APP_LOGO` are used everywhere in the web UI chrome.
- `hospital.themeColor` / `hospital.logoForPdf` are used **only** in the hospital picker badge and PDF output.
- `src/hooks/useHospital.js` — reads/writes `pedicale-hospital` in `localStorage`.

To add a new hospital: add an entry to `HOSPITALS`, add logo files to `public/`, done.

### Calculation engine

`src/utils/tpnCalculator.js` — pure function `calculateTPN(inputs) → results`. All clinical logic lives here. Returns volumes (ml), GIR, osmolarity, DSF, energy breakdown, infusion rates, Ca×P, and `isWaterNegative`. **Edit this file when changing any clinical formula.**

### Clinical constants

`src/utils/clinicalConstants.js` — every magic number used across the codebase is defined here as a named export. **Never hardcode clinical numeric literals elsewhere — add a constant here instead.**

### Input validation

`src/utils/tpnValidation.js` — `validateTPNInputs(inputs) → { errors, warnings }`. `errors` are hard blocks (export disabled); `warnings` are amber notices (export still allowed). **Add hard-block checks here only.**

### Clinical Decision Support

`src/utils/clinicalDecisionSupport.js` — `evaluateClinicalTiers(inputs, results) → checks`. Evaluates 15 parameters against PediNAT B.E. 2565 thresholds: fluid, GIR, protein, lipid, Na, K, Ca, PO₄, Mg, osmolarity, dextrose %, Ca×PO₄ precipitation, Ca/PO₄ balance, total energy, NPC:N ratio. Each check returns `{ tier, value, message, risk }` where `tier` is `'critical'` | `'moderate'` | `'safe'`.

**Critical tier does NOT block export** — advisory only. Only `tpnValidation.js` errors block export.

**Add new CDS range checks to `clinicalDecisionSupport.js`**, not to `tpnValidation.js`, unless the check must hard-block export.

`clinicalDecisionSupport.js` also exports `CDS_PARAM_LABELS` — a 18-key map of check key → display label. This is the **single source of truth** for CDS display names used by both `TPNCalculator.jsx` and `ClinicalAlertsPanel.jsx`. When adding a new CDS check, add its label here.

`src/components/tpn/ClinicalAlertsPanel.jsx` — renders the tiered alert panel. Accepts a `cds` prop (pre-computed result from `useTPNForm`). `FIELD_MAP` inside this file drives scroll-to-field navigation per check key — add a field map entry here when adding a new CDS check. Display labels come from `CDS_PARAM_LABELS` imported from `clinicalDecisionSupport.js`.

### Formatting helper

`src/utils/fmt.js` — single `fmt(n, d)` export. Used by both the web UI and PDF template. **Do not redeclare it in component files.**

### Custom hook

`src/hooks/useTPNForm.js` — encapsulates all form state, `results`, `validation`, `cds`, `isExporting`, and `handleExportPDF`. `cds` is a `useMemo`-wrapped result of `evaluateClinicalTiers(inputs, results)` — computed once here and threaded as a prop to avoid duplicate evaluation. The export handler opens a blank tab synchronously (beats popup blockers), then generates the PDF blob, stores it in the SW cache via `REGISTER_PDF`, and navigates the tab to `/pdf-preview/{filename}`. Uses `createElement` from React — **not JSX** — since the file is `.js`.

Export is blocked when: `results` is null, `isWaterNegative`, currently exporting, or `validation.errors.length > 0`.

### Main calculator component

`src/components/TPNCalculator.jsx` — thin shell. Imports `useTPNForm` (which now returns `cds`) and composes all section components. **Do not add business logic here.**

- Destructures `cds` from `useTPNForm` and passes **flat primitive props** to each section component (e.g. `fluidTier={cds.fluid?.tier}`, `proteinMessage={cds.protein?.message}`). This enables `React.memo` to bail out correctly — objects always have new references; primitive strings do not.
- `handleNavigateToField` is wrapped in `useCallback` to keep its reference stable across renders.
- Header and sidebar top bar both use `minHeight: calc(env(safe-area-inset-top) + 3.5rem)` for consistent height alignment.
- `canExport` gates the ShimmerButton.
- `exportDisabledReason` shown as tooltip on desktop, `alert()` on mobile.

### Section components

All in `src/components/tpn/`:

| File | Purpose |
|---|---|
| `ui.jsx` | Shared primitives: `SectionCard`, `NumberField`, `StatPill`, `AutoBadge`; re-exports `fmt` |
| `PatientInfoSection.jsx` | BW, patient type, line type |
| `MacroSection.jsx` | Dextrose %, protein, lipid targets |
| `ElectrolyteSection.jsx` | Na, K, Ca, Mg, PO₄ split-source inputs |
| `VitaminSection.jsx` | Soluvit, Vitalipid, Pediatrace |
| `HeparinSection.jsx` | Heparin concentration toggle + calculated units |
| `RateSection.jsx` | Manual TPN/lipid rate entry with deviation warning |
| `ResultsPanel.jsx` | Always visible — shows `—` when no results |
| `IngredientsTable.jsx` | Ingredients table with 2-in-1 / Lipid bag columns |
| `ClinicalAlertsPanel.jsx` | Tiered CDS alert panel — safe badge or rose/amber rows |

`NumberField` in `ui.jsx` suppresses native scroll-wheel and arrow-key increment on `<input type="number">` via `onWheel` blur + `onKeyDown` prevention.

All six input section components (`PatientInfoSection`, `MacroSection`, `ElectrolyteSection`, `VitaminSection`, `HeparinSection`, `RateSection`) are wrapped with `React.memo` and accept individual primitive props extracted from `inputs` and `cds`. Never pass the `inputs` object or `cds` object directly to these components.

### PDF export

`src/components/TPNPdfTemplate.jsx` — uses `@react-pdf/renderer`. No HTML/CSS — all layout via react-pdf `StyleSheet` (pt units). Thai fonts (Sarabun + Kanit) in `public/fonts/` registered with absolute URLs. Hyphenation disabled globally to prevent Thai character corruption.

PDF header uses `hospital.logoForPdf` (hospital-specific). Do not use `APP_LOGO` in the PDF.

**Unified export flow (desktop + mobile, same code path):**
1. `window.open('', '_blank')` fires synchronously on click — beats iOS popup blocker.
2. Async: logo fetch → dynamic import `@react-pdf/renderer` + `TPNPdfTemplate` → blob generation.
3. `storePdfInSW(blob, filename)` sends `REGISTER_PDF` to SW → SW caches at `/pdf-preview/{filename}` (10-min TTL) → returns path.
4. Tab navigates to `/pdf-preview/TPN-xxxx.pdf` → SW serves as `application/pdf` → native browser PDF viewer. On iOS/Android the user can share from the browser's native share sheet with the correct filename.

**Fallback (SW not yet active — first load / dev mode):**
- `storePdfInSW` returns `null`; blank tab closes; `<a download=filename>` triggers a named download directly.

**Stale URL handling:** If someone opens an expired or shared `/pdf-preview/` URL (cache miss), the SW serves a Thai-language redirect page that counts down 3 seconds then redirects to `/`.

Do **not** render `TPNPdfTemplate` twice concurrently (font cache corruption). `PdfModalContent.jsx` has been deleted — there is no modal.

### Service Worker

`public/sw.js` (SW v14, cache `pedicale-shell-v14`). Cache-first for static assets, network-first with app-shell fallback for navigation. Handles `REGISTER_PDF` message and `/pdf-preview/*` fetch intercept with 10-min TTL. TTL is stored as an `X-Expires` header (epoch ms) in the cached Response — **not** via `setTimeout`, because the browser can terminate the SW between uses and timers do not persist across SW restarts. The fetch handler reads this header and serves a friendly Thai-language redirect page on expiry or cache miss rather than a blank 404. Both the redirect page and the PDF generation error page use white-toned design with Sarabun + Kanit fonts loaded from `/fonts/`, matching the app's visual theme.

### PWA / Safe area

- `public/manifest.webmanifest` — `display: standalone`, `theme_color: #0d6e6e`, `lang: th`.
- All fixed/sticky top-edge elements use `env(safe-area-inset-top)` in inline styles.
- PWA icons in `public/icons/` (72–512px), generated from `public/logo-pedicale.PNG` via `sharp`.

### Styling

- **Tailwind CSS v4** — custom tokens in `src/index.css` under `@theme {}`. No `tailwind.config.js`.
- Brand color: `#0d6e6e` (deep teal) — `APP_COLOR` constant in `hospitals.js`, aliased as `teal-600` in CSS.
- Font classes: `font-sans` = Sarabun, `font-mitr` = Kanit.
- `.glass-card:hover` — shadow only, no transform (transform shifts input cards while typing).

### shadcn/ui

Style: `new-york`, base: `radix`, no TypeScript. Installed: alert, alert-dialog, badge, button, card, input, label, number-ticker, progress, separator, shimmer-button, slider, switch, tooltip.

### Regression tests

`src/utils/tpnCalculator.test.js` — 28 Vitest tests. **Run `npm test` after any formula change in `tpnCalculator.js`.**

## Key Constraints

- **`html2canvas` and `jsPDF` have been removed.** PDF pipeline is entirely `@react-pdf/renderer`. Do not re-add them.
- The `@` alias maps to `./src/`.
- Vite 8 uses **rolldown**. `manualChunks` must be a function, not an object.
- `useTPNForm.js` is `.js` — use `createElement`, not JSX.
- `ResultsPanel` always renders — uses `results?.field ?? '—'` for placeholders.
- `pako` must remain as a direct dependency (undeclared transitive dep of `@react-pdf/pdfkit`).
- `motion` (Framer Motion) and `class-variance-authority` have been removed. Do not re-add.
- `fmt` lives in `src/utils/fmt.js`. Do not redeclare it anywhere.
- `APP_COLOR` and `APP_LOGO` are app-level constants — never use `hospital.themeColor` for web UI chrome.
