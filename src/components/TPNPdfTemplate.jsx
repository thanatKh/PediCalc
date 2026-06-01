import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer';
import {
  OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
  NPC_N_SAFE_MIN, NPC_N_SAFE_MAX,
} from '@/utils/clinicalConstants';
import { fmt, fmtN } from '@/utils/fmt';
import { getPdfCriticalAlerts } from '@/utils/clinicalDecisionSupport';

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

const ZWSP = '​';
const thaiBreak = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/(.)([เ-ไ])/g, `$1${ZWSP}$2`);
};
Font.registerHyphenationCallback((word) => [word]);

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  teal:      '#0d6e6e',
  tealDark:  '#085555',
  tealLight: '#e8f4f4',
  tealMid:   '#b2d8d8',
  slate:     '#1e293b',
  slate2:    '#334155',
  muted:     '#64748b',
  muted2:    '#94a3b8',
  border:    '#e2e8f0',
  border2:   '#cbd5e1',
  bg:        '#f8fafc',
  white:     '#ffffff',
  // Status
  red:       '#b91c1c',
  redBg:     '#fef2f2',
  redBdr:    '#fca5a5',
  amber:     '#92400e',
  amberBg:   '#fffbeb',
  amberBdr:  '#fcd34d',
  yellow:    '#713f12',
  yellowBg:  '#fefce8',
  yellowBdr: '#fde047',
  green:     '#166534',
};

// ── Typographic scale (pt) ───────────────────────────────────────────────────
// 8   → caption/footnote
// 9.5 → body / table cell
// 10.5→ body emphasis / label
// 11  → sub-heading (unchanged)
// 13  → heading (unchanged)
const T = { caption: 8, body: 9.5, emphasis: 10.5, sub: 11, heading: 13 };

// ── Spacing scale (pt) ───────────────────────────────────────────────────────
const SP = { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 };

const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const genDocId = (hn) => {
  const now    = new Date();
  const pad    = (n) => String(n).padStart(2, '0');
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const hhmm   = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return hn ? `TPN-${hn}-${yymmdd}-${hhmm}` : `TPN-${yymmdd}-${hhmm}`;
};

