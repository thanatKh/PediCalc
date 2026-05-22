import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer';
import {
  GIR_MAX_SAFE, GIR_MIN_SAFE,
  OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
  CA_PO4_PRECIP_THRESHOLD,
  NPC_N_TARGET_MIN, NPC_N_TARGET_MAX,
  HOURS_PER_DAY,
} from '@/utils/clinicalConstants';

// Use absolute URLs so react-pdf can fetch fonts reliably in both dev and production
const BASE = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: `${BASE}/fonts/Sarabun-Regular.ttf` },
    { src: `${BASE}/fonts/Sarabun-Italic.ttf`,   fontStyle: 'italic' },
    { src: `${BASE}/fonts/Sarabun-SemiBold.ttf`, fontWeight: 600 },
    { src: `${BASE}/fonts/Sarabun-Bold.ttf`,     fontWeight: 700 },
  ],
});
Font.register({
  family: 'Kanit',
  fonts: [
    { src: `${BASE}/fonts/Kanit-Regular.ttf` },
    { src: `${BASE}/fonts/Kanit-SemiBold.ttf`, fontWeight: 600 },
    { src: `${BASE}/fonts/Kanit-Bold.ttf`,     fontWeight: 700 },
  ],
});

// ── Thai line-break helper ──────────────────────────────────────────────────
// react-pdf only breaks lines at whitespace. Thai script doesn't use spaces
// between words, so an entire Thai phrase is treated as one unbreakable token
// and gets clipped instead of wrapping. We insert U+200B (zero-width space)
// at safe break points — specifically BEFORE Thai leading vowels
// (เ แ โ ใ ไ — U+0E40–U+0E44) which always mark the start of a new syllable.
// ZWSP is invisible and harmless inside text but tells the layout engine
// "you may break here if needed".
const ZWSP = '​';
const thaiBreak = (text) => {
  if (typeof text !== 'string') return text;
  // Insert ZWSP before each Thai leading vowel (when preceded by another character).
  // Leading vowels: เ (U+0E40), แ (U+0E41), โ (U+0E42), ใ (U+0E43), ไ (U+0E44)
  return text.replace(/(.)([เ-ไ])/g, `$1${ZWSP}$2`);
};

// Disable Latin hyphenation but allow each token to pass through unchanged —
// Thai breaks are handled by ZWSP injection above, not by the hyphenation callback.
Font.registerHyphenationCallback((word) => [word]);

const TEAL   = '#0d6e6e';
const TEAL_L = '#e6f4f4';
const SLATE  = '#1e293b';
const MUTED  = '#64748b';
const BORDER = '#e2e8f0';

