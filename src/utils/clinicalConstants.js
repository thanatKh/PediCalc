// ─────────────────────────────────────────────────────────────────────────────
// Clinical & Configuration Constants — PediCalc
// All numeric values that appear in formulas must be named here.
// Update this file when clinical guidelines change.
// ─────────────────────────────────────────────────────────────────────────────

// ── Newborn fluid ──────────────────────────────────────────────────────────
export const NEWBORN_LINE_RESERVE_ML   = 25;    // ml reserved for IV line priming (newborn)

// ── Drug concentrations (mEq/ml or mmol/ml unless noted) ──────────────────
export const CONC_DEXTROSE_50PCT       = 2;     // g/ml  → 50% dextrose diluted to target %: ml = (pct/100)*vol*2
export const CONC_AMINOVEN_10PCT       = 10;    // ml per g/kg  → Aminoven 10% (0.1 g/ml → ×10 to get ml/kg)
export const CONC_SMOFLIPID_20PCT      = 5;     // ml per g/kg  → 20% SMOFlipid (0.2 g/ml → ×5 to get ml/kg)
export const CONC_NA_GLYCERO           = 2;     // mEq Na / ml  (Na Glycerophosphate)
export const CONC_NACL_3PCT            = 0.5;   // mEq Na / ml  (3% NaCl)
export const CONC_KCL_15PCT            = 2;     // mEq K  / ml  (15% KCl)
export const CONC_K2HPO4              = 1;     // mEq K  / ml  (8.71% K2HPO4)
export const CONC_CA_GLUCONATE_10PCT   = 0.25;  // mmol Ca / ml (10% Calcium gluconate)
export const CONC_MGSO4_50PCT          = 4;     // mEq Mg / ml  (50% MgSO4)
export const CONC_HEPARIN_STOCK        = 100;   // IU / ml      (heparin vial 100 IU/ml)
export const HEPARIN_DEFAULT_CONC      = 0.5;   // IU / ml      (default bag concentration)

// PO4 content of phosphate salts (mmol PO4 per ml of solution)
export const PO4_PER_ML_NA_GLYCERO     = 1.0;   // mmol PO4 / ml  (2 mEq Na/ml, 1 mmol PO4/ml)
export const PO4_PER_ML_K2HPO4        = 0.5;   // mmol PO4 / ml  (1 mEq K/ml, 0.5 mmol PO4/ml)

// PO4 yield per mEq of electrolyte from each phosphate salt
// Na Glycerophosphate: 2 mEq Na/ml, 1 mmol PO4/ml → 0.5 mmol PO4 per mEq Na
export const PO4_PER_MEQ_NA_GLYCERO   = 0.5;   // mmol PO4 per mEq Na
// K2HPO4: 1 mEq K/ml, 0.5 mmol PO4/ml → 0.5 mmol PO4 per mEq K
export const PO4_PER_MEQ_K2HPO4       = 0.5;   // mmol PO4 per mEq K

// ── Vitamins & trace elements ──────────────────────────────────────────────
export const DOSE_SOLUVIT_ML_PER_KG    = 1;     // ml/kg/day × DSF
export const DOSE_VITALIPID_ML_PER_KG  = 4;     // ml/kg/day (no DSF — given with lipid)
export const DOSE_PEDIATRACE_ML_PER_KG = 1;     // ml/kg/day × DSF
export const MAX_SOLUVIT_ML            = 10;    // ml/day cap
export const MAX_VITALIPID_ML          = 10;    // ml/day cap
export const MAX_PEDIATRACE_ML         = 10;    // ml/day cap

// CDS thresholds for manual vitamin overrides
export const SOLUVIT_MODERATE_HIGH     = 9;     // ml/day — approaching max
export const VITALIPID_MODERATE_HIGH   = 9;     // ml/day — approaching max
export const PEDIATRACE_MODERATE_HIGH  = 9;     // ml/day — approaching max

// ── Energy factors ─────────────────────────────────────────────────────────
export const KCAL_PER_G_DEXTROSE       = 3.4;   // kcal/g
export const KCAL_PER_G_PROTEIN        = 4;     // kcal/g
export const KCAL_PER_ML_LIPID_20PCT   = 2;     // kcal/ml  (20% SMOFlipid)

