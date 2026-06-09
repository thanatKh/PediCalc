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

### Sidebar auto-collapse

`src/components/Sidebar.jsx` auto-collapses to the 52px icon rail when the user first focuses any `input`, `select`, or `textarea` — but only on desktop at window widths **1024px–1279px**. At ≥ 1280px the sidebar and content both fit, so auto-collapse is skipped. At < 1024px the sidebar is a mobile overlay — auto-collapse does not apply. After an auto-collapse the user can manually reopen; the next input focus will auto-collapse again. Two module-scope helpers drive this: `isMobile()` (< 1024px) and `isWide()` (≥ 1280px).

### Multi-hospital support

`src/utils/hospitals.js` — exports `APP_LOGO`, `APP_COLOR` (app-level, always teal), and `HOSPITALS` map keyed by hospital ID (`kabinburi`, `abhaibhubejhr`). Each hospital entry has `nameTh`, `nameEn`, `shortName`, `logo`, `logoSidebar`, `logoForPdf`, `themeColor`, `sidebarBg`.

- `APP_COLOR` and `APP_LOGO` are used everywhere in the web UI chrome.
- `hospital.themeColor` / `hospital.logoForPdf` are used **only** in the hospital picker badge and PDF output.
- `src/hooks/useHospital.js` — reads/writes `pedicale-hospital` in `localStorage`.

To add a new hospital: add an entry to `HOSPITALS`, add logo files to `public/`, done.

### Calculation engine

`src/utils/tpnCalculator.js` — pure function `calculateTPN(inputs) → results`. All clinical logic lives here. Returns volumes (ml), GIR, osmolarity, DSF, energy breakdown, infusion rates, Ca×P, and `isWaterNegative`. **Edit this file when changing any clinical formula.**

Key rate fields:
- `calcTPNRate = (tpnVolume - NEWBORN_LINE_RESERVE_ML) / HOURS_PER_DAY` — the correct pump rate, excluding the 25 ml line reserve that remains in the bag and is never infused. **Do not use `tpnVolume / 24` for the pump rate.**
- `lipidRate = lipidBagVol / HOURS_PER_DAY` — lipid bag runs to completion (no dead-space deduction).

DSF (Dead Space Factor):
- `dsf = tpnVolume / (tpnVolume - NEWBORN_LINE_RESERVE_ML)` — scales TPN-bag nutrients (Aminoven, Na/K/Ca/Mg, Soluvit, Pediatrace) up so the patient still receives the intended per-kg dose despite the 25 ml line reserve. **Based on `tpnVolume`, not `totalVolume`** — the 25 ml dead space is in the 2-in-1 TPN line only; the lipid bag runs on a separate Y-site line. The DSF block must therefore sit *after* `tpnVolume` is derived. **Full precision — not pre-rounded;** rounding happens only at display.
- Not applied to dextrose (concentration-based on `tpnVolume`) or lipid/Vitalipid (separate bag).

### Clinical constants

`src/utils/clinicalConstants.js` — every magic number used across the codebase is defined here as a named export. **Never hardcode clinical numeric literals elsewhere — add a constant here instead.**

### Input validation

`src/utils/tpnValidation.js` — `validateTPNInputs(inputs) → { errors, warnings }`. `errors` are hard blocks (export disabled); `warnings` are amber notices (export still allowed). **Add hard-block checks here only.**

### Clinical Decision Support

`src/utils/clinicalDecisionSupport.js` — `evaluateClinicalTiers(inputs, results) → checks`. Evaluates 15 parameters against PedNAT B.E. 2565 thresholds: fluid, GIR, protein, lipid, Na, K, Ca, PO₄, Mg, osmolarity, dextrose %, Ca×PO₄ precipitation, Ca/PO₄ balance, total energy, NPC:N ratio. Each check returns `{ tier, value, message, risk }` where `tier` is `'critical'` | `'moderate'` | `'safe'`.

Key threshold notes (all in `clinicalConstants.js`):
- **K:** safe ≤ 3, moderate 3–3.5 (`K_MODERATE_HIGH`), critical > 4 (`K_CRITICAL_HIGH`) — three distinct bands.
- **PO₄:** moderate-high band added at 1.8 (`PO4_MODERATE_HIGH`); critical raised to 2.5 (`PO4_CRITICAL_HIGH`). `PO4_SAFE_MAX = 2.0` is the upper safe limit, distinct from the critical threshold.
- **Mg default:** `mgTarget` default is `'0.3'` (= `MG_CDS_SAFE_MIN`) — do not lower it or the fresh-load state fires a CDS alert.

**Critical tier does NOT block export** — advisory only. Only `tpnValidation.js` errors block export.

**Add new CDS range checks to `clinicalDecisionSupport.js`**, not to `tpnValidation.js`, unless the check must hard-block export.

