# PediCalc — Complete Application Reference

> **Purpose of this document.** This is a self-contained briefing for an AI agent (or a human researcher) who needs to understand what PediCalc is, what it does, how it works internally, and what clinical workflow it sits inside. It was written by reading the application source code directly. Use it to draft research on how PediCalc can improve the real-world workflow of hospital staff (neonatologists, pediatricians, ward nurses, and compounding pharmacists).
>
> **One-line summary.** PediCalc is a web-based clinical calculator that turns a neonatologist's per-kilogram nutrition targets into a fully compounded, safety-checked, printable **Neonatal Total Parenteral Nutrition (TPN) order form** — replacing manual, error-prone hand calculation and free-text ordering.

---

## 1. The real-world clinical problem

**Total Parenteral Nutrition (TPN)** is intravenous feeding for newborns who cannot be fed enough by mouth or by gavage — typically premature infants, post-surgical neonates, and critically ill babies in the NICU. A neonatal TPN order is one of the most calculation-heavy, highest-risk orders in a hospital, because:

- **Everything is per-kilogram and the patients are tiny.** A 0.9 kg preterm infant has almost no margin for error. A misplaced decimal in a glucose or potassium dose can be lethal.
- **A single bag mixes ~12 ingredients.** Dextrose, amino acids, sodium (from two sources), potassium (from two sources), calcium, magnesium, phosphate, multivitamins, trace elements, and heparin must each be converted from a clinical target (e.g. "Na 3 mEq/kg/day") into a concrete volume in millilitres drawn from a specific stock concentration.
- **Several physical and chemical constraints interact.** Calcium and phosphate can precipitate into crystals that can embolize and kill. Glucose infusion rate (GIR) must stay in a safe band. Osmolarity caps depend on whether the line is central or peripheral. Lipid infusion rate has a hard ceiling.
- **The math is traditionally done by hand** on paper or in a spreadsheet, then transcribed into an order, then re-checked by a pharmacist — each step a chance for transcription and arithmetic error.
- **Dead space matters.** In neonatal practice a fixed volume (here, 25 ml) stays in the IV line/bag and is never infused. If nutrients aren't scaled up to compensate, the baby receives less than the intended dose.

PediCalc compresses this entire chain — target entry → ingredient calculation → safety review → formatted order → pharmacy handoff — into a single screen that updates live and emits a signed-off-ready PDF.

---

## 2. What PediCalc is (product framing)

- **PediCalc is the app brand**, deliberately *not* tied to a single hospital or a single calculator. It is positioned as a **multi-hospital, multi-module pediatric clinical calculator** delivered as a **Progressive Web App (PWA)** — installable, offline-capable, works on phone/tablet/desktop.
- It was created by **พญ. สมิตา สมโภชน์ (Dr. Samita Somphot)** (credited in the sidebar).
- The header currently labels the live module **"Neonatal TPN Calculator (Version ทดสอบ)"** — *ทดสอบ* meaning "test/beta" — and the sidebar footer reads **v1.0.0**. So this is an early-production / pilot-stage tool.

### 2.1 Module roadmap

The sidebar exposes four modules; only the first is live:

| Key | Status | Description |
|---|---|---|
| `tpn-newborn` | **Live** | Neonatal TPN Calculator (the entire subject of this document) |
| `pediatric-dose` | Coming soon | Pediatric Drug Dosing |
| `fluid-resus` | Coming soon | IV Fluid Resuscitation |
| `growth-chart` | Coming soon | Growth & Vitals |

This roadmap matters for the research framing: PediCalc is intended to become a **suite** of bedside pediatric tools, with neonatal TPN as the flagship.

### 2.2 Multi-hospital design

The same app serves multiple hospitals. Two are currently configured:

- **โรงพยาบาลกบินทร์บุรี (Kabinburi Hospital)** — default, brand teal `#0d6e6e`.
- **โรงพยาบาลเจ้าพระยาอภัยภูเบศร (Chaophraya Abhaibhubejhr Hospital)** — orange `#c2590a`.

A clinician picks their hospital once; the choice persists in the browser (`localStorage` key `pedicale-hospital`). **Hospital identity is intentionally narrow in scope:** it only changes the hospital badge in the sidebar and the **logo + name printed on the PDF order form**. The application's own UI chrome (navigation, buttons, accent color) always stays PediCalc teal, regardless of hospital. This keeps "the app" and "the hospital using the app" as separate identities — adding a third hospital is just a config entry plus logo files.