// ── GIR (Glucose Infusion Rate) formula ────────────────────────────────────
// Reverse GIR: GIR (mg/kg/min) = (TPN Rate ml/hr × Dextrose%) / (6 × BW kg)
// Derived from: (ml/hr × g/100ml × 1000 mg/g) / (60 min/hr × BW)
//             = (rate × dex%) / (6 × BW)
export const GIR_REVERSE_DIVISOR      = 6;     // constant in reverse GIR formula
export const HOURS_PER_DAY             = 24;

// ── Osmolarity estimation ──────────────────────────────────────────────────
// Formula: Osm = (dex% × 50) + (AA g/L × 10) + ((Na+K) mEq/L × 1)
// Reference: ASPEN clinical guidelines; D10 = 500, Aminoven 10% = 1000 mOsm/L
export const OSMO_FACTOR_DEXTROSE      = 50;    // mOsm/L per % dextrose (D10→100g/L×5=500)
export const OSMO_FACTOR_AA_G_PER_L    = 10;    // mOsm/L per g/L of amino acid in bag
export const OSMO_AMINOVEN_10PCT_G_PER_ML = 0.1; // g/ml → Aminoven 10% concentration
export const OSMO_FACTOR_ELECTROLYTE   = 1;     // mOsm/L per mEq/L (Na or K, clinical shorthand)

// ── Ca × PO4 precipitation thresholds ────────────────────────────────────
export const CA_PO4_PRODUCT_THRESHOLD  = 75;    // mmol²/L²  — [Ca]×[PO4] precipitate risk
export const CA_PO4_SUM_THRESHOLD      = 45;    // mmol/L    — [Ca] + [PO4] concentration in bag
export const ML_TO_L                   = 1000;  // divisor to convert ml → L for concentration

// ── NPC:N ratio ────────────────────────────────────────────────────────────
export const PROTEIN_TO_NITROGEN       = 6.25;  // g protein per g nitrogen
export const NPC_N_TARGET_MIN          = 150;   // kcal:g N  lower bound
export const NPC_N_TARGET_MAX          = 200;   // kcal:g N  upper bound

// ── Safety thresholds ──────────────────────────────────────────────────────
export const GIR_MAX_SAFE              = 12;    // mg/kg/min — alarm above this
export const GIR_MIN_SAFE              = 4;     // mg/kg/min — alarm below this
export const DEXTROSE_PERIPHERAL_LIMIT = 12.5;  // %   — max for peripheral line
export const OSMOLARITY_PERIPHERAL_MAX = 900;   // mOsm/L — max for peripheral line
export const FAT_RATE_MAX_G_KG_HR      = 0.17;  // g/kg/hr — max lipid infusion rate

// ── Rate variance warning (prescribed vs calculated) ──────────────────────
export const LIPID_RATE_WARN_THRESHOLD = 0.5;   // ml/hr

// ─────────────────────────────────────────────────────────────────────────────
// PediNAT 2565 Clinical Decision Support Thresholds
// Reference: Thai Neonatal Nutrition Guideline (PediNAT) B.E. 2565
// ─────────────────────────────────────────────────────────────────────────────

// ── Fluid (ml/kg/day) — PediNAT p.21 ────────────────────────────────────────
export const FLUID_CRITICAL_LOW      = 40;    // ml/kg/day
export const FLUID_MODERATE_LOW      = 60;    // ml/kg/day
export const FLUID_MODERATE_HIGH     = 170;   // ml/kg/day
export const FLUID_CRITICAL_HIGH     = 180;   // ml/kg/day

// ── GIR intermediate threshold — PediNAT neonatal metabolic section ──────────
export const GIR_MODERATE_HIGH       = 10;    // mg/kg/min — approaching max (12)

// ── Amino Acids / Protein (g/kg/day) — PediNAT p.94 ─────────────────────────
export const AA_CRITICAL_LOW         = 1.0;   // g/kg/day
export const AA_MODERATE_LOW         = 1.5;   // g/kg/day
export const AA_MODERATE_HIGH        = 3.5;   // g/kg/day
export const AA_CRITICAL_HIGH        = 4.0;   // g/kg/day — PediNAT maximum