`clinicalDecisionSupport.js` also exports `CDS_PARAM_LABELS` — a 18-key map of check key → display label. This is the **single source of truth** for CDS display names used by both `TPNCalculator.jsx` and `ClinicalAlertsPanel.jsx`. When adding a new CDS check, add its label here.

`src/components/tpn/ClinicalAlertsPanel.jsx` — renders the tiered alert panel. Accepts a `cds` prop (pre-computed result from `useTPNForm`). `FIELD_MAP` inside this file drives scroll-to-field navigation per check key — add a field map entry here when adding a new CDS check. Display labels come from `CDS_PARAM_LABELS` imported from `clinicalDecisionSupport.js`.

### Formatting helpers

`src/utils/fmt.js` — exports two functions used by both web UI and PDF template. **Do not redeclare either in component files.**

- `fmt(n, d)` — formats `n` to exactly `d` decimal places using `toLocaleString('en-US')`. Returns `'—'` for null/NaN.
- `fmtN(n)` — **the standard display format**: integer values → no decimal (`"5"`), fractional → 1 decimal (`"14.4"`), null/NaN → `'—'`. Use this everywhere except: Fat Infusion Rate (use `fmt(n, 2)`), and places where a fixed decimal count is clinically required.
- `reconciledSterileWater(results, decimals)` — **display-only** sterile water = `round(tpnVolume) − Σ round(TPN-bag components)` at the given decimal place. Makes the printed/displayed ingredient column sum *exactly* to the displayed TPN bag total (Option B reconciliation); the rounding residue (≤ ~0.16 ml) is absorbed by sterile water, which is q.s. by definition. **The engine's `results.sterileWaterMl` stays full precision — do not change it.** Use `decimals=1` in the PDF (`fmtN` granularity), `decimals=2` in the on-screen `IngredientsTable`. Both `TPNPdfTemplate.jsx` and `IngredientsTable.jsx` render sterile water through this helper, **not** `results.sterileWaterMl` directly.

In `TPNPdfTemplate.jsx`, `fmtPrep` is an alias for `fmtN` used in the Preparation Order table.

### Custom hook

`src/hooks/useTPNForm.js` — encapsulates all form state, `results`, `validation`, `cds`, `isExporting`, and `handleExportPDF`. `cds` is a `useMemo`-wrapped result of `evaluateClinicalTiers(inputs, results)` — computed once here and threaded as a prop to avoid duplicate evaluation. The export handler opens a blank tab synchronously (beats popup blockers), generates the PDF blob asynchronously, then routes to the platform-specific path (see PDF export section). Uses `createElement` from React — **not JSX** — since the file is `.js`.

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
| `PatientInfoSection.jsx` | BW, patient type, line type, TPN start/end dates |
| `MacroSection.jsx` | Dextrose %, protein, lipid targets |
| `ElectrolyteSection.jsx` | Na, K, Ca, Mg, PO₄ split-source inputs |
| `VitaminSection.jsx` | Soluvit, Vitalipid, Pediatrace |
| `HeparinSection.jsx` | Heparin concentration toggle + calculated units |
| `RateSection.jsx` | TPN rate — auto-populated from `calcTPNRate`, physician can override (mirrors VitaminSection pattern) |
| `ResultsPanel.jsx` | Always visible — shows `—` when no results |
| `IngredientsTable.jsx` | Ingredients table with 2-in-1 / Lipid bag columns |
| `ClinicalAlertsPanel.jsx` | Tiered CDS alert panel — safe badge or rose/amber rows |
| `DateFieldTH.jsx` | Date input wrapper: invisible native `<input type="date">` + visible overlay div showing `DD/MM/YYYY พ.ศ.` (Buddhist Era, +543). Used by `PatientInfoSection`. Internal storage stays ISO `YYYY-MM-DD` (ค.ศ.). |

`NumberField` in `ui.jsx` suppresses native scroll-wheel and arrow-key increment on `<input type="number">` via `onWheel` blur + `onKeyDown` prevention.

All six input section components (`PatientInfoSection`, `MacroSection`, `ElectrolyteSection`, `VitaminSection`, `HeparinSection`, `RateSection`) are wrapped with `React.memo` and accept individual primitive props extracted from `inputs` and `cds`. Never pass the `inputs` object or `cds` object directly to these components.

### PDF export

`src/components/TPNPdfTemplate.jsx` — uses `@react-pdf/renderer`. No HTML/CSS — all layout via react-pdf `StyleSheet` (pt units). Thai fonts (Sarabun + Kanit) in `public/fonts/` registered with absolute URLs. Hyphenation disabled globally to prevent Thai character corruption.

PDF header uses `hospital.logoForPdf` (hospital-specific). Do not use `APP_LOGO` in the PDF.

**THIS IS A FINALIZED HYBRID ARCHITECTURE. DO NOT UNIFY THE PATHS OR REFACTOR WITHOUT UNDERSTANDING THE CONSTRAINTS BELOW.**