---

## 3. Who uses it and how (the workflow it slots into)

PediCalc is a **clinical decision-support and order-generation tool**. It does not connect to the hospital information system, EMR, or pharmacy system — it is a standalone calculator whose output is a **paper/PDF order form** that travels the normal manual route. The intended human workflow:

1. **Prescribing physician (neonatologist / pediatrician)** opens PediCalc on a phone, tablet, or ward computer.
2. They enter patient identifiers (name, HN, ward, age, weight, line type) and their intended **per-kilogram nutrition targets** (fluid, dextrose %, protein, lipid, electrolytes).
3. The app **instantly** computes the full compounded recipe, infusion rates, energy breakdown, and runs **15+ automated safety checks** against the Thai national neonatal nutrition guideline.
4. The physician reviews the live **Clinical Decision Support (CDS)** panel. Cautions (amber) and critical alerts (red) appear inline; clicking an alert scrolls to and highlights the offending input field.
5. If a critical alert is present, exporting requires an explicit **acknowledgment dialog** ("Acknowledge & Export") — the physician must consciously override.
6. The physician exports a **PDF Neonatal Parenteral Nutrition Order Form** with hospital branding, a unique document ID, full preparation table, safety summary, and **signature lines for the prescribing physician and verifying pharmacist**.
7. The **compounding pharmacist** receives the order, sees every ingredient already converted to millilitres from named stock solutions (e.g. "Dextrose from 50% glucose", "3% NaCl 0.5 mEq Na/ml"), verifies, signs, and compounds.
8. The **ward nurse** hangs the bag(s) at the printed infusion rate (ml/hr).

The key real-world point: PediCalc removes the manual arithmetic and the free-text ambiguity from steps 2–3 and 6, and front-loads safety checking that traditionally only happens (if at all) at the pharmacist verification step.

---

## 4. Technology & architecture

### 4.1 Stack

- **React 19** + **Vite 8** (build tool, uses the rolldown bundler) + **Tailwind CSS v4** (no `tailwind.config.js`; tokens live in `src/index.css`).
- **JavaScript, not TypeScript.** `shadcn/ui` components (new-york style, Radix primitives) for buttons, dialogs, tooltips, etc.
- **`@react-pdf/renderer`** for PDF generation — pure programmatic layout (no HTML-to-canvas). This is the only PDF engine; `html2canvas`/`jsPDF` were deliberately removed.
- **PWA**: service worker (`public/sw.js`), web manifest, installable, safe-area aware for notched phones.
- No backend for the calculation — **all logic runs client-side in the browser.** No patient data leaves the device unless the user shares the generated PDF.

### 4.2 Code structure (the "where does logic live" map)

The architecture enforces a strict separation between **clinical logic** and **presentation**:

| Concern | File | Role |
|---|---|---|
| **Calculation engine** | `src/utils/tpnCalculator.js` | Pure function `calculateTPN(inputs) → results`. All formulas live here. |
| **Clinical constants** | `src/utils/clinicalConstants.js` | Every magic number (concentrations, thresholds, guideline limits) as a named export. Nothing is hardcoded elsewhere. |
| **Clinical Decision Support** | `src/utils/clinicalDecisionSupport.js` | `evaluateClinicalTiers(inputs, results) → checks`. The 15+ guideline safety checks. |
| **Hard validation** | `src/utils/tpnValidation.js` | `validateTPNInputs(inputs) → { errors, warnings }`. Only physiologically-impossible / software-safety blocks. |
| **Formatting** | `src/utils/fmt.js` | `fmt(n, d)` and `fmtN(n)` — consistent number display across UI and PDF. |
| **Form state hook** | `src/hooks/useTPNForm.js` | Holds all inputs, memoizes results/validation/CDS, owns PDF export. |
| **Main shell** | `src/components/TPNCalculator.jsx` | Composes input sections + results; contains no business logic. |
| **Input sections** | `src/components/tpn/*Section.jsx` | One card per input group (Patient, Macro, Electrolyte, Vitamin, Heparin, Rate). |
| **Output panels** | `ResultsPanel.jsx`, `IngredientsTable.jsx`, `ClinicalAlertsPanel.jsx` | Live results, recipe table, tiered alerts. |
| **PDF document** | `src/components/TPNPdfTemplate.jsx` | The printable order form. |
| **Navigation / hospital** | `src/components/Sidebar.jsx`, `src/utils/hospitals.js` | Module nav + hospital picker. |

