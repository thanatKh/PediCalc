# CLAUDE.md — PediCalc

This file documents the codebase structure, conventions, and development workflows for AI assistants working on PediCalc.

## Project Overview

PediCalc is a **clinical decision-support web application** for the Department of Pediatrics, Kabinburi Hospital (Thailand). It calculates and validates parenteral nutrition (TPN) prescriptions for newborns, enforcing safety thresholds in real time and exporting a signed PDF order form.

The project is intentionally minimal: **two static HTML files, no build step, no framework, no server.** Deploy by serving the files from any static host (GitHub Pages, S3, Nginx, etc.).

---

## Repository Structure

```
PediCalc/
├── CLAUDE.md                        # This file
├── README.md                        # Project title only
├── index.html                       # Landing/portal page — module selection
└── tpn_newborn_calculator.html      # TPN calculator for newborns (main app)
```

### index.html
- Bilingual (Thai primary, English secondary) hub showing available and upcoming calculator modules
- Grid of clickable cards; links to `tpn_newborn_calculator.html`
- Five "Coming Soon" modules listed (TPN >10 kg, drug dosing, IV fluid, growth, resuscitation)
- No JavaScript logic — pure HTML + CSS

### tpn_newborn_calculator.html
- ~1,600-line single-file SPA (HTML + embedded `<style>` + embedded `<script>`)
- All calculation, validation, and PDF-export logic lives here
- External CDN dependencies (loaded at bottom of `<body>`):
  - `html2canvas@1.4.1` — renders DOM sections to canvas for PDF embedding
  - `jsPDF@2.5.1` — A4 PDF generation
  - Google Fonts — Mitr (headings) and Sarabun (body), Thai typography

---

## Technology Stack

| Layer | Choice |
|---|---|
| Markup | HTML5 with semantic form elements |
| Styling | CSS3 — custom properties, Grid, Flexbox |
| Logic | Vanilla ES6+ JavaScript (no framework) |
| PDF export | html2canvas + jsPDF (CDN) |
| Fonts | Google Fonts (Mitr, Sarabun — Thai) |
| Build | None — files served as-is |
| Tests | None — validation is inline, runtime |

---

## JavaScript Architecture (tpn_newborn_calculator.html)

### Core Data Flow

```
user input → render() → calculate() → buildAlerts() → update DOM
                                    ↘ updateEnergyTable()
```

- Every `input` event on any field triggers `render()`.
- `render()` reads all inputs, runs calculations, refreshes the results table, and calls `buildAlerts()`.
- No state management library; no virtual DOM. DOM is the source of truth.

### Key Functions

| Function | Purpose |
|---|---|
| `render()` | Master update — called on every input event |
| `calculate()` | Pure calculation logic: volumes, macronutrients, electrolytes |
| `buildAlerts()` | Generates clinical safety alerts (danger/warning/success) |
| `updateEnergyTable()` | Computes protein/CHO/fat energy distribution |
| `exportPDF()` | Captures DOM via html2canvas, composes A4 PDF with jsPDF |
| `resetForm()` | Clears all inputs and re-renders |
| `n(id)` | Helper — `parseFloat(document.getElementById(id).value) \|\| 0` |
| `s(id)` | Helper — `document.getElementById(id).value` |
| `fmt(num, dp)` | Helper — formats number to fixed decimal places |

### Global State

Minimal global state on `window`:

- `window.__lastCalc` — the last computed result object (used by PDF export)
- `window.__toastT` — timeout handle for the toast notification

### Alert Levels

| Class | Color | Meaning |
|---|---|---|
| `alert-danger` | Red | Clinical safety violation — must address |
| `alert-warning` | Orange | Out-of-range but not immediately unsafe |
| `alert-success` | Green | Value within target range |

---

## Clinical Calculation Details

Understanding the clinical context helps avoid breaking safety-critical logic.

### Key Parameters

| Parameter | Variable/ID | Notes |
|---|---|---|
| Glucose Infusion Rate (GIR) | `gir` | Target 4–12 mg/kg/min |
| Osmolarity | `osm` | Peripheral <900, Central <1800 mOsm/L |
| Fat infusion rate | `fatRate` | Max 0.17 g/kg/hr |
| Ca × PO₄ product | `caPO4` | Precipitation risk >calcium-phosphate threshold |
| Dead-space compensation | hardcoded `25` ml | Specific to Kabinburi Hospital protocol |