const fmt = (n, d = 2) =>
  n === undefined || n === null || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const genDocId = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `PN-${now.getFullYear()}-${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const s = StyleSheet.create({
  page: { padding: '13 18 10 18', fontFamily: 'Sarabun', fontSize: 8, color: SLATE, backgroundColor: '#fff' },

  // ── Header ──
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 4, marginBottom: 3 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo:      { width: 48, height: 48, objectFit: 'contain' },
  logoFallback: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  hTitle:    { fontFamily: 'Kanit', fontSize: 10.5, fontWeight: 700, color: TEAL },
  hForm:     { fontFamily: 'Kanit', fontSize: 9, fontWeight: 600, color: SLATE, marginTop: 1 },
  hSub:      { fontSize: 7, color: '#475569', marginTop: 1 },
  hRight:    { textAlign: 'right', fontSize: 7, color: '#475569' },
  hMeta:     { marginBottom: 1 },
  hDocId:    { fontFamily: 'Kanit', fontWeight: 700, color: TEAL },

  // ── Patient box ──
  pBox:   { flexDirection: 'row', borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, marginBottom: 2.5, overflow: 'hidden' },
  pBar:   { width: 4, backgroundColor: TEAL },
  pInner: { flex: 1, padding: '3 5', backgroundColor: '#f8fafc' },
  pGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  pCell:  { width: '33.33%', fontSize: 7.5, paddingVertical: 0.5 },
  pLabel: { fontWeight: 700, color: '#475569' },
  pWarn:  { color: '#e11d48', fontWeight: 700 },
  pGreen: { color: '#166534', fontWeight: 700 },
  pAmber: { color: '#854d0e', fontWeight: 700 },

  // ── Rate / summary banner ──
  rateBanner: { flexDirection: 'row', gap: 2.5, marginBottom: 2.5 },
  rateCard:   { flex: 1, borderRadius: 3, padding: '3 4', alignItems: 'center', borderWidth: 0.5, borderColor: BORDER, backgroundColor: '#f8fafc' },
  rateLabel:  { fontSize: 6, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.3 },
  rateValue:  { fontFamily: 'Kanit', fontSize: 9, fontWeight: 700, marginTop: 1 },

  // ── Section header ──
  secHdr: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 1.5, gap: 4 },
  secBar: { width: 3, height: 9, backgroundColor: TEAL, borderRadius: 2 },
  secTxt: { fontFamily: 'Kanit', fontSize: 8, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.4 },
  secTag: { marginLeft: 'auto', fontSize: 6, color: MUTED, fontStyle: 'italic' },

  // ── Table ──
  table:   { borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 2, marginBottom: 2.5, overflow: 'hidden' },
  tHead:   { flexDirection: 'row', backgroundColor: TEAL },
  tRow:    { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  tRowAlt: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER, backgroundColor: '#f8fafc' },
  tRowHL:  { flexDirection: 'row', borderTopWidth: 1,   borderTopColor: '#94a3b8', backgroundColor: '#fffbeb' },
  tH:      { padding: '2.5 3', fontFamily: 'Kanit', fontSize: 7, fontWeight: 600, color: '#fff', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.25)' },
  tHLast:  { padding: '2.5 3', fontFamily: 'Kanit', fontSize: 7, fontWeight: 600, color: '#fff', textAlign: 'center' },
  tC:      { padding: '2 3', fontSize: 7.5, color: SLATE, borderRightWidth: 0.5, borderRightColor: BORDER },
  tCC:     { padding: '2 3', fontSize: 7.5, color: MUTED, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: BORDER },
  tCN:     { padding: '2 3', fontSize: 8, fontFamily: 'Kanit', color: SLATE, textAlign: 'right', fontWeight: 700, borderRightWidth: 0.5, borderRightColor: BORDER },
  tCL:     { padding: '2 3', fontSize: 7, color: MUTED },
  tSubHdr: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderTopWidth: 0.5, borderTopColor: BORDER },
  tSubTxt: { padding: '1.5 3', fontFamily: 'Kanit', fontSize: 6.5, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.3 },

  // ── Panel cards ──
  panelRow:   { flexDirection: 'row', gap: 2.5, marginBottom: 2.5 },
  panelCard:  { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, padding: '2.5 3', alignItems: 'center', backgroundColor: '#f8fafc' },
  panelAlert: { flex: 1, borderWidth: 1, borderColor: '#f59e0b', borderRadius: 3, padding: '2.5 3', alignItems: 'center', backgroundColor: '#fffbeb' },
  panelDanger:{ flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 3, padding: '2.5 3', alignItems: 'center', backgroundColor: '#fff1f2' },
  panelWarn:  { flex: 1, borderWidth: 1, borderColor: '#eab308', borderRadius: 3, padding: '2.5 3', alignItems: 'center', backgroundColor: '#fefce8' },
  panelLabel: { fontSize: 6, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.3 },
  panelValue: { fontFamily: 'Kanit', fontSize: 9, fontWeight: 700, color: SLATE, marginTop: 1, letterSpacing: 0.2 },
  panelSub:   { fontSize: 6.5, color: MUTED },

  // ── Warning banners ──
  warnBannerRed:    { backgroundColor: '#fee2e2', borderLeftWidth: 3, borderLeftColor: '#ef4444', borderRadius: 2, padding: '3 4', marginBottom: 2.5, fontSize: 7, color: '#991b1b', fontWeight: 700 },
  warnBannerOrange: { backgroundColor: '#fffbeb', borderLeftWidth: 3, borderLeftColor: '#f59e0b', borderRadius: 2, padding: '3 4', marginBottom: 2.5, fontSize: 7, color: '#92400e', fontWeight: 700 },
  warnBannerYellow: { backgroundColor: '#fefce8', borderLeftWidth: 3, borderLeftColor: '#eab308', borderRadius: 2, padding: '3 4', marginBottom: 2.5, fontSize: 7, color: '#713f12', fontWeight: 700 },

  // ── Heparin highlight row ──
  heparinRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f59e0b', backgroundColor: '#fffbeb' },

  // ── Bottom section ──
  bottomRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  notesCol:  { flex: 1.2 },
  notesBox:  { borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, flex: 1, padding: '3 4', fontSize: 7, color: '#94a3b8', fontStyle: 'italic', minHeight: 52 },
  notesLine: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginTop: 8 },
  sigCol:    { flex: 1 },
  sigBlock:  { alignItems: 'center', marginBottom: 3 },
  sigLine:   { borderBottomWidth: 0.5, borderBottomColor: '#94a3b8', width: '100%', height: 22, marginBottom: 2 },
  sigRole:   { fontFamily: 'Kanit', fontSize: 7.5, fontWeight: 600, color: TEAL },
  sigEn:     { fontSize: 6, color: MUTED },

  // ── Footer ──
  docFooter: { borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 2, marginTop: 2, flexDirection: 'row', justifyContent: 'space-between', fontSize: 6, color: '#94a3b8' },
});

const SectionHeader = ({ title, tag }) => (
  <View style={s.secHdr}>
    <View style={s.secBar} />
    <Text style={s.secTxt}>{title}</Text>
    {tag && <Text style={s.secTag}>{tag}</Text>}
  </View>
);

const renderRow = (row, i) => {
  const rowStyle = i % 2 === 1 ? s.tRowAlt : s.tRow;
  return (
    <View style={rowStyle} key={i} wrap={false}>
      <Text style={[s.tC,  { width: '34%' }]}>{thaiBreak(row.name)}</Text>
      <Text style={[s.tCC, { width: '22%' }]}>{thaiBreak(row.target)}</Text>
      <Text style={[s.tCN, { width: '16%', color: row.color || SLATE }]}>{fmt(row.ml)}</Text>
      <Text style={[s.tCL, { width: '28%' }]}>{thaiBreak(row.note)}</Text>
    </View>
  );
};

export default function TPNPdfDocument({ inputs, results, logoUrl }) {
  if (!results) return null;

  const docId      = genDocId();
  const nowDate    = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime    = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const isCentral  = inputs.lineType === 'central';
  const isNewborn  = inputs.patientType === 'newborn';
  const bwNum      = parseFloat(inputs.bw) || 1;

  // Safety flags — GIR is null when no TPN rate entered (reverse calc)
  const osmHigh      = (results.estOsmolarity ?? 0) > OSMOLARITY_PERIPHERAL_MAX;
  const girHigh      = !!results.girHigh;
  const girLow       = !!results.girLow;
  const fatRateHigh  = !!results.fatRateHigh;
  const caxPHigh     = !!results.caxPHigh;
  const peripheralRisk = !!results.peripheralRisk;

  // Derived electrolyte totals (from direct-source inputs)
  const na3Pct    = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlycero = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15Pct    = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4    = parseFloat(inputs.k2hpo4Target)    || 0;

  // Prescribed rates
  const manualTPNRate   = parseFloat(inputs.manualTPNRate);
  const manualLipidRate = parseFloat(inputs.manualLipidRate);
  const hasManualTPN    = !isNaN(manualTPNRate) && inputs.manualTPNRate !== '' && manualTPNRate > 0;
  const hasManualLipid  = !isNaN(manualLipidRate) && inputs.manualLipidRate !== '';

  // Table rows — 2-in-1 bag
  const bag2in1Rows = [
    { name: `Dextrose ${inputs.dextrosePct || 10}% (from 50% Glucose)`,
      target: `GIR ${fmt(results.gir, 1)} mg/kg/min`,           ml: results.dextroseMl,    note: '0.5 g/ml - dilute with sterile water' },
    { name: '10% Aminoven Infant',
      target: `${inputs.proteinTarget} g/kg/day`,                ml: results.aminovenMl,    note: '2.5-3.5 g/kg/day' },
    { name: '3% NaCl',
      target: `Na ${fmt(na3Pct, 2)} mEq/kg`,                    ml: results.na3PctMl,      note: '0.5 mEq Na/ml' },
    { name: 'Na Glycerophosphate',
      target: `Na ${fmt(naGlycero, 2)} mEq/kg`,                 ml: results.naGlyceroml,   note: 'Na+PO4, 2 mEq Na/ml' },
    { name: '15% KCl',
      target: `K ${fmt(k15Pct, 2)} mEq/kg`,                     ml: results.k15PctMl,      note: '2 mEq K/ml' },
    { name: '8.71% K2HPO4',
      target: `K ${fmt(k2hpo4, 2)} mEq/kg`,                     ml: results.k2hpo4Ml,      note: 'K+PO4, 1 mEq K/ml' },
    { name: '10% Calcium Gluconate',
      target: `${inputs.caTarget} mmol/kg`,                      ml: results.caGluconateMl, note: '0.25 mmol/ml' },
    { name: '50% MgSO4',
      target: `${inputs.mgTarget} mEq/kg`,                       ml: results.mgso4Ml,       note: '4 mEq/ml' },
    { name: 'Soluvit-N',
      target: '1 ml/kg/day',                                     ml: results.soluvitMl,     note: 'Water-soluble vitamins, max 10 ml/day' },
    { name: 'Pediatrace',
      target: '1 ml/kg/day',                                     ml: results.pediatraceMl,  note: 'Trace elements, max 10 ml/day' },
  ];

  const lipidRows = [
    { name: '20% SMOFlipid',
      target: `${inputs.lipidTarget} g/kg`,    ml: results.lipidMl,     note: 'MCT/Soy/Olive/Fish oil' },
    { name: 'Vitalipid N Infant',
      target: '4 ml/kg/day',                    ml: results.vitalipidMl, note: 'Add to lipid bag (max 10 ml/day)' },
  ];

  const tableHeader = (
    <View style={s.tHead}>
      <Text style={[s.tH,     { width: '34%' }]}>Ingredients</Text>
      <Text style={[s.tH,     { width: '22%' }]}>Target / kg/day</Text>
      <Text style={[s.tH,     { width: '16%' }]}>Volume (ml)</Text>
      <Text style={[s.tHLast, { width: '28%' }]}>Remarks</Text>
    </View>
  );

  const hn      = (inputs.hn || 'NONAME').replace(/[^a-zA-Z0-9]/g, '');
  const bw      = (inputs.bw || '0').replace('.', '-');
  const today   = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const pdfTitle = `TPN_${hn}_${bw}kg_${dateStr}`;

  return (
    <Document title={pdfTitle} author="PediCalc - Kabinburi Hospital" subject="Neonatal TPN Order Form">
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.headerRow}>
          <View style={s.logoRow}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logo} />
              : <View style={s.logoFallback}><Text style={{ fontSize: 6.5, color: MUTED }}>LOGO</Text></View>
            }
            <View>
              <Text style={s.hTitle}>โรงพยาบาลกบินทร์บุรี | Kabinburi Hospital</Text>
              <Text style={s.hForm}>{isNewborn ? 'NEONATAL' : 'PEDIATRIC'} PARENTERAL NUTRITION ORDER FORM</Text>
              <Text style={s.hSub}>{isNewborn ? 'Intravenous Nutrition Order · Neonatal' : 'Intravenous Nutrition Order · Pediatric'}</Text>
            </View>
          </View>
          <View style={s.hRight}>
            <Text style={s.hMeta}><Text style={{ fontWeight: 700 }}>เลขที่: </Text><Text style={s.hDocId}>{docId}</Text></Text>
            <Text style={s.hMeta}><Text style={{ fontWeight: 700 }}>วันที่: </Text>{nowDate}</Text>
            <Text style={s.hMeta}><Text style={{ fontWeight: 700 }}>เวลา: </Text>{nowTime} น.</Text>
          </View>
        </View>

        {/* ── PATIENT INFO ── */}
        <View style={s.pBox}>
          <View style={s.pBar} />
          <View style={s.pInner}>
            <View style={s.pGrid}>
              <Text style={s.pCell}><Text style={s.pLabel}>Name: </Text>{inputs.name || 'N/A'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>HN: </Text>{inputs.hn ? inputs.hn : <Text style={s.pWarn}>⚠ Not specified</Text>}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Ward: </Text>{inputs.ward || '—'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Age: </Text>{inputs.ageMonth || '0'} mo {inputs.ageDay || '0'} d</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Weight: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700 }}>{inputs.bw || '—'} kg</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Height: </Text>{inputs.height ? `${inputs.height} cm` : '—'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Mode: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700, color: TEAL }}>{isNewborn ? 'Newborn (+25 ml)' : 'Pediatric'}</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Route: </Text><Text style={isCentral ? s.pGreen : s.pAmber}>{isCentral ? 'Central line' : 'Peripheral line'}</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>TPN Start: </Text>{inputs.startDate ? fmtDate(inputs.startDate) : '—'}</Text>
            </View>
            {/* Derived electrolyte totals */}
            <View style={{ flexDirection: 'row', marginTop: 4, gap: 4 }}>
              {[
                { label: 'Total Na',   value: `${fmt(results.totalNaActual, 2)} mEq/kg/day` },
                { label: 'Total K',    value: `${fmt(results.totalKActual, 2)} mEq/kg/day` },
                { label: 'Total PO4',  value: `${fmt(results.totalPO4, 2)} mmol/kg/day` },
                { label: 'Fat Rate',   value: `${fmt(results.fatRateGKgHr, 3)} g/kg/hr${fatRateHigh ? ' ⚠' : ''}`,
                  alert: fatRateHigh },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, backgroundColor: item.alert ? '#fee2e2' : '#f1f5f9', borderRadius: 2, padding: '3 4', borderWidth: item.alert ? 0.5 : 0, borderColor: item.alert ? '#ef4444' : 'transparent' }}>
                  <Text style={{ fontSize: 6.5, color: item.alert ? '#991b1b' : MUTED, textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.label}</Text>
                  <Text style={{ fontFamily: 'Kanit', fontSize: 8, fontWeight: 700, color: item.alert ? '#991b1b' : SLATE, marginTop: 1 }}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── RATE / SUMMARY BANNER ── */}
        <View style={s.rateBanner}>
          {[
            { label: 'TPN Volume',             val: `${fmt(results.tpnVolume ?? results.bag2in1Vol, 1)} ml`,  color: SLATE },
            { label: 'Total Volume / day',     val: `${fmt(results.totalVolume, 1)} ml`,                      color: SLATE },
            { label: 'Prescribed TPN Rate',    val: hasManualTPN ? `${fmt(manualTPNRate, 1)} ml/hr` : '— not set', color: hasManualTPN ? SLATE : MUTED },
            { label: 'GIR (from TPN Rate)',    val: results.gir !== null ? `${fmt(results.gir, 2)} mg/kg/min` : '— enter rate', color: results.girHigh || results.girLow ? '#991b1b' : (results.gir !== null ? SLATE : MUTED), alert: results.girHigh || results.girLow },
            { label: 'Lipid Rate',             val: `${fmt(results.lipidRate, 1)} ml/hr`,                     color: fatRateHigh ? '#991b1b' : SLATE, alert: fatRateHigh },
          ].map((item) => (
            <View key={item.label} style={[s.rateCard, item.alert ? { backgroundColor: '#fee2e2', borderColor: '#ef4444' } : {}]}>
              <Text style={s.rateLabel}>{item.label}</Text>
              <Text style={[s.rateValue, { color: item.color }]}>{item.val}</Text>
            </View>
          ))}
        </View>

        {/* ── WARNING BANNERS ── */}
        {fatRateHigh && (
          <Text style={s.warnBannerRed}>
            {`⚠ CRITICAL: Fat Infusion Rate ${fmt(results.fatRateGKgHr, 3)} g/kg/hr — exceeds 0.17 g/kg/hr — Risk of Fat Overload Syndrome — Reduce Lipid target`}
          </Text>
        )}
        {(girHigh || girLow) && (
          <Text style={s.warnBannerOrange}>
            {`⚠ GIR ${girHigh ? 'Too High' : 'Too Low'}: ${fmt(results.gir, 2)} mg/kg/min — Target 4–12 mg/kg/min — Adjust prescribed TPN Rate or Dextrose%`}
          </Text>
        )}
        {peripheralRisk && (
          <Text style={s.warnBannerOrange}>
            {`⚠ Peripheral Line Risk — Dextrose ${inputs.dextrosePct}% / Osmolarity ${fmt(results.estOsmolarity, 0)} mOsm/L exceeds limit — Consider Central line`}
          </Text>
        )}
        {caxPHigh && (
          <Text style={s.warnBannerYellow}>
            {`⚠ Risk of Ca-Phosphate Precipitation — Ca×PO4 = ${fmt(results.caxP, 1)} mmol²/L² (> 55) — Reduce Ca or PO4, or use separate line`}
          </Text>
        )}

        {/* ── INGREDIENTS TABLE ── */}
        <SectionHeader title="Preparation Order" />
        <View style={s.table}>
          {tableHeader}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 1 · TPN Bag (combined in one bag)</Text>
          </View>
          {bag2in1Rows.map((row, i) => renderRow(row, i))}
          {/* Sterile water */}
          <View style={[s.tRowHL, { minHeight: 20 }]}>
            <Text style={[s.tC,  { width: '34%', fontWeight: 700, color: '#92400e' }]}>Sterile Water for Injection</Text>
            <Text style={[s.tCC, { width: '22%', color: '#92400e' }]}>q.s. to volume</Text>
            <Text style={[s.tCN, { width: '16%', color: '#92400e', fontSize: 9.5 }]}>{fmt(results.sterileWaterMl)}</Text>
            <Text style={[s.tCL, { width: '28%', color: '#92400e' }]}>q.s. to fill TPN Volume</Text>
          </View>
          {/* Heparin */}
          <View style={s.heparinRow}>
            <Text style={[s.tC,  { width: '34%', fontWeight: 700, color: '#92400e' }]}>Heparin</Text>
            <Text style={[s.tCC, { width: '22%', color: '#92400e' }]}>{fmt(results.heparinUnitPerMl, 1)} unit/ml</Text>
            <Text style={[s.tCN, { width: '16%', color: '#92400e' }]}>{fmt(results.heparinMl, 2)}</Text>
            <Text style={[s.tCL, { width: '28%', color: '#92400e' }]}>{fmt(results.heparinUnits, 0)} units — stock 100 IU/ml</Text>
          </View>
          {/* Lipid */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 2 · Lipid Emulsion (separate line — Y-site / piggyback)</Text>
          </View>
          {lipidRows.map((row, i) => renderRow(row, i))}
        </View>

        {/* ── ENERGY + SAFETY (side by side) ── */}
        <View style={{ flexDirection: 'row', gap: 7 }}>

          {/* Energy */}
          <View style={{ flex: 1.1 }}>
            <SectionHeader title="Energy Distribution" />
            <View style={s.panelRow}>
              <View style={s.panelCard}>
                <Text style={s.panelLabel}>Total Energy</Text>
                <Text style={s.panelValue}>{fmt(results.totalEnergy, 1)}</Text>
                <Text style={s.panelSub}>kcal/day</Text>
              </View>
              <View style={s.panelCard}>
                <Text style={s.panelLabel}>kcal/kg/day</Text>
                <Text style={s.panelValue}>{fmt(results.kcalPerKg, 1)}</Text>
                <Text style={s.panelSub}>kcal/kg</Text>
              </View>
              <View style={(results.npcN < NPC_N_TARGET_MIN || results.npcN > NPC_N_TARGET_MAX) ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>NPC:N</Text>
                <Text style={[s.panelValue, { color: (results.npcN < NPC_N_TARGET_MIN || results.npcN > NPC_N_TARGET_MAX) ? '#b45309' : SLATE }]}>{fmt(results.npcN, 0)}</Text>
                <Text style={s.panelSub}>target 150–200</Text>
              </View>
            </View>
            <View style={s.panelRow}>
              <View style={s.panelCard}>
                <Text style={s.panelLabel}>CHO (3.4 kcal/g)</Text>
                <Text style={[s.panelValue, { fontSize: 8.5 }]}>{fmt(results.cho_kcal, 1)} kcal</Text>
                <Text style={s.panelSub}>{fmt(results.choPct, 1)}%</Text>
              </View>
              <View style={s.panelCard}>
                <Text style={s.panelLabel}>Protein (4 kcal/g)</Text>
                <Text style={[s.panelValue, { fontSize: 8.5 }]}>{fmt(results.protein_kcal, 1)} kcal</Text>
                <Text style={s.panelSub}>{fmt(results.proteinPct, 1)}%</Text>
              </View>
              <View style={s.panelCard}>
                <Text style={s.panelLabel}>Fat (2 kcal/ml)</Text>
                <Text style={[s.panelValue, { fontSize: 8.5 }]}>{fmt(results.fat_kcal, 1)} kcal</Text>
                <Text style={s.panelSub}>{fmt(results.fatPct, 1)}%</Text>
              </View>
            </View>
          </View>

          {/* Safety */}
          <View style={{ flex: 1 }}>
            <SectionHeader title="Clinical Safety Checks" />
            <View style={s.panelRow}>
              <View style={girHigh || girLow ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>GIR (Reverse Calc)</Text>
                <Text style={[s.panelValue, { color: girHigh || girLow ? '#b45309' : SLATE }]}>
                  {results.gir !== null ? fmt(results.gir, 2) : '—'}<Text style={{ fontSize: 6, fontFamily: 'Sarabun', fontWeight: 400 }}>{results.gir !== null ? ' mg/kg/min' : ' enter TPN rate'}</Text>
                </Text>
                <Text style={[s.panelSub, { color: girHigh || girLow ? '#b45309' : MUTED }]}>
                  {girHigh ? '⚠ Too high >12' : girLow ? '⚠ Too low <4' : results.gir !== null ? 'target 4–12 ✓' : 'needs TPN rate'}
                </Text>
              </View>
              <View style={(osmHigh && !isCentral) ? s.panelDanger : osmHigh ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>Osmolarity</Text>
                <Text style={[s.panelValue, { color: osmHigh ? '#b91c1c' : SLATE }]}>
                  {fmt(results.estOsmolarity, 0)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> mOsm/L</Text>
                </Text>
                <Text style={[s.panelSub, { color: osmHigh ? '#b91c1c' : MUTED }]}>
                  {osmHigh && !isCentral ? '⚠ Central only' : osmHigh ? 'Central required' : 'OK ✓'}
                </Text>
              </View>
            </View>
            <View style={s.panelRow}>
              <View style={fatRateHigh ? s.panelDanger : s.panelCard}>
                <Text style={s.panelLabel}>Fat Rate</Text>
                <Text style={[s.panelValue, { color: fatRateHigh ? '#b91c1c' : SLATE }]}>
                  {fmt(results.fatRateGKgHr, 3)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> g/kg/hr</Text>
                </Text>
                <Text style={[s.panelSub, { color: fatRateHigh ? '#b91c1c' : MUTED }]}>{fatRateHigh ? '⚠ CRITICAL >0.17' : 'max 0.17 ✓'}</Text>
              </View>
              <View style={caxPHigh ? s.panelWarn : s.panelCard}>
                <Text style={s.panelLabel}>Ca × PO4</Text>
                <Text style={[s.panelValue, { color: caxPHigh ? '#854d0e' : SLATE }]}>
                  {fmt(results.caxP, 1)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> mmol²/L²</Text>
                </Text>
                <Text style={[s.panelSub, { color: caxPHigh ? '#854d0e' : MUTED }]}>{caxPHigh ? `⚠ Precip. risk >${CA_PO4_PRECIP_THRESHOLD}` : 'Compatible ✓'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── BOTTOM: NOTES + SIGNATURES ── */}
        <SectionHeader title="Special Instructions & Signatures" />
        <View style={s.bottomRow}>
          <View style={s.notesCol}>
            <View style={s.notesBox}>
              <Text style={{ fontSize: 7, color: MUTED, marginBottom: 3 }}>หมายเหตุ / คำสั่งพิเศษ / Notes &amp; Comments</Text>
              <View style={s.notesLine} />
              <View style={s.notesLine} />
              <View style={s.notesLine} />
              <View style={s.notesLine} />
              <View style={s.notesLine} />
            </View>
          </View>
          <View style={[s.sigCol, { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }]}>
            {[
              { role: 'แพทย์ผู้สั่งยา',      en: 'Physician' },
              { role: 'เภสัชกรผู้ตรวจสอบ', en: 'Pharmacist' },
            ].map((sig) => (
              <View key={sig.role} style={[s.sigBlock, { flex: 1 }]}>
                <View style={s.sigLine} />
                <Text style={s.sigRole}>{sig.role}</Text>
                <Text style={s.sigEn}>({sig.en})</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── DOC FOOTER ── */}
        <View style={s.docFooter}>
          <Text style={{ fontStyle: 'italic', flex: 1 }}>{thaiBreak('* เอกสารสร้างอัตโนมัติโดยระบบ PediCalc — โรงพยาบาลกบินทร์บุรี กรุณาตรวจสอบก่อนใช้งานทุกครั้ง')}</Text>
          <Text style={{ fontFamily: 'Kanit', color: MUTED }} render={({ pageNumber, totalPages }) => `${docId} · หน้า ${pageNumber}/${totalPages}`} fixed />
        </View>

      </Page>
    </Document>
  );
}