A guiding principle visible throughout: **the calculator engine and the CDS engine are each a single source of truth.** The web UI and the PDF both read from the same computed `results` object and the same `evaluateClinicalTiers` output — the PDF cannot drift away from what the screen shows. There are 28 Vitest regression tests guarding the calculation engine.

### 4.3 Live, reactive design

There is no "Calculate" button. The form recomputes on every keystroke (`useMemo` over inputs). The results panel, ingredient table, energy chart, infusion rates, and the entire CDS alert panel all update in real time. This is central to the workflow benefit: the clinician sees the consequence of "what if I push protein to 3.5?" immediately, including any safety alert it triggers.

---

## 5. The inputs (what the clinician enters)

All inputs are grouped into cards. Defaults are pre-filled with typical neonatal starting values so the form is usable immediately.

### 5.1 Patient Info
- **Name, HN (hospital number), Ward** — identifiers, printed on the order, used to build the document filename.
- **TPN start / end dates** — displayed in **Thai Buddhist Era (พ.ศ.)** in `DD/MM/YYYY` format via a custom `DateFieldTH` component (native date picker underneath, Buddhist-era display on top; internally stored as ISO `YYYY-MM-DD`).
- **Height, Age (months + days)** — the **age in days = "Day of Life" (DOL)** drives DOL-aware electrolyte safety logic (see §7).
- **Body Weight (BW, kg)** — *the* master variable; nothing computes until BW > 0. Hard-limited to **0.3–10 kg** (neonatal only).
- **Fluid Volume target (ml/kg/day)** — default 120.
- **Line type toggle: Central vs Peripheral** — gates osmolarity and dextrose-concentration safety checks (peripheral veins tolerate far less).
- **Urine output confirmed (yes/no) toggle** — a safety gate for potassium in the first days of life (you don't give K to a baby who isn't yet making urine).

### 5.2 Macronutrients
- **Dextrose %** (concentration of the final bag), default 10. Hint: start 6–8%, increase 1–2%/day, max 12.5% peripheral.
- **Protein (g/kg/day)** via 10% Aminoven Infant, default 2.5. Target 3–4.
- **Lipid (g/kg/day)** via 20% SMOFlipid, default 2. Target 3–4, max 4.

### 5.3 Electrolytes — explicit two-source model
This is a notable design choice. Sodium and potassium each come from **two stock solutions**, and the clinician specifies the contribution from each source separately (in mEq/kg/day):
- **Sodium:** 3% NaCl **and** Na Glycerophosphate (the latter also supplies phosphate).
- **Potassium:** 15% KCl **and** K₂HPO₄ (also supplies phosphate).
- **Calcium** (calcium gluconate, mmol/kg/day) and **Magnesium** (MgSO₄, mEq/kg/day).

The card live-displays derived **Total Na, Total K, and Total PO₄**, color-coded by safety tier. Because phosphate is a by-product of two different salts, the app computes total PO₄ automatically — clinicians don't track it by hand. This split-source model is what enables the sophisticated **two-source calcium-phosphate precipitation check** (see §7).

### 5.4 Vitamins / Trace elements
**Soluvit-N** (water-soluble vitamins), **Vitalipid N Infant** (fat-soluble vitamins, goes in the lipid bag), **Pediatrace** (trace elements). Each is **auto-dosed by weight** (1, 4, 1 ml/kg/day respectively, each capped at 10 ml/day) but the physician can override any value; an "AUTO" / "Manual" badge shows the state, and overrides are safety-checked against the 10 ml/day ceiling.

### 5.5 Heparin
A small dose of heparin keeps the line patent. The clinician sets a multiplier (0.5–1.0 units/ml of total volume); the app computes both the units to add and the millilitres drawn from a 100 IU/ml stock vial.