### Route-Dependent Logic

The `route` select (`peripheral` / `central`) changes osmolarity thresholds and may affect which fields are active. Always test both routes when changing calculation or alert logic.

### Auto-Fill Behavior

Vitamins and trace elements auto-populate from weight breakpoints when weight is entered. This logic is inside `render()` — do not break these auto-fills when modifying input handling.

---

## CSS Conventions

### Custom Properties (CSS Variables)

Defined in `:root` — always use these instead of hardcoded colors:

```css
--primary, --secondary, --accent
--success, --warning, --danger
--text-primary, --text-secondary
--bg, --surface, --border
```

### Naming

- Semantic class names (`.alert-danger`, `.stat-value`, `.field-row`)
- No BEM enforced, but descriptive hyphen-separated names
- Layout: CSS Grid for page sections, Flexbox for rows/bars

### Breakpoints

| Breakpoint | Width |
|---|---|
| Mobile | < 640px |
| Tablet | 640px – 720px |
| Desktop | > 720px |

---

## Adding a New Calculator Module

1. Create a new HTML file following the same single-file pattern as `tpn_newborn_calculator.html`.
2. Copy the CSS custom properties block from an existing file to maintain visual consistency.
3. Add a card to `index.html`'s module grid linking to the new file.
4. Remove the "coming soon" badge from the corresponding placeholder card in `index.html`.
5. Use the same `n()`, `s()`, `fmt()` helper pattern for input parsing.
6. Implement a `render()` + `buildAlerts()` pattern for real-time validation.

---

## PDF Export

The export flow in `exportPDF()`:

1. Collects `window.__lastCalc` and current input values.
2. Builds an off-screen `<div>` with the full order form layout.
3. Runs `html2canvas()` on that div to produce a raster image.
4. Embeds the image into an A4 jsPDF document.
5. Adds header text, timestamp, and signature blocks programmatically.
6. Triggers browser download as `TPN_<HN>_<date>.pdf`.

**Important:** The off-screen div uses absolute positioning and `visibility: hidden` — do not change this to `display: none` or html2canvas will not render it.

---

## Localization

- Primary language: **Thai** (all user-facing labels and messages)
- Secondary: **English** in parentheses for clinical terms
- Thai fonts: Mitr (weight 400, 600) and Sarabun loaded from Google Fonts
- No i18n framework — strings are hardcoded in HTML/JS

---

## Development Workflow

### Running Locally

No build step required. Open either HTML file directly in a browser, or serve with any static server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

### Making Changes

1. Edit the relevant HTML file directly.
2. Refresh the browser — changes are instant.
3. Test both `peripheral` and `central` routes.
4. Test edge cases: zero weight, max values, missing fields.
5. Verify PDF export still works after layout changes.

### Testing

There is no automated test suite. Manual verification checklist:

- [ ] GIR calculates correctly and alert fires outside 4–12 range
- [ ] Osmolarity alerts fire at correct thresholds for each route
- [ ] Auto-fill vitamins/trace elements populates on weight entry
- [ ] PDF exports with correct values and formatting
- [ ] Form reset clears all fields and re-renders cleanly
- [ ] Mobile layout intact at 375px viewport width

### Committing

Branch: `claude/add-claude-documentation-S7gzR` for documentation. Use descriptive commit messages. Push with:

```bash
git push -u origin <branch-name>
```

---

## Key Constraints and Gotchas

- **Dead-space volume is hardcoded to 25 ml** — this is hospital-specific and must not be changed without clinical sign-off.
- **CDN dependencies** — html2canvas and jsPDF are loaded from CDN; if the hospital's network blocks CDNs, these must be bundled locally.
- **Thai font rendering in PDF** — jsPDF does not natively support Thai script. The current approach captures the DOM as an image (html2canvas), so Thai text renders correctly. Do not switch to jsPDF's text-mode rendering for Thai content.
- **No input sanitization** — all inputs are numeric; there is no XSS risk, but always keep inputs typed as `number`.
- **No persistence** — data is not saved between sessions. Do not add localStorage without considering HIPAA/PDPA implications for patient data.
- **Single-file architecture** — keep each calculator self-contained. Do not introduce a shared JS/CSS file unless all calculators need it and the added complexity is justified.