const s = StyleSheet.create({
  // ── Page — tighter margins to fit everything on one A4 ──
  page: {
    paddingTop: 14, paddingBottom: 14, paddingHorizontal: 22,
    fontFamily: 'Sarabun', fontSize: T.body, color: C.slate,
    backgroundColor: C.white, lineHeight: 1.25,
  },

  // ── Header ──
  headerWrap: {
    borderBottomWidth: 2, borderBottomColor: C.teal,
    paddingBottom: 2, marginBottom: 2,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, flex: 1 },
  logo:        { width: 52, height: 52, objectFit: 'contain' },
  logoBox:     { width: 52, height: 52, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  hospName:    { fontFamily: 'Kanit', fontSize: 9.5, fontWeight: 700, color: C.teal, marginBottom: 1 },
  formTitle:   { fontFamily: 'Kanit', fontSize: T.body, fontWeight: 600, color: C.slate, marginBottom: 1 },
  formSub:     { fontSize: T.caption, color: C.muted, letterSpacing: 0.3 },
  headerRight: { alignItems: 'flex-end', minWidth: 110 },
  docIdLabel:  { fontSize: T.caption, color: C.muted, marginBottom: 1 },
  docId:       { fontFamily: 'Kanit', fontSize: T.body, fontWeight: 700, color: C.teal, marginBottom: 1 },
  metaLine:    { fontSize: T.caption, color: C.slate2, marginBottom: 1 },
  metaKey:     { fontWeight: 700 },

  // ── Patient info box ──
  patientBox:  {
    flexDirection: 'row', borderWidth: 1, borderColor: C.border2,
    borderRadius: 3, marginBottom: 2, overflow: 'hidden',
  },
  patientBar:  { width: 4, backgroundColor: C.teal },
  patientInner:{ flex: 1, paddingTop: 2, paddingHorizontal: 4, paddingBottom: 5, backgroundColor: C.bg },
  patientTitle:{ fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 700, color: C.muted,
                 textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  patientCell: { width: '33.33%', paddingVertical: 1, fontSize: T.body },
  pLabel:      { color: C.muted, fontWeight: 700 },
  pVal:        { color: C.slate },

  // ── Warning banners ──
  warnRed:    { flexDirection: 'row', backgroundColor: C.redBg,    borderLeftWidth: 3, borderLeftColor: C.red,    borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnAmber:  { flexDirection: 'row', backgroundColor: C.amberBg,  borderLeftWidth: 3, borderLeftColor: '#f59e0b', borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnYellow: { flexDirection: 'row', backgroundColor: C.yellowBg, borderLeftWidth: 3, borderLeftColor: '#eab308', borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnText:   { fontSize: T.caption, fontWeight: 700, flex: 1 },

  // ── Section header ──
  secHdr: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, marginBottom: 2 },
  secBar: { width: 3, height: 8, backgroundColor: C.teal, borderRadius: 1.5 },
  secTxt: { fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 0.5 },
  secTag: { marginLeft: 'auto', fontSize: 8.5, color: C.muted, fontStyle: 'italic' },

  // ── Table ──
  table:      { borderWidth: 1, borderColor: C.border2, borderRadius: 3, marginBottom: 3, overflow: 'hidden' },
  tHead:      { flexDirection: 'row', backgroundColor: C.teal },
  tSubHdr:    { flexDirection: 'row', backgroundColor: '#f1f5f9', borderTopWidth: 1, borderTopColor: C.border2 },
  tSubTxt:    { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 8.5, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 0.4 },
  tRow:       { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt:    { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border, backgroundColor: '#fafbfd' },
  tRowHL:     { flexDirection: 'row', borderTopWidth: 1,   borderTopColor: C.border2, backgroundColor: '#fffbeb' },
  tRowHep:    { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.amberBdr, backgroundColor: '#fffbeb' },
  tRowTotal:  { flexDirection: 'row', borderTopWidth: 1.5, borderTopColor: C.tealMid, backgroundColor: C.tealLight },
  tH:         { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 8, fontWeight: 600, color: C.white, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)' },
  tHLast:     { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 8, fontWeight: 600, color: C.white },
  tCName:     { padding: '1.5 5', fontSize: T.caption, color: C.slate,  borderRightWidth: 0.5, borderRightColor: C.border },
  tCTarget:   { padding: '1.5 5', fontSize: 8.5,       color: C.muted,  borderRightWidth: 0.5, borderRightColor: C.border, textAlign: 'center' },
  tCVol:      { padding: '1.5 5', fontSize: T.caption, color: C.slate,  borderRightWidth: 0.5, borderRightColor: C.border, textAlign: 'right', fontFamily: 'Kanit', fontWeight: 700 },
  tCNote:     { padding: '1.5 5', fontSize: 8.5,       color: C.muted },

  // ── Stat cards ──
  cardRow:    { flexDirection: 'row', gap: 2, marginBottom: 2 },
  card:       { flex: 1, borderWidth: 1, borderColor: C.border2, borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.bg },
  cardAlert:  { flex: 1, borderWidth: 1, borderColor: C.amberBdr, borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.amberBg },
  cardDanger: { flex: 1, borderWidth: 1, borderColor: C.redBdr,   borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.redBg },
  cardWarn:   { flex: 1, borderWidth: 1, borderColor: C.yellowBdr,borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.yellowBg },
  cardLabel:  { fontSize: T.caption, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1.5, textAlign: 'center' },
  cardValue:  { fontFamily: 'Kanit', fontSize: T.emphasis, fontWeight: 700, color: C.slate },
  cardUnit:   { fontSize: T.emphasis, fontFamily: 'Sarabun', fontWeight: 400, color: C.muted },
  cardSub:    { fontSize: T.caption, color: C.muted, textAlign: 'center', marginTop: 1.5 },

  // ── Notes ──
  notesBox:  { borderWidth: 1, borderColor: C.border2, borderRadius: 3, padding: '3 5', marginTop: 2, backgroundColor: C.white },
  notesTitle:{ fontFamily: 'Kanit', fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  notesLine: { borderBottomWidth: 0.5, borderBottomColor: C.border2, marginTop: 13 },

  // ── Signatures ──
  sigSection: { flexDirection: 'row', gap: SP.lg, marginTop: 4 },
  sigBlock:   { flex: 1, alignItems: 'center' },
  sigLine:    { borderBottomWidth: 1, borderBottomColor: C.border2, width: '100%', marginBottom: 3, paddingTop: 24 },
  sigRole:    { fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 600, color: C.teal, textAlign: 'center' },
  sigEn:      { fontSize: 8.5, color: C.muted, textAlign: 'center', marginTop: 1 },

  // ── Footer ──
  footer: {
    borderTopWidth: 0.5, borderTopColor: C.border,
    paddingTop: 2, marginTop: 3,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 7, color: C.muted2,
  },
});

// ── Reusable components ──────────────────────────────────────────────────────

const SectionHeader = ({ title, tag }) => (
  <View style={s.secHdr}>
    <View style={s.secBar} />
    <Text style={s.secTxt}>{title}</Text>
    {tag && <Text style={s.secTag}>{tag}</Text>}
  </View>
);

const StatCard = ({ label, value, unit, sub, tone = 'normal' }) => {
  const cardStyle = tone === 'danger' ? s.cardDanger : tone === 'alert' ? s.cardAlert : tone === 'warn' ? s.cardWarn : s.card;
  const valColor  = tone === 'danger' ? C.red : tone === 'alert' ? C.amber : tone === 'warn' ? C.yellow : C.slate;
  const subColor  = tone !== 'normal' ? valColor : C.muted;
  return (
    <View style={cardStyle}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={[s.cardValue, { color: valColor }]}>
        {value}
        {unit ? <Text style={s.cardUnit}> {unit}</Text> : null}
      </Text>
      {sub ? <Text style={[s.cardSub, { color: subColor }]}>{sub}</Text> : null}
    </View>
  );
};

const WarnBanner = ({ level, text }) => {
  const style = level === 'red' ? s.warnRed : level === 'amber' ? s.warnAmber : s.warnYellow;
  const color = level === 'red' ? C.red : level === 'amber' ? '#92400e' : '#713f12';
  return (
    <View style={style}>
      <Text style={[s.warnText, { color }]}>{text}</Text>
    </View>
  );
};

// fmtPrep: alias for fmtN — used in Preparation Order table.
const fmtPrep = fmtN;

const renderIngredientRow = (row, i) => (
  <View style={i % 2 === 0 ? s.tRow : s.tRowAlt} key={i} wrap={false}>
    <Text style={[s.tCName, { width: '33%' }]}>{thaiBreak(row.name)}</Text>
    {/* Target: value right-aligned | unit left-aligned for vertical alignment */}
    <View style={{ width: '20%', flexDirection: 'row', borderRightWidth: 0.5, borderRightColor: C.border }}>
      <Text style={[s.tCTarget, { flex: 1, textAlign: 'right', borderRightWidth: 0 }]}>{row.targetVal}</Text>
      <Text style={[s.tCTarget, { flex: 1.4, textAlign: 'left',  borderRightWidth: 0, color: C.muted2 }]}>{row.targetUnit}</Text>
    </View>
    <Text style={[s.tCVol,  { width: '14%' }, row.color ? { color: row.color } : {}]}>{fmtPrep(row.ml)}</Text>
    <Text style={[s.tCNote, { width: '33%' }]}>{thaiBreak(row.note)}</Text>
  </View>
);

// ── Main document ────────────────────────────────────────────────────────────

export default function TPNPdfDocument({ inputs, results, logoUrl, hospital }) {
  if (!results) return null;

  const hn         = (inputs.hn || '').replace(/[^a-zA-Z0-9]/g, '');
  const docId      = genDocId(hn);
  const nowDate    = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime    = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const hospNameTh = hospital?.nameTh ?? 'โรงพยาบาลกบินทร์บุรี';
  const hospNameEn = hospital?.nameEn ?? 'Kabinburi Hospital';

  const isCentral = inputs.lineType === 'central';

  // Safety flags — for StatCard display only (read from calculator results, not re-derived)
  const osmHigh        = (results.estOsmolarity ?? 0) > OSMOLARITY_PERIPHERAL_MAX;
  const girHigh        = !!results.girHigh;
  const girLow         = !!results.girLow;
  const fatRateHigh    = !!results.fatRateHigh;

  // CDS-driven alert banners — single source of truth with the web CDS engine.
  // getPdfCriticalAlerts runs evaluateClinicalTiers and returns only critical-tier checks.
  // To add/change/remove an alert: edit clinicalDecisionSupport.js only.
  const pdfAlerts = getPdfCriticalAlerts(inputs, results);
  const caxPHigh  = pdfAlerts.some(a => a.key === 'caxp');

  // Source inputs
  const na3Pct    = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlycero = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15Pct    = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4    = parseFloat(inputs.k2hpo4Target)    || 0;

  const manualTPNRate = parseFloat(inputs.manualTPNRate);
  const hasManualTPN  = !isNaN(manualTPNRate) && inputs.manualTPNRate !== '' && manualTPNRate > 0;

  // NPC:N tone
  const npcOutOfRange = (results.npcN ?? 0) < NPC_N_SAFE_MIN || (results.npcN ?? 0) > NPC_N_SAFE_MAX;

  // Ingredients
  const bag2in1Rows = [
    { name: `Dextrose ${inputs.dextrosePct || 10}% (from 50% Glucose)`,
      targetVal: results.gir !== null ? `GIR ${fmt(results.gir, 1)}` : '—', targetUnit: 'mg/kg/min', ml: results.dextroseMl, note: '0.5 g/ml — dilute with sterile water' },
    { name: '10% Aminoven Infant',
      targetVal: fmtPrep(parseFloat(inputs.proteinTarget)), targetUnit: 'g/kg/day',  ml: results.aminovenMl,    note: '2.5–3.5 g/kg/day (usual range)' },
    { name: '3% NaCl',
      targetVal: `Na ${fmtPrep(na3Pct)}`,       targetUnit: 'mEq/kg',    ml: results.na3PctMl,      note: '0.5 mEq Na/ml' },
    { name: 'Na Glycerophosphate',
      targetVal: `Na ${fmtPrep(naGlycero)}`,    targetUnit: 'mEq/kg',    ml: results.naGlyceroml,   note: 'Na + PO4 · 2 mEq Na/ml' },
    { name: '15% KCl',
      targetVal: `K ${fmtPrep(k15Pct)}`,        targetUnit: 'mEq/kg',    ml: results.k15PctMl,      note: '2 mEq K/ml' },
    { name: '8.71% K2HPO4',
      targetVal: `K ${fmtPrep(k2hpo4)}`,        targetUnit: 'mEq/kg',    ml: results.k2hpo4Ml,      note: 'K + PO4 · 1 mEq K/0.5 mmol PO4/ml' },
    { name: '10% Calcium Gluconate',
      targetVal: fmtPrep(parseFloat(inputs.caTarget)),     targetUnit: 'mmol/kg',   ml: results.caGluconateMl, note: '0.225 mmol/ml = 0.45 mEq/ml' },
    { name: '50% MgSO4',
      targetVal: fmtPrep(parseFloat(inputs.mgTarget)),     targetUnit: 'mEq/kg',    ml: results.mgso4Ml,       note: '4 mEq/ml' },
    { name: 'Soluvit-N',
      targetVal: fmtPrep(1),                    targetUnit: 'ml/kg/day', ml: results.soluvitMl,     note: 'Water-soluble vitamins · max 10 ml/day' },
    { name: 'Pediatrace',
      targetVal: fmtPrep(1),                    targetUnit: 'ml/kg/day', ml: results.pediatraceMl,  note: 'Trace elements · max 10 ml/day' },
    { name: 'Heparin (Sodium)',
      targetVal: `${fmtN(results.heparinUnitPerMl)} IU/ml`, targetUnit: '(conc.)', ml: results.heparinMl, note: `${fmtN(results.heparinUnits)} IU total · stock 100 IU/ml` },
  ];

  const lipidRows = [
    { name: '20% SMOFlipid',
      targetVal: fmtPrep(parseFloat(inputs.lipidTarget)), targetUnit: 'g/kg',       ml: results.lipidMl,     note: 'MCT/Soy/Olive/Fish oil emulsion' },
    { name: 'Vitalipid N Infant',
      targetVal: fmtPrep(4),         targetUnit: 'ml/kg/day',  ml: results.vitalipidMl, note: 'Fat-soluble vitamins · add to lipid · max 10 ml/day' },
  ];

  const pdfTitle = docId;

  return (
    <Document title={pdfTitle} author={`PediCalc — ${hospNameEn}`} subject="Neonatal TPN Order Form">
      <Page size="A4" style={s.page}>

        {/* ══════════════════════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <View style={s.headerWrap} fixed>
          <View style={s.headerLeft}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logo} />
              : <View style={s.logoBox}><Text style={{ fontSize: T.caption, color: C.muted }}>LOGO</Text></View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.hospName}>{hospNameTh}</Text>
              <Text style={[s.hospName, { fontSize: T.body, fontWeight: 600, color: C.slate2, marginTop: -1, marginBottom: 2 }]}>{hospNameEn}</Text>
              <Text style={s.formTitle}>
                NEONATAL PARENTERAL NUTRITION ORDER FORM
              </Text>
              <Text style={s.formSub}>
                Intravenous Nutrition Order · Neonatal Unit
              </Text>
            </View>
          </View>

          <View style={s.headerRight}>
            <Text style={s.docIdLabel}>เลขที่เอกสาร / Doc. No.</Text>
            <Text style={s.docId}>{docId}</Text>
            <Text style={s.metaLine}><Text style={s.metaKey}>วันที่ · Date:  </Text>{nowDate}</Text>
            <Text style={s.metaLine}><Text style={s.metaKey}>เวลา · Time:  </Text>{nowTime} น.</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            PATIENT INFORMATION
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="Patient Information" tag="ข้อมูลผู้ป่วย" />
        <View style={s.patientBox}>
          <View style={s.patientBar} />
          <View style={s.patientInner}>
            <View style={s.patientGrid}>
              <Text style={s.patientCell}><Text style={s.pLabel}>Name: </Text><Text style={s.pVal}>{inputs.name || '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>HN: </Text><Text style={s.pVal}>{inputs.hn || '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Ward: </Text><Text style={s.pVal}>{inputs.ward || '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Age: </Text><Text style={s.pVal}>{(inputs.ageMonth || inputs.ageDay) ? `${inputs.ageMonth || '0'} mo ${inputs.ageDay || '0'} d` : '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Weight: </Text><Text style={s.pVal}>{inputs.bw ? `${inputs.bw} kg` : '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Height: </Text><Text style={s.pVal}>{inputs.height ? `${inputs.height} cm` : '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Formula: </Text><Text style={s.pVal}>{'Neonatal (25 ml line reserve)'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Route: </Text><Text style={s.pVal}>{isCentral ? 'Central line' : 'Peripheral line'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Urine Output: </Text><Text style={s.pVal}>{(inputs.urineOutput === true || inputs.urineOutput === 'true') ? 'Confirmed' : 'Not confirmed'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>TPN Start: </Text><Text style={s.pVal}>{inputs.startDate ? fmtDate(inputs.startDate) : '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>TPN End: </Text><Text style={s.pVal}>{inputs.endDate ? fmtDate(inputs.endDate) : '—'}</Text></Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            TPN BAG VOLUME — card layout matching original 5-col arrangement
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="TPN Bag Volume" tag="ปริมาตรสารอาหาร" />

        {/* 5-col × 2-row grid: left 2 cols stacked, right 3 cols full-height */}
        <View style={{ flexDirection: 'row', gap: 2, marginBottom: 2, height: 80 }}>

          {/* Left block: TPN Bag + Lipid (top) · Total Volume (bottom) */}
          <View style={{ flex: 2, flexDirection: 'column', gap: 2 }}>

            {/* Top row: TPN Bag | Lipid */}
            <View style={{ flexDirection: 'row', gap: 2, height: 39 }}>
              <View style={[s.card, { flex: 1, justifyContent: 'center' }]}>
                <Text style={s.cardLabel}>TPN Bag Volume</Text>
                <Text style={[s.cardValue, { color: C.teal }]}>{fmtN(results.tpnVolume ?? results.bag2in1Vol)}<Text style={s.cardUnit}> ml/day</Text></Text>
              </View>
              <View style={[s.card, { flex: 1, justifyContent: 'center' }]}>
                <Text style={s.cardLabel}>Lipid Emulsion</Text>
                <Text style={[s.cardValue, { color: C.teal }]}>{fmtN(results.lipidBagVol)}<Text style={s.cardUnit}> ml/day</Text></Text>
              </View>
            </View>

            {/* Bottom: Total Volume */}
            <View style={[s.card, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={s.cardLabel}>Total Volume / Day</Text>
              <Text style={[s.cardValue, { color: C.slate }]}>{fmtN(results.totalVolume)}<Text style={s.cardUnit}> ml / day</Text></Text>
            </View>

          </View>

          {/* Prescribed TPN Rate — full height */}
          <View style={[s.card, { flex: 1, justifyContent: 'center' }]}>
            <Text style={s.cardLabel}>Prescribed TPN Rate</Text>
            <Text style={[s.cardValue, { color: hasManualTPN ? C.slate : C.muted2 }]}>
              {hasManualTPN ? fmtN(manualTPNRate) : '—'}
              {hasManualTPN ? <Text style={s.cardUnit}> ml/hr</Text> : null}
            </Text>
            <Text style={[s.cardSub, { color: C.muted2, marginTop: 2 }]}>
              {'Calc: '}<Text style={{ color: C.teal, fontFamily: 'Kanit', fontWeight: 700 }}>{fmtN(results.calcTPNRate)}</Text>{' ml/hr'}
            </Text>
          </View>

          {/* GIR — full height */}
          <View style={[(girHigh || girLow) ? s.cardAlert : s.card, { flex: 1, justifyContent: 'center' }]}>
            <Text style={s.cardLabel}>GIR (Reverse Calc.)</Text>
            <Text style={[s.cardValue, { color: girHigh || girLow ? C.amber : results.gir !== null ? C.slate : C.muted2 }]}>
              {results.gir !== null ? fmtN(results.gir) : '—'}
              {results.gir !== null ? <Text style={s.cardUnit}> mg/kg/min</Text> : null}
            </Text>
            <Text style={[s.cardSub, { color: girHigh || girLow ? C.amber : C.muted }]}>
              {girHigh ? '⚠ High >12' : girLow ? '⚠ Low <4' : results.gir !== null ? 'target 4–12 ✓' : 'enter TPN rate'}
            </Text>
          </View>

          {/* Lipid Rate — full height */}
          <View style={[fatRateHigh ? s.cardDanger : s.card, { flex: 1, justifyContent: 'center' }]}>
            <Text style={s.cardLabel}>Lipid Rate (Calc.)</Text>
            <Text style={[s.cardValue, { color: fatRateHigh ? C.red : C.slate }]}>
              {fmtN(results.lipidRate)}<Text style={s.cardUnit}> ml/hr</Text>
            </Text>
            <Text style={[s.cardSub, { color: fatRateHigh ? C.red : C.muted }]}>
              {fatRateHigh ? '⚠ Fat rate >0.17 g/kg/hr' : ''}
            </Text>
          </View>

        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CLINICAL ALERT BANNERS — critical tier only, driven by CDS engine
            Source: clinicalDecisionSupport.js → getPdfCriticalAlerts()
            To change alert logic or thresholds: edit clinicalDecisionSupport.js
        ══════════════════════════════════════════════════════════════════ */}
        {pdfAlerts.map(alert => (
          <WarnBanner
            key={alert.key}
            level="red"
            text={`CRITICAL — ${alert.message}${alert.risk ? ` — ${alert.risk}` : ''}`}
          />
        ))}
        {/* ══════════════════════════════════════════════════════════════════
            PREPARATION ORDER TABLE
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="Preparation Order" tag="ตารางส่วนประกอบสารอาหาร" />
        <View style={s.table}>
          {/* Column header */}
          <View style={s.tHead}>
            <Text style={[s.tH,     { width: '33%' }]}>Ingredients</Text>
            <Text style={[s.tH,     { width: '20%', textAlign: 'center' }]}>Target / kg/day</Text>
            <Text style={[s.tH,     { width: '14%', textAlign: 'right'  }]}>Vol. (ml)</Text>
            <Text style={[s.tHLast, { width: '33%' }]}>Remarks</Text>
          </View>

          {/* Part 1 — TPN bag */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 1 — TPN Bag  ·  Mix in one bag (2-in-1)</Text>
          </View>
          {bag2in1Rows.map(renderIngredientRow)}

          {/* Sterile water highlight */}
          <View style={s.tRowHL} wrap={false}>
            <Text style={[s.tCName, { width: '33%', fontWeight: 700, color: '#92400e' }]}>Sterile Water for Injection</Text>
            <View style={{ width: '20%', flexDirection: 'row', borderRightWidth: 0.5, borderRightColor: C.border }}>
              <Text style={[s.tCTarget, { flex: 1, textAlign: 'right', borderRightWidth: 0, color: '#92400e' }]}>q.s.</Text>
              <Text style={[s.tCTarget, { flex: 1.4, textAlign: 'left',  borderRightWidth: 0, color: C.muted2 }]}>to volume</Text>
            </View>
            <Text style={[s.tCVol,  { width: '14%', color: '#92400e' }]}>{fmtPrep(results.sterileWaterMl)}</Text>
            <Text style={[s.tCNote, { width: '33%', color: '#92400e' }]}>Adjust to reach prescribed TPN volume</Text>
          </View>

          {/* Part 1 subtotal — TPN bag total (includes Heparin) */}
          <View style={s.tRowTotal} wrap={false}>
            <Text style={[s.tCName, { width: '33%', fontFamily: 'Kanit', fontWeight: 700, color: C.tealDark }]}>Total Part 1 — TPN Bag</Text>
            <View style={{ width: '20%', flexDirection: 'row', borderRightWidth: 0.5, borderRightColor: C.tealMid }}>
              <Text style={[s.tCTarget, { flex: 1, textAlign: 'right', borderRightWidth: 0, color: C.tealDark }]}>incl.</Text>
              <Text style={[s.tCTarget, { flex: 1.4, textAlign: 'left',  borderRightWidth: 0, color: C.muted }]}>Heparin</Text>
            </View>
            <Text style={[s.tCVol,  { width: '14%', color: C.tealDark }]}>{fmtN(results.tpnVolume)}</Text>
            <Text style={[s.tCNote, { width: '33%', color: C.tealDark, fontWeight: 700 }]}>ml / day</Text>
          </View>

          {/* Part 2 — Lipid */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 2 — Lipid Emulsion  ·  Separate line (Y-site / piggyback)</Text>
          </View>
          {lipidRows.map(renderIngredientRow)}

          {/* Part 2 subtotal — Lipid bag total */}
          <View style={s.tRowTotal} wrap={false}>
            <Text style={[s.tCName, { width: '33%', fontFamily: 'Kanit', fontWeight: 700, color: C.tealDark }]}>Total Part 2 — Lipid Bag</Text>
            <View style={{ width: '20%', flexDirection: 'row', borderRightWidth: 0.5, borderRightColor: C.tealMid }}>
              <Text style={[s.tCTarget, { flex: 1, textAlign: 'right', borderRightWidth: 0, color: C.tealDark }]}>SMOFlipid</Text>
              <Text style={[s.tCTarget, { flex: 1.4, textAlign: 'left',  borderRightWidth: 0, color: C.muted }]}>+ Vitalipid</Text>
            </View>
            <Text style={[s.tCVol,  { width: '14%', color: C.tealDark }]}>{fmtN(results.lipidBagVol)}</Text>
            <Text style={[s.tCNote, { width: '33%', color: C.tealDark, fontWeight: 700 }]}>ml / day</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            ENERGY + CLINICAL SAFETY (side by side columns)
        ══════════════════════════════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', gap: SP.md }}>

          {/* ── Energy distribution ── */}
          <View style={{ flex: 1.1 }}>
            <SectionHeader title="Energy Distribution" tag="สัดส่วนพลังงาน" />

            <View style={s.cardRow}>
              <StatCard label="Total Energy" value={fmtN(results.totalEnergy)} unit="kcal/day" />
              <StatCard label="kcal / kg / day" value={fmtN(results.kcalPerKg)} unit="kcal/kg" />
              <StatCard
                label="NPC : N Ratio"
                value={fmtN(results.npcN)}
                sub={`target ${NPC_N_SAFE_MIN}–${NPC_N_SAFE_MAX}`}
                tone={npcOutOfRange ? 'alert' : 'normal'}
              />
            </View>

            {/* Macronutrient breakdown */}
            <View style={[s.table, { marginBottom: 0 }]}>
              <View style={s.tHead}>
                <Text style={[s.tH,     { width: '40%' }]}>Macronutrient</Text>
                <Text style={[s.tH,     { width: '30%', textAlign: 'right' }]}>kcal/day</Text>
                <Text style={[s.tHLast, { width: '30%', textAlign: 'right' }]}>% Energy</Text>
              </View>
              {[
                { name: 'Carbohydrate (CHO · 3.4 kcal/g)', kcal: results.cho_kcal,     pct: results.choPct },
                { name: 'Protein (AA · 4 kcal/g)',          kcal: results.protein_kcal, pct: results.proteinPct },
                { name: 'Fat (Lipid · 2 kcal/ml)',          kcal: results.fat_kcal,     pct: results.fatPct },
              ].map((row, i) => (
                <View style={i % 2 === 0 ? s.tRow : s.tRowAlt} key={row.name} wrap={false}>
                  <Text style={[s.tCName,   { width: '40%' }]}>{row.name}</Text>
                  <Text style={[s.tCVol,    { width: '30%' }]}>{fmtN(row.kcal)}</Text>
                  <Text style={[s.tCVol,    { width: '30%' }]}>{fmtN(row.pct)} %</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Clinical safety checks ── */}
          <View style={{ flex: 1 }}>
            <SectionHeader title="Clinical Safety Checks" tag="การตรวจสอบความปลอดภัย" />

            <View style={s.cardRow}>
              <StatCard
                label="GIR"
                value={results.gir !== null ? fmtN(results.gir) : '—'}
                unit={results.gir !== null ? 'mg/kg/min' : ''}
                sub={girHigh ? '⚠ High >12' : girLow ? '⚠ Low <4' : results.gir !== null ? 'target 4–12 ✓' : 'enter TPN rate'}
                tone={girHigh || girLow ? 'alert' : 'normal'}
              />
              <StatCard
                label="Osmolarity"
                value={fmtN(results.estOsmolarity)}
                unit="mOsm/L"
                sub={osmHigh && !isCentral ? '⚠ Central only' : osmHigh ? 'Central req. ✓' : 'Within limit ✓'}
                tone={osmHigh && !isCentral ? 'danger' : osmHigh ? 'alert' : 'normal'}
              />
            </View>
            <View style={s.cardRow}>
              <StatCard
                label="Fat Infusion Rate"
                value={fmt(results.fatRateGKgHr, 3)}
                unit="g/kg/hr"
                sub={fatRateHigh ? `⚠ CRITICAL >0.17` : `max ${FAT_RATE_MAX_G_KG_HR} ✓`}
                tone={fatRateHigh ? 'danger' : 'normal'}
              />
              <StatCard
                label="Ca × PO4"
                value={fmtN(results.caxP)}
                unit="mmol²/L²"
                sub={caxPHigh ? `⚠ Precip. risk` : 'Compatible ✓'}
                tone={caxPHigh ? 'warn' : 'normal'}
              />
            </View>

            {/* Electrolyte totals */}
            <View style={[s.table, { marginBottom: 0 }]}>
              <View style={s.tHead}>
                <Text style={[s.tH, { width: '28%' }]}>Electrolyte</Text>
                <Text style={[s.tH, { width: '34%', textAlign: 'right' }]}>Amount</Text>
                <Text style={[s.tHLast, { width: '38%' }]}>Source</Text>
              </View>
              {[
                { name: 'Sodium (Na)',    val: `${fmtN(results.totalNaActual)} mEq/kg/d`, src: '3%NaCl + NaGlyPhos' },
                { name: 'Potassium (K)', val: `${fmtN(results.totalKActual)}  mEq/kg/d`, src: '15%KCl + K2HPO4' },
                { name: 'Phosphate (PO4)',val: `${fmtN(results.totalPO4)}     mmol/kg/d`,src: 'NaGlyPhos + K2HPO4' },
              ].map((row, i) => (
                <View style={i % 2 === 0 ? s.tRow : s.tRowAlt} key={row.name} wrap={false}>
                  <Text style={[s.tCName,   { width: '28%' }]}>{row.name}</Text>
                  <Text style={[s.tCVol,    { width: '34%' }]}>{row.val}</Text>
                  <Text style={[s.tCNote,   { width: '38%' }]}>{row.src}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            NOTE & SPECIAL INSTRUCTIONS & SIGNATURES
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="Note &amp; Special Instructions" tag="หมายเหตุ" />
        <View style={s.notesBox}>
          <View style={s.notesLine} />
          <View style={s.notesLine} />
        </View>

        {/* Signature blocks — Physician + Pharmacist only */}
        <View style={s.sigSection}>
          {[
            { role: 'แพทย์ผู้สั่งยา',      en: 'Prescribing Physician' },
            { role: 'เภสัชกรผู้ตรวจสอบ', en: 'Verifying Pharmacist'  },
          ].map((sig) => (
            <View key={sig.role} style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>{sig.role}</Text>
              <Text style={s.sigEn}>{sig.en}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            DOCUMENT FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <View style={s.footer} fixed>
          <Text style={{ fontStyle: 'italic', flex: 1 }}>
            {'* เอกสารนี้สร้างโดยระบบ PediCalc — แพทย์ผู้สั่งยาต้องลงนามก่อนใช้กับผู้ป่วยจริงทุกครั้ง'}
          </Text>
          <Text
            style={{ fontFamily: 'Kanit', color: C.muted }}
            render={({ pageNumber, totalPages }) => `${docId}  ·  หน้า ${pageNumber} / ${totalPages}`}
            fixed
          />
        </View>

      </Page>
    </Document>
  );
}
