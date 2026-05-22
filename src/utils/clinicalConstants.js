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
export const CONC_HEPARIN_STOCK        = 1000;  // IU / ml      (standard heparin vial)
export const HEPARIN_DEFAULT_CONC      = 0.5;   // IU / ml      (default bag concentration)

// PO4 content of phosphate salts (mmol PO4 per ml of solution)
export const PO4_PER_ML_NA_GLYCERO     = 0.5;   // mmol PO4 / ml
export const PO4_PER_ML_K2HPO4        = 0.67;  // mmol PO4 / ml

// ── Vitamins & trace elements ──────────────────────────────────────────────
export const DOSE_SOLUVIT_ML_PER_KG    = 1;     // ml/kg/day × DSF
export const DOSE_VITALIPID_ML_PER_KG  = 4;     // ml/kg/day (no DSF — given with lipid)
export const DOSE_PEDIATRACE_ML_PER_KG = 1;     // ml/kg/day × DSF
export const MAX_SOLUVIT_ML            = 10;    // ml/day cap
export const MAX_VITALIPID_ML          = 10;    // ml/day cap
export const MAX_PEDIATRACE_ML         = 10;    // ml/day cap

// ── Energy factors ─────────────────────────────────────────────────────────
export const KCAL_PER_G_DEXTROSE       = 3.4;   // kcal/g
export const KCAL_PER_G_PROTEIN        = 4;     // kcal/g
export const KCAL_PER_ML_LIPID_20PCT   = 2;     // kcal/ml  (20% SMOFlipid)

// ── GIR (Glucose Infusion Rate) formula ────────────────────────────────────
export const GIR_DEXTROSE_FACTOR       = 10;    // unit conversion in GIR = (dex%×vol×10)/(24×60×bw)
export const HOURS_PER_DAY             = 24;
export const MINUTES_PER_HOUR         = 60;

// ── Osmolarity estimation ──────────────────────────────────────────────────
export const OSMO_FACTOR_DEXTROSE      = 50;    // mOsm/L per % dextrose
export const OSMO_FACTOR_AMINOVEN      = 10;    // scaling factor
export const OSMO_FACTOR_AMINOVEN_CONC = 100;   // mOsm/L per g/kg aminoacid contribution
export const OSMO_FACTOR_ELECTROLYTE   = 2;     // mOsm/L per mEq/kg (Na+K, both ions)

// ── Ca × PO4 precipitation (Freund's rule) ────────────────────────────────
export const CA_PO4_PRECIP_THRESHOLD   = 55;    // mmol²/L²  — risk above this value
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
export const TPN_RATE_WARN_THRESHOLD   = 1;     // ml/hr — warn if |prescribed − calc| > this
export const LIPID_RATE_WARN_THRESHOLD = 0.5;   // ml/hr