// ── Lipid (g/kg/day) — PediNAT p.94 ────────────────────────────────────────
export const LIPID_MODERATE_LOW      = 1.0;   // g/kg/day
export const LIPID_MODERATE_HIGH     = 3.5;   // g/kg/day
export const LIPID_CRITICAL_HIGH     = 4.0;   // g/kg/day — PediNAT maximum
export const FAT_RATE_MODERATE_HIGH  = 0.12;  // g/kg/hr — approaching 0.17 limit

// ── Sodium (mEq/kg/day) — PediNAT p.21 — DOL-aware ─────────────────────────
export const NA_DOL_RESTRICTION_DAYS = 2;     // DOL ≤ this → Na restriction phase
export const NA_RESTRICTION_MAX      = 2;     // mEq/kg/day — max during restriction
export const NA_SAFE_MAX             = 4;     // mEq/kg/day — maintenance target
export const NA_MODERATE_HIGH        = 5;     // mEq/kg/day
export const NA_CRITICAL_HIGH        = 6;     // mEq/kg/day

// ── Potassium (mEq/kg/day) — PediNAT p.21 — DOL + urine output aware ────────
export const K_DOL_RESTRICTION_DAYS  = 3;     // DOL < this → K restriction phase
export const K_SAFE_MAX              = 3;     // mEq/kg/day — maintenance target
export const K_MODERATE_HIGH         = 3;     // mEq/kg/day — approaching limit
export const K_CRITICAL_HIGH         = 4;     // mEq/kg/day — hyperkalemia risk

// ── Calcium (mmol/kg/day) — PediNAT p.94 ────────────────────────────────────
export const CA_CDS_SAFE_MIN         = 0.5;   // mmol/kg/day
export const CA_CDS_SAFE_MAX         = 2.0;   // mmol/kg/day
export const CA_CDS_CRITICAL_HIGH    = 2.5;   // mmol/kg/day

// ── Phosphate (mmol/kg/day) — PediNAT p.94, p.29 ────────────────────────────
export const PO4_TARGET_MIN          = 1.0;   // mmol/kg/day — minimum for preterm
export const PO4_MODERATE_LOW        = 0.5;   // mmol/kg/day — below target
export const PO4_SAFE_MAX            = 2.0;   // mmol/kg/day
export const PO4_CRITICAL_HIGH       = 2.0;   // mmol/kg/day — hyperphosphatemia risk

// ── Magnesium (mEq/kg/day) — PediNAT p.94 ───────────────────────────────────
export const MG_CDS_SAFE_MIN         = 0.3;   // mEq/kg/day
export const MG_CDS_SAFE_MAX         = 0.5;   // mEq/kg/day
export const MG_CDS_MODERATE_HIGH    = 0.7;   // mEq/kg/day
export const MG_CDS_CRITICAL_HIGH    = 1.0;   // mEq/kg/day

// ── Osmolarity peripheral warning — PediNAT p.21, p.51 ──────────────────────
export const OSMO_MODERATE_HIGH      = 800;   // mOsm/L — approaching peripheral limit

// ── Ca×PO₄ moderate warning (approaching precipitation) ─────────────────────
export const CA_PO4_PRODUCT_MODERATE = 55;    // mmol²/L²  — ~80% of critical threshold
export const CA_PO4_SUM_MODERATE     = 35;    // mmol/L    — ~80% of critical threshold

// ── Total Energy (kcal/kg/day) — ASPEN/ESPGHAN neonatal ─────────────────────
export const ENERGY_CRITICAL_LOW     = 40;    // kcal/kg/day — severe underfeeding
export const ENERGY_MODERATE_LOW     = 60;    // kcal/kg/day — below minimum for growth
export const ENERGY_MODERATE_HIGH    = 110;   // kcal/kg/day — overfeeding caution
export const ENERGY_CRITICAL_HIGH    = 130;   // kcal/kg/day — hepatic steatosis / CO₂ risk

// ── NPC:N Ratio (kcal non-protein : g nitrogen) — ASPEN/ESPGHAN ─────────────
export const NPC_N_CRITICAL_LOW      = 100;   // kcal/g N — protein used as energy
export const NPC_N_MODERATE_LOW      = 150;   // kcal/g N — suboptimal protein utilization
export const NPC_N_MODERATE_HIGH     = 200;   // kcal/g N — excess calories vs protein
export const NPC_N_CRITICAL_HIGH     = 250;   // kcal/g N — overfeeding risk