### 5.6 Prescribed TPN Rate
The infusion pump rate (ml/hr). It **auto-populates** with the calculated rate but the physician can override it. This field is what drives the **reverse GIR** calculation (see §6.4). An "AUTO" badge becomes a "Manual" badge when overridden.

---

## 6. The calculation engine (formulas)

All of the following is implemented in `tpnCalculator.js`. Constants in **bold** are named in `clinicalConstants.js`.

### 6.1 Total volume and the Dead Space Factor (DSF)
```
totalVolume = fluidTarget(ml/kg) × BW + 25              // +25 ml line reserve (NEWBORN_LINE_RESERVE_ML)
tpnVolume   = totalVolume − lipidBagVol                 // the 2-in-1 TPN bag (see §6.2)
DSF         = tpnVolume / (tpnVolume − 25)              // > 1, full precision
```
**Why DSF exists:** 25 ml of fluid stays in the TPN line dead space and is never infused into the baby. To make sure the baby still receives the *intended per-kg dose* of each nutrient, the nutrient quantities are scaled **up** by the DSF. DSF is applied to amino acids, all electrolytes, calcium, magnesium, Soluvit, and Pediatrace. (It is *not* applied to lipid/Vitalipid, which run in a separate bag, nor to dextrose, which is concentration-based on the bag volume.)