All paths share the same opening sequence:
1. `window.open('', '_blank')` fires synchronously on click — beats popup blockers on all platforms.
2. `writeLoadingSplash(tab)` paints a Thai spinner into the blank tab immediately.
3. Async: logo fetch → dynamic import `@react-pdf/renderer` + `TPNPdfTemplate` → blob generation.

After blob is ready, the path splits by platform:

**Path A — Desktop & Android (blob URL)**
```
blob → new File([blob], filename, {type:'application/pdf'})
     → URL.createObjectURL(file)
     → tab.location.href = blobUrl
     → Chrome opens inline PDF viewer
```
- Save button works (no server request needed — blob is local memory).
- Filename in Save As is a browser-generated UUID — this is a **browser API constraint**, not a bug. There is no JS API to set a custom blob URL path.
- Blob URL is revoked after 5 minutes via `setTimeout` to prevent memory accumulation.
- **Why not SW path on desktop:** Chrome's PDF viewer save button makes requests from `chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai` — an extension context that bypasses the Service Worker entirely. If the SW path is used on desktop, the save button hits the Render server (which has no `/pdf-preview/` route) and returns a 404 "file wasn't available on site" error. **Do not change desktop to use the SW path.**

**Path B — iOS (iPhone / iPad) (SW-backed URL)**
```
blob → storePdfInSW(blob, filename)
     → SW caches at /pdf-preview/TPN-xxxx.pdf (10-min TTL)
     → tab.location.href = /pdf-preview/TPN-xxxx.pdf
     → SW fetch intercept serves bytes with Content-Disposition headers
     → iOS native PDF viewer opens
     → Share sheet / Save to Files uses correct filename TPN-xxxx.pdf
```
- Correct clinical filename in iOS share sheet and LINE sharing.
- SW serves `Content-Disposition: inline; filename="TPN-xxxx.pdf"; filename*=UTF-8''...` (RFC 5987).
- Range requests (iOS Safari pinch-to-zoom) handled via HTTP 206 in `handleRangeRequest`.
- **Why not blob URL on iOS:** blob URLs work for viewing, but iOS share sheet derives the filename from the URL path (UUID), not from response headers. SW path is the only way to get the correct filename.
- Detected via `/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream`.

**Path C — Global fallback (blob URL)**
- Triggered when: SW is not yet active on first load, private browsing, SW registration failed, or `storePdfInSW` returns `null` after 15s timeout.
- Degrades gracefully to Path A (blob URL) — viewing and saving always work, filename is UUID.
- `openBlobFallback(blob, filename, tab)` is the shared helper used by both Path A and Path C.

**Stale URL handling:** Expired or bookmarked `/pdf-preview/` URLs (SW cache miss) return a Thai-language 410 page with 4-second auto-redirect to `/`.

Do **not** render `TPNPdfTemplate` twice concurrently (font cache corruption). `PdfModalContent.jsx` has been deleted — there is no modal. Do not reintroduce modals, HTML wrapper pages, floating download buttons, or a unified single-path approach.

### Service Worker

`public/sw.js` (SW v20, cache `pedicale-shell-v20`). Cache-first for static assets, network-first with app-shell fallback for navigation. Handles `REGISTER_PDF` message and `/pdf-preview/*` fetch intercept with 10-min TTL. **Only used by the iOS export path** — desktop/Android navigate to blob URLs which never touch the SW.

- **TTL** is stored as an `X-Expires` header (epoch ms) in the cached Response — **not** via `setTimeout`, because the browser can terminate the SW between uses and timers do not persist across SW restarts.
- **Range request support** (`handleRangeRequest`): iOS Safari sends byte-range requests for pinch-to-zoom. The SW handles `Range: bytes=N-M` headers and returns proper 206 responses. The cache entry is **never deleted after serving** — it must survive multiple Range requests within the TTL window. It is only purged when a new PDF is stored (REGISTER_PDF clears old entries first) or when the TTL check fails on a subsequent fetch.
- **No blob re-wrapping**: The fetch handler streams `cached.body` directly into the new Response. Using `cached.blob()` then `new Response(blob, ...)` can silently corrupt the Content-Type in some Chrome builds, causing downloads instead of inline PDF rendering.
- **Cache miss / expiry** serves a Thai-language recovery page (status 410) with a 4-second countdown auto-redirect to `/`.
- Both the recovery page and the PDF generation error page (in `useTPNForm.js`) use white-toned design with Sarabun + Kanit fonts loaded from `/fonts/`.

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

Style: `new-york`, base: `radix`, no TypeScript. Installed: alert-dialog, badge, button, card, input, label, number-ticker, progress, separator, shimmer-button, switch, tooltip.

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
- `fmt` and `fmtN` live in `src/utils/fmt.js`. Do not redeclare them anywhere. Use `fmtN` as the default display formatter; use `fmt(n, 2)` only for Fat Infusion Rate.
- `APP_COLOR` and `APP_LOGO` are app-level constants — never use `hospital.themeColor` for web UI chrome.