**Base = `tpnVolume`, not `totalVolume`.** The 25 ml reserve belongs to the **TPN line only** — the lipid bag runs on a separate Y-site line with no dead-space deduction. So the DSF that scales TPN-bag nutrients is computed from the TPN bag volume, consistent with the pump-rate formula `(tpnVolume − 25)/24`. (An earlier version based DSF on `totalVolume`, which slightly under-corrected by spreading the TPN line's dead space across the lipid volume.) DSF is kept at **full precision** in the engine; rounding happens only at display.

### 6.2 Two-bag system
PediCalc compounds into **two separate bags**:
- **Part 1 — TPN Bag (2-in-1):** dextrose + amino acids + electrolytes + Ca + Mg + Soluvit + Pediatrace + heparin + sterile water q.s.
- **Part 2 — Lipid Bag (separate line / Y-site):** SMOFlipid + Vitalipid.

```
lipidMl      = lipidTarget × BW × 5                      // 20% SMOFlipid: 5 ml per g/kg (CONC_SMOFLIPID_20PCT)
lipidBagVol  = lipidMl + vitalipidMl
tpnVolume    = totalVolume − lipidBagVol                // the "TPN bag" (2-in-1) volume
```

### 6.3 Ingredient volumes (each converts a clinical target → ml of stock)
```
dextroseMl  = (dex% / 100) × tpnVolume × 2              // from 50% glucose (CONC_DEXTROSE_50PCT)
aminovenMl  = protein × BW × 10 × DSF                   // 10% Aminoven (CONC_AMINOVEN_10PCT)
na3PctMl    = (Na_3pct  × BW) / 0.5 × DSF               // 3% NaCl = 0.5 mEq/ml
naGlyceroMl = (Na_glyc  × BW) / 2   × DSF               // 2 mEq Na/ml
k15PctMl    = (K_15pct  × BW) / 2   × DSF               // 15% KCl = 2 mEq/ml
k2hpo4Ml    = (K_k2hpo4 × BW) / 1   × DSF               // K₂HPO₄ = 1 mEq K/ml
caGluconateMl = (Ca × BW) / 0.225 × DSF                 // 10% Ca gluconate = 0.225 mmol/ml
mgso4Ml     = (Mg × BW) / 4 × DSF                       // 50% MgSO₄ = 4 mEq/ml
heparinUnits = tpnVolume × multiplier;  heparinMl = heparinUnits / 100
sterileWaterMl = tpnVolume − (sum of all TPN-bag components)   // q.s. to volume
```
**Total phosphate** is derived from the two phosphate-bearing salts: `totalPO4 = Na_glyc × 0.5 + K_k2hpo4 × 0.5` (mmol/kg/day).

**Negative sterile water is a hard stop.** If the components sum to more than the bag volume, `sterileWaterMl < 0` (`isWaterNegative = true`), which means the recipe is physically impossible. This **locks PDF export** and shows a red banner instructing the clinician to reduce targets.

**Display reconciliation (Option B).** The engine computes `sterileWaterMl` at full precision, so internally `components + sterile water = tpnVolume` exactly. But every printed line is independently rounded (1 dp on the PDF, 2 dp on screen), so summing the *printed* lines can land ~0.1–0.2 ml off the printed total. To keep the printed column self-consistent, sterile water is **displayed** via `reconciledSterileWater(results, decimals) = round(tpnVolume) − Σ round(components)` — it absorbs the rounding residue (≤ ~0.16 ml). This is clinically correct because sterile water is *q.s.* ("fill to volume"); every drug volume keeps its true rounded value, and only the fill-to figure moves. The engine value is never altered — this is display-only.

### 6.4 Glucose Infusion Rate (GIR) — reverse calculation
GIR (mg of glucose per kg per minute) is the single most-watched neonatal metabolic number. PediCalc computes it **in reverse** from the prescribed pump rate:
```
GIR = (TPN_rate_ml/hr × dextrose%) / (6 × BW)           // GIR_REVERSE_DIVISOR = 6
```
The rate used is the **effective rate** = manual override if entered, otherwise the auto-calculated rate `(tpnVolume − 25) / 24`. Safe band: **4–12 mg/kg/min** (`GIR_MIN_SAFE`/`GIR_MAX_SAFE`), with a "moderate/approaching" band at 10–12. Below 4 → hypoglycemia risk; above 12 → hyperglycemia risk.

### 6.5 Infusion rates
```
calcTPNRate = (tpnVolume − 25) / 24                     // pump rate, EXCLUDING the 25 ml reserve (never infused)
lipidRate   = lipidBagVol / 24                          // lipid bag runs to completion
```
Note the deliberate subtlety: the pump rate **excludes** the 25 ml line reserve because that volume never reaches the patient. Using `tpnVolume / 24` would be wrong.

### 6.6 Osmolarity estimate
```
osmolarity = dex% × 50 + (AA g/L) × 10 + ((Na+K mEq/L)) × 1   (mOsm/L)
```
Used to flag peripheral-line danger: peripheral max **900 mOsm/L** (`OSMOLARITY_PERIPHERAL_MAX`), caution from 800.

### 6.7 Energy & protein adequacy
```
CHO kcal     = (dex%/100) × nutrientVolume × 3.4
Protein kcal = protein × BW × 4
Fat kcal     = lipidMl × 2
totalEnergy, kcal/kg/day, and % split across CHO/Protein/Fat
NPC:N ratio  = non-protein kcal / (g protein / 6.25)    // PROTEIN_TO_NITROGEN
```
NPC:N (non-protein-calorie to nitrogen ratio) measures whether there's enough non-protein energy so that infused protein is used for growth rather than burned for fuel. Safe band **100–200** kcal/g N.

### 6.8 Fat infusion rate
```
fatRate = (lipidMl × 0.2) / 24 / BW    (g/kg/hr)
```
Hard ceiling **0.17 g/kg/hr** (`FAT_RATE_MAX_G_KG_HR`); caution from 0.12. Above the ceiling risks Fat Overload Syndrome.

### 6.9 Calcium × Phosphate precipitation — two-source model
This is the most clinically sophisticated calculation. Ca–PO₄ precipitation is a notorious, potentially fatal incompatibility in TPN. PediCalc models it with **two separate products**, because the chemistry differs by phosphate source (per ESPGHAN/ESPEN 2018):
- **Organic phosphate (Na-glycerophosphate):** far more stable; validated up to high products. Moderate at 225, critical at 300 mmol²/L².
- **Inorganic phosphate (K₂HPO₄):** precipitates at *low* products. Moderate at 20, critical at 30 mmol²/L².

It computes `[Ca] × [organic PO₄]` and `[Ca] × [inorganic PO₄]` separately (concentrations in the bag, mmol/L) and alerts on whichever crosses its own threshold — and the critical advice explicitly suggests switching K₂HPO₄ → Na-glycerophosphate. This is exactly the kind of nuanced compatibility reasoning that is easy to get wrong by hand.

---

## 7. Clinical Decision Support (CDS) — the automated safety net

Implemented in `clinicalDecisionSupport.js`. After every recompute, `evaluateClinicalTiers(inputs, results)` evaluates **up to 18 parameters** against the **Thai Neonatal Nutrition Guideline (PedNAT B.E. 2565)** plus ASPEN/ESPGHAN references. Each check returns one of three tiers:

- **`safe`** (green) — within range.
- **`moderate`** (amber, "Caution") — approaching a limit or below a recommended start dose; advisory.
- **`critical`** (red) — outside safe limits with a named clinical risk.

Each alert carries a plain-English **message** (what's wrong, with the number and the threshold) and a **risk** explanation (the clinical consequence). The parameters checked:

| # | Parameter | Examples of what it catches |
|---|---|---|
| 1 | **Fluid volume** | < 40 critical low; > 180 critical high (PDA, pulmonary edema, IVH risk) |
| 2 | **GIR** | < 4 hypoglycemia; > 12 hyperglycemia; 10–12 caution |
| 3 | **Amino acids / protein** | < 1.0 catabolism; > 4.0 azotemia/acidosis |
| 4 | **Lipid + fat infusion rate** | > 4 g/kg/day or > 0.17 g/kg/hr → Fat Overload Syndrome |
| 5 | **Sodium** — *DOL-aware* | > 6 hypernatremia; on **DOL ≤ 2**, > 2 mEq/kg flags expected restriction phase |
| 6 | **Potassium** — *DOL + urine-aware* | > 4 arrhythmia; **K before DOL 3 without confirmed urine output = critical** (oliguric hyperkalemia) |
| 7 | **Calcium** | hypercalcemia / hypocalcemia & metabolic bone disease |
| 8 | **Phosphate** | hyper- (tetany/seizure) / hypophosphatemia (bone disease, respiratory failure) |
| 9 | **Magnesium** | hyper- (respiratory depression) / hypomagnesemia |
| 10 | **Ca×PO₄ precipitation** | two-source crystal-formation risk (see §6.9) |
| 10b | **Ca/PO₄ balance** | one prescribed without the other → poor bone mineralization |
| 11 | **Total energy** | < 40 underfeeding; > 130 kcal/kg overfeeding / hepatic steatosis |
| 12 | **NPC:N ratio** | < 100 protein burned as fuel; > 200 overfeeding |
| 13 | **Osmolarity** (peripheral only) | > 900 phlebitis/extravasation → needs central line |
| 14 | **Vitamins/Trace** (when overridden) | Soluvit/Vitalipid/Pediatrace > 10 ml/day toxicity |
| 15 | **Dextrose %** (peripheral only) | > 12.5% peripheral phlebitis |

**Context-awareness is the standout feature.** The Na, K, and osmolarity/dextrose checks are not static range checks — they incorporate the baby's **day of life**, whether **urine output is confirmed**, and whether the line is **central or peripheral**. This mirrors how an experienced neonatologist actually reasons ("you don't load sodium in the first 48 hours; you don't give potassium until the kidneys are working"), and encodes it so a less-experienced prescriber or a tired one at 3 a.m. gets the same guardrail.

### CDS interaction model
- A green "All parameters within safe range — PedNAT 2565 ✓" banner when everything is clean.
- Otherwise a tiered alert panel with counts ("2 Critical", "3 Caution") and one row per issue.
- **Clicking an alert scrolls to and flashes the responsible input field(s)** — closing the loop between "what's wrong" and "where to fix it."
- On mobile, a floating badge shows the alert count and jumps to the panel.

---

## 8. Validation vs. CDS — the governance distinction

PediCalc draws a deliberate line between two kinds of "this is wrong":

- **Hard validation** (`tpnValidation.js`) — *blocks PDF export.* Reserved for the physiologically impossible or software-safety limits only: **BW outside 0.3–10 kg**, **heparin concentration negative or > 1.0 IU/ml**, and **negative sterile water**. These are not clinical judgment calls; they're "this can't be right / can't be made."
- **Clinical Decision Support** (`clinicalDecisionSupport.js`) — *never blocks export, even at critical tier.* The guideline thresholds are advisory because **the physician is the decision-maker** and there are legitimate reasons to deviate (e.g. deliberate fluid restriction). A critical CDS alert instead triggers a **mandatory acknowledgment dialog** before export: the clinician sees the alerts listed and must click "Acknowledge & Export."

This "advise, don't obstruct" philosophy is a core design value worth highlighting in research: it respects clinical autonomy while ensuring no critical alert is silently bypassed.

---

## 9. The output — the PDF order form

`TPNPdfTemplate.jsx` renders a single-page A4 **"Neonatal Parenteral Nutrition Order Form"** that is the actual artifact handed to pharmacy and nursing. Contents:

- **Header:** hospital logo + Thai & English name, form title, a **unique document ID** (`TPN-{HN}-{YYMMDD}-{HHMM}`), date and time (Thai locale).
- **Patient Information block:** name, HN, ward, age, weight, height, formula note ("Neonatal — 25 ml line reserve"), route (central/peripheral), urine-output status, TPN start/end dates.
- **TPN Bag Volume cards:** TPN bag volume, lipid emulsion volume, total volume/day, **prescribed TPN rate** (auto or physician-set, labelled accordingly), **GIR (reverse-calc, target 4–12)**, and **lipid rate**.
- **Critical alert banners:** any CDS critical-tier issue prints as a red "CRITICAL — …" banner with its risk explanation. These come from the *same* CDS engine as the screen (`getPdfCriticalAlerts`), so the printed form can never disagree with what the clinician saw.
- **Preparation Order table** — the heart of the document, in two parts:
  - **Part 1 — TPN Bag (mix in one bag, 2-in-1):** every ingredient with its per-kg target, the **exact volume in ml**, and a remark naming the stock concentration (e.g. "0.5 mEq Na/ml"). Sterile water is shown as "q.s. to volume." A highlighted subtotal gives the total TPN bag volume (incl. heparin).
  - **Part 2 — Lipid Emulsion (separate line):** SMOFlipid + Vitalipid with a subtotal.
- **Energy Distribution:** total kcal, kcal/kg/day, NPC:N ratio, and a CHO/Protein/Fat kcal + % breakdown table.
- **Clinical Safety Checks:** GIR, osmolarity (with "Central only" warning if exceeded peripherally), fat infusion rate, Ca×PO₄ product, and an electrolyte totals table (Na/K/PO₄ with their sources).
- **Notes & Special Instructions:** blank ruled lines.
- **Signature blocks:** **Prescribing Physician** and **Verifying Pharmacist** — encoding the two-person double-check that is standard safe practice.
- **Footer:** Thai disclaimer that the document is system-generated and a physician must sign before clinical use; document ID + page number on every page.

### 9.1 PDF delivery is platform-aware
Because clinicians use phones, tablets, and desktops, the export logic (in `useTPNForm.js` + the service worker) is a finalized hybrid:
- **Desktop & Android:** PDF opens as an in-browser blob (Chrome's native viewer; save works locally).
- **iOS (iPhone/iPad):** the PDF is served via the service worker so the iOS share sheet and "Save to Files" get the **correct clinical filename** (`TPN-…pdf`) instead of a random UUID — important for sharing into LINE or filing.
- Graceful fallback to a blob URL if the service worker isn't ready. A loading splash appears instantly so a tap never looks broken.

The practical upshot: a doctor can generate and share a correctly-named order PDF from a phone at the bedside.

---

## 10. Notable UX / engineering details relevant to adoption

- **No login, no server round-trip for calculation** — opens and computes instantly; works offline as a PWA. Low friction for bedside use.
- **Bilingual by design** — Thai labels/hints for local clinicians, English clinical terms and an English-titled PDF for universality and pharmacy clarity. PDF uses embedded Thai fonts (Sarabun + Kanit).
- **Buddhist-era dates** on screen (Thai convention) while storing ISO internally.
- **Sensible defaults** pre-fill typical starting values so the form is never blank.
- **Reset** button returns all fields to defaults between patients.
- **Auto/Manual override pattern** for vitamins and infusion rate — weight-based automation with explicit physician control and a visible badge of which is in effect.
- **Responsive & mobile-first** — sidebar auto-collapses when typing on mid-size screens; mobile gets a floating alert badge and a slide-in menu.
- **Accessibility touches** — `aria-live` on the alert panel, tooltips, keyboard escape to close mobile menu.

---

## 11. Scope, assumptions, and limitations (important for honest research)

- **Neonatal only.** Hard-limited to BW ≤ 10 kg. Not for older children or adults.
- **Institution-specific stock concentrations are baked in** (e.g. 10% Aminoven, 20% SMOFlipid, 8.71% K₂HPO₄, 0.225 mmol/ml Ca gluconate). A hospital using different products would need the constants adjusted.
- **Advisory, not authoritative.** Every surface repeats that PediCalc supports clinical decision-making and the prescriber must review before use. It does not replace pharmacist verification or clinical judgment.
- **Not integrated** with EMR/HIS/pharmacy systems — output is a PDF that re-enters the manual workflow. (This is also a limitation to note: re-transcription into downstream systems is still manual.)
- **No patient data persistence / no audit trail** beyond the generated PDF — nothing is stored server-side; the only record is the printed/shared document. There is no built-in record of who calculated what, when (beyond the doc ID timestamp).
- **Single guideline baseline** — thresholds follow PedNAT B.E. 2565 (Thai) with ASPEN/ESPGHAN references; a different national guideline would need re-tuning of constants.
- **Early stage** — header still marked "Version ทดสอบ" (test), v1.0.0.

---

## 12. How this maps to "improving real-world hospital workflow" (research hooks)

For drafting the research, here are the concrete, defensible claims PediCalc's design supports, each tied to a feature above:

1. **Eliminates manual arithmetic error.** Twelve per-kg → ml conversions, DSF scaling, GIR, osmolarity, and Ca×PO₄ products are computed deterministically and identically every time, replacing hand calculation. (→ §6)
2. **Front-loads safety checking to the point of prescribing**, not just at pharmacy verification — 18 guideline checks run live, including context-aware Na/K/line/DOL logic that encodes expert reasoning. (→ §7)
3. **Standardizes the order artifact.** Every order is a structured, legible, uniformly-formatted PDF with named stock solutions and exact volumes — reducing transcription ambiguity and pharmacist clarification calls. (→ §9)
4. **Preserves the human double-check** (physician + pharmacist signature lines) and clinical autonomy (advice doesn't block; criticals require conscious acknowledgment). (→ §8, §9)
5. **Reduces cognitive load and time**, especially for trainees / night shifts, by automating defaults and surfacing the consequence of each target instantly. (→ §4.3, §5)
6. **Lowers a known high-severity risk specifically** — Ca/PO₄ precipitation — with source-aware modeling and an actionable remediation suggestion. (→ §6.9)
7. **Deployable with near-zero friction** — browser PWA, offline, multi-hospital, phone-capable; no install/integration project required to pilot. (→ §4.1, §9.1)
8. **Scales to a suite** — TPN is module one of a planned pediatric calculator platform. (→ §2.1)

Open questions a study could address: measured reduction in calculation/ordering errors vs. manual baseline; time-to-order; pharmacist clarification/rejection rate; user-acceptance among prescribers vs. pharmacists; whether the lack of EMR integration limits sustained adoption; whether advisory-only criticals are appropriately heeded.

---

## 13. Quick glossary

- **TPN** — Total Parenteral Nutrition (complete IV feeding).
- **NICU** — Neonatal Intensive Care Unit.
- **BW** — Body Weight (kg).
- **DOL** — Day of Life (age in days since birth).
- **GIR** — Glucose Infusion Rate (mg/kg/min); key neonatal metabolic safety number.
- **DSF** — Dead Space Factor; scales nutrients up to compensate for the 25 ml line reserve.
- **NPC:N** — Non-Protein Calorie to Nitrogen ratio; protein-utilization adequacy.
- **Osmolarity** — solute concentration (mOsm/L); high values damage peripheral veins.
- **Ca×PO₄ product** — calcium × phosphate concentration product; precipitation risk index.
- **2-in-1 bag** — TPN bag combining dextrose + amino acids + additives (lipid kept separate).
- **q.s.** — *quantum satis*, "add sterile water up to the required volume."
- **PedNAT B.E. 2565** — Thai Neonatal Nutrition Guideline (2022 CE) — the threshold reference.
- **PWA** — Progressive Web App; installable, offline-capable web application.
- **Central vs Peripheral line** — central venous catheters tolerate high osmolarity/dextrose; peripheral veins do not.

---

*Document generated from direct reading of the PediCalc source code (calculation engine, CDS engine, validation, UI sections, PDF template, and configuration). It reflects the application as built, including its stated beta status.*
