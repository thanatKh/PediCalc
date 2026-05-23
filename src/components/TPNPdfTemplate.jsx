import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer';
import {
  GIR_MAX_SAFE, GIR_MIN_SAFE,
  OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
  CA_PO4_PRODUCT_THRESHOLD,
  CA_PO4_SUM_THRESHOLD,
  NPC_N_TARGET_MIN, NPC_N_TARGET_MAX,
  HOURS_PER_DAY,
  LIPID_RATE_WARN_THRESHOLD,
} from '@/utils/clinicalConstants';
import { fmt } from '@/utils/fmt';

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
// 7   → caption/footnote
// 8.5 → body / table cell
// 9.5 → body emphasis / label
// 11  → sub-heading
// 13  → heading
const T = { caption: 7, body: 8.5, emphasis: 9.5, sub: 11, heading: 13 };

// ── Spacing scale (pt) ───────────────────────────────────────────────────────
const SP = { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 };

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
  logo:        { width: 36, height: 36, objectFit: 'contain' },
  logoBox:     { width: 36, height: 36, borderRadius: 4, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
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
  patientInner:{ flex: 1, padding: '2 4', backgroundColor: C.bg },
  patientTitle:{ fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 700, color: C.muted,
                 textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  patientCell: { width: '33.33%', paddingVertical: 1, fontSize: T.body },
  pLabel:      { color: C.muted, fontWeight: 700 },
  pVal:        { color: C.slate },
  pWarn:       { color: C.red, fontWeight: 700 },
  pGreen:      { color: C.green, fontWeight: 700 },
  pAmber:      { color: C.amber, fontWeight: 700 },
  pTeal:       { color: C.teal, fontWeight: 700, fontFamily: 'Kanit' },

  // ── Rate summary banner ──
  bannerWrap:  {
    flexDirection: 'row', marginBottom: 2,
    borderWidth: 1, borderColor: C.border2, borderRadius: 3, overflow: 'hidden',
  },
  bannerCard:      { flex: 1, padding: '2 4', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.border2, backgroundColor: C.bg },
  bannerCardLast:  { flex: 1, padding: '2 4', alignItems: 'center', backgroundColor: C.bg },
  bannerCardAlert: { flex: 1, padding: '2 4', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.redBdr, backgroundColor: C.redBg },
  bannerLabel: { fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  bannerValue: { fontFamily: 'Kanit', fontSize: T.body, fontWeight: 700 },
  bannerSub:   { fontSize: 6.5, color: C.muted, marginTop: 1 },

  // ── Warning banners ──
  warnRed:    { flexDirection: 'row', backgroundColor: C.redBg,    borderLeftWidth: 3, borderLeftColor: C.red,    borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnAmber:  { flexDirection: 'row', backgroundColor: C.amberBg,  borderLeftWidth: 3, borderLeftColor: '#f59e0b', borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnYellow: { flexDirection: 'row', backgroundColor: C.yellowBg, borderLeftWidth: 3, borderLeftColor: '#eab308', borderRadius: 2, padding: '2 5', marginBottom: 2 },
  warnText:   { fontSize: T.caption, fontWeight: 700, flex: 1 },

  // ── Section header ──
  secHdr: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, marginBottom: 2 },
  secBar: { width: 3, height: 8, backgroundColor: C.teal, borderRadius: 1.5 },
  secTxt: { fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 0.5 },
  secTag: { marginLeft: 'auto', fontSize: 6.5, color: C.muted, fontStyle: 'italic' },

  // ── Table ──
  table:    { borderWidth: 1, borderColor: C.border2, borderRadius: 3, marginBottom: 3, overflow: 'hidden' },
  tHead:    { flexDirection: 'row', backgroundColor: C.teal },
  tSubHdr:  { flexDirection: 'row', backgroundColor: '#f1f5f9', borderTopWidth: 1, borderTopColor: C.border2 },
  tSubTxt:  { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 6.5, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 0.4 },
  tRow:     { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border },
  tRowAlt:  { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.border, backgroundColor: '#fafbfd' },
  tRowHL:   { flexDirection: 'row', borderTopWidth: 1,   borderTopColor: C.border2, backgroundColor: '#fffbeb' },
  tRowHep:  { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: C.amberBdr, backgroundColor: '#fffbeb' },
  tH:       { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 7, fontWeight: 600, color: C.white, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)' },
  tHLast:   { padding: '1.5 5', fontFamily: 'Kanit', fontSize: 7, fontWeight: 600, color: C.white },
  tCName:   { padding: '1.5 5', fontSize: T.caption, color: C.slate,  borderRightWidth: 0.5, borderRightColor: C.border },
  tCTarget: { padding: '1.5 5', fontSize: 6.5,       color: C.muted,  borderRightWidth: 0.5, borderRightColor: C.border, textAlign: 'center' },
  tCVol:    { padding: '1.5 5', fontSize: T.caption, color: C.slate,  borderRightWidth: 0.5, borderRightColor: C.border, textAlign: 'right', fontFamily: 'Kanit', fontWeight: 700 },
  tCNote:   { padding: '1.5 5', fontSize: 6.5,       color: C.muted },

  // ── Stat cards ──
  cardRow:    { flexDirection: 'row', gap: 2, marginBottom: 2 },
  card:       { flex: 1, borderWidth: 1, borderColor: C.border2, borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.bg },
  cardAlert:  { flex: 1, borderWidth: 1, borderColor: C.amberBdr, borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.amberBg },
  cardDanger: { flex: 1, borderWidth: 1, borderColor: C.redBdr,   borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.redBg },
  cardWarn:   { flex: 1, borderWidth: 1, borderColor: C.yellowBdr,borderRadius: 3, padding: '2 3', alignItems: 'center', backgroundColor: C.yellowBg },
  cardLabel:  { fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1, textAlign: 'center' },
  cardValue:  { fontFamily: 'Kanit', fontSize: T.body, fontWeight: 700, color: C.slate },
  cardUnit:   { fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400, color: C.muted },
  cardSub:    { fontSize: 6.5, color: C.muted, textAlign: 'center', marginTop: 1 },

  // ── Notes ──
  notesBox:  { borderWidth: 1, borderColor: C.border2, borderRadius: 3, padding: '3 5', marginTop: 2, backgroundColor: C.white },
  notesTitle:{ fontFamily: 'Kanit', fontSize: 7, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  notesLine: { borderBottomWidth: 0.5, borderBottomColor: C.border2, marginTop: 13 },

  // ── Signatures ──
  sigSection: { flexDirection: 'row', gap: SP.lg, marginTop: 4 },
  sigBlock:   { flex: 1, alignItems: 'center' },
  sigLine:    { borderBottomWidth: 1, borderBottomColor: C.border2, width: '100%', marginBottom: 3, paddingTop: 24 },
  sigRole:    { fontFamily: 'Kanit', fontSize: T.caption, fontWeight: 600, color: C.teal, textAlign: 'center' },
  sigEn:      { fontSize: 6.5, color: C.muted, textAlign: 'center', marginTop: 1 },

  // ── Footer ──
  footer: {
    borderTopWidth: 0.5, borderTopColor: C.border,
    paddingTop: 2, marginTop: 3,
    flexDirection: 'row', justifyContent: 'space-between',
    fontSize: 6, color: C.muted2,
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

const renderIngredientRow = (row, i) => (
  <View style={i % 2 === 0 ? s.tRow : s.tRowAlt} key={i} wrap={false}>
    <Text style={[s.tCName,   { width: '35%' }]}>{thaiBreak(row.name)}</Text>
    <Text style={[s.tCTarget, { width: '21%' }]}>{thaiBreak(row.target)}</Text>
    <Text style={[s.tCVol,    { width: '15%' }, row.color ? { color: row.color } : {}]}>{fmt(row.ml)}</Text>
    <Text style={[s.tCNote,   { width: '29%' }]}>{thaiBreak(row.note)}</Text>
  </View>
);

// ── Main document ────────────────────────────────────────────────────────────

export default function TPNPdfDocument({ inputs, results, logoUrl, hospital }) {
  if (!results) return null;

  const docId      = genDocId();
  const nowDate    = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime    = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const hospNameTh = hospital?.nameTh ?? 'โรงพยาบาลกบินทร์บุรี';
  const hospNameEn = hospital?.nameEn ?? 'Kabinburi Hospital';

  const isCentral = inputs.lineType === 'central';
  const isNewborn = inputs.patientType === 'newborn';

  // Safety flags
  const osmHigh       = (results.estOsmolarity ?? 0) > OSMOLARITY_PERIPHERAL_MAX;
  const girHigh       = !!results.girHigh;
  const girLow        = !!results.girLow;
  const fatRateHigh   = !!results.fatRateHigh;
  const caxPHigh      = !!results.caxPHigh;
  const peripheralRisk= !!results.peripheralRisk;

  // Source inputs
  const na3Pct    = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlycero = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15Pct    = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4    = parseFloat(inputs.k2hpo4Target)    || 0;

  const manualTPNRate      = parseFloat(inputs.manualTPNRate);
  const manualLipidRate    = parseFloat(inputs.manualLipidRate);
  const hasManualTPN       = !isNaN(manualTPNRate)   && inputs.manualTPNRate   !== '' && manualTPNRate   > 0;
  const hasManualLipid     = !isNaN(manualLipidRate) && inputs.manualLipidRate !== '' && manualLipidRate > 0;
  const lipidRateDeviation = hasManualLipid ? Math.abs(manualLipidRate - (results.lipidRate ?? 0)) : 0;
  const lipidRateWarn      = hasManualLipid && lipidRateDeviation > LIPID_RATE_WARN_THRESHOLD;

  // NPC:N tone
  const npcOutOfRange = (results.npcN ?? 0) < NPC_N_TARGET_MIN || (results.npcN ?? 0) > NPC_N_TARGET_MAX;

  // Ingredients
  const bag2in1Rows = [
    { name: `Dextrose ${inputs.dextrosePct || 10}% (from 50% Glucose)`,
      target: `GIR ${fmt(results.gir, 1)} mg/kg/min`,   ml: results.dextroseMl,    note: '0.5 g/ml — dilute with sterile water' },
    { name: '10% Aminoven Infant',
      target: `${inputs.proteinTarget} g/kg/day`,        ml: results.aminovenMl,    note: '2.5–3.5 g/kg/day (usual range)' },
    { name: '3% NaCl',
      target: `Na ${fmt(na3Pct, 2)} mEq/kg`,            ml: results.na3PctMl,      note: '0.5 mEq Na/ml' },
    { name: 'Na Glycerophosphate',
      target: `Na ${fmt(naGlycero, 2)} mEq/kg`,         ml: results.naGlyceroml,   note: 'Na + PO4 · 2 mEq Na/ml' },
    { name: '15% KCl',
      target: `K ${fmt(k15Pct, 2)} mEq/kg`,             ml: results.k15PctMl,      note: '2 mEq K/ml' },
    { name: '8.71% K2HPO4',
      target: `K ${fmt(k2hpo4, 2)} mEq/kg`,             ml: results.k2hpo4Ml,      note: 'K + PO4 · 1 mEq K/0.5 mmol PO4/ml' },
    { name: '10% Calcium Gluconate',
      target: `${inputs.caTarget} mmol/kg`,              ml: results.caGluconateMl, note: '0.25 mmol/ml' },
    { name: '50% MgSO4',
      target: `${inputs.mgTarget} mEq/kg`,               ml: results.mgso4Ml,       note: '4 mEq/ml' },
    { name: 'Soluvit-N',
      target: '1 ml/kg/day',                             ml: results.soluvitMl,     note: 'Water-soluble vitamins · max 10 ml/day' },
    { name: 'Pediatrace',
      target: '1 ml/kg/day',                             ml: results.pediatraceMl,  note: 'Trace elements · max 10 ml/day' },
  ];

  const lipidRows = [
    { name: '20% SMOFlipid',
      target: `${inputs.lipidTarget} g/kg`,  ml: results.lipidMl,     note: 'MCT/Soy/Olive/Fish oil emulsion' },
    { name: 'Vitalipid N Infant',
      target: '4 ml/kg/day',                 ml: results.vitalipidMl, note: 'Fat-soluble vitamins · add to lipid bag · max 10 ml/day' },
  ];

  const hn      = (inputs.hn || 'NONAME').replace(/[^a-zA-Z0-9]/g, '');
  const bwStr   = (inputs.bw || '0').replace('.', '-');
  const today   = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`;
  const pdfTitle = `TPN_${hn}_${bwStr}kg_${dateStr}`;

  return (
    <Document title={pdfTitle} author={`PediCalc — ${hospNameEn}`} subject="Neonatal/Pediatric TPN Order Form">
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
              <Text style={s.hospName} numberOfLines={1} style={[s.hospName, { fontSize: T.body, fontWeight: 600, color: C.slate2, marginTop: -1, marginBottom: 2 }]}>{hospNameEn}</Text>
              <Text style={s.formTitle}>
                {isNewborn ? 'NEONATAL' : 'PEDIATRIC'} PARENTERAL NUTRITION ORDER FORM
              </Text>
              <Text style={s.formSub}>
                Intravenous Nutrition Order · {isNewborn ? 'Neonatal Unit' : 'Pediatric Unit'}
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
        <View style={s.patientBox}>
          <View style={s.patientBar} />
          <View style={s.patientInner}>
            <Text style={s.patientTitle}>ข้อมูลผู้ป่วย · Patient Information</Text>
            <View style={s.patientGrid}>
              <Text style={s.patientCell}><Text style={s.pLabel}>Name: </Text><Text style={s.pVal}>{inputs.name || 'N/A'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>HN: </Text>{inputs.hn ? <Text style={s.pVal}>{inputs.hn}</Text> : <Text style={s.pWarn}>⚠ Not specified</Text>}</Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Ward: </Text><Text style={s.pVal}>{inputs.ward || '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Age: </Text><Text style={s.pVal}>{inputs.ageMonth || '0'} mo {inputs.ageDay || '0'} d</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Weight: </Text><Text style={s.pTeal}>{inputs.bw || '—'} kg</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Height: </Text><Text style={s.pVal}>{inputs.height ? `${inputs.height} cm` : '—'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Mode: </Text><Text style={s.pTeal}>{isNewborn ? 'Newborn (+25 ml reserve)' : 'Pediatric'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>Route: </Text><Text style={isCentral ? s.pGreen : s.pAmber}>{isCentral ? 'Central line' : 'Peripheral line'}</Text></Text>
              <Text style={s.patientCell}><Text style={s.pLabel}>TPN Start: </Text><Text style={s.pVal}>{inputs.startDate ? fmtDate(inputs.startDate) : '—'}</Text></Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            INFUSION RATE SUMMARY BANNER
        ══════════════════════════════════════════════════════════════════ */}
        <View style={s.bannerWrap}>
          {/* TPN Volume */}
          <View style={s.bannerCard}>
            <Text style={s.bannerLabel}>TPN Bag Volume</Text>
            <Text style={[s.bannerValue, { color: C.teal }]}>{fmt(results.tpnVolume ?? results.bag2in1Vol, 1)}</Text>
            <Text style={s.bannerSub}>ml / day</Text>
          </View>
          {/* Total Volume */}
          <View style={s.bannerCard}>
            <Text style={s.bannerLabel}>Total Volume / day</Text>
            <Text style={[s.bannerValue, { color: C.slate }]}>{fmt(results.totalVolume, 1)}</Text>
            <Text style={s.bannerSub}>ml / day</Text>
          </View>
          {/* TPN Rate */}
          <View style={hasManualTPN ? s.bannerCard : s.bannerCard}>
            <Text style={s.bannerLabel}>Prescribed TPN Rate</Text>
            <Text style={[s.bannerValue, { color: hasManualTPN ? C.slate : C.muted }]}>
              {hasManualTPN ? fmt(manualTPNRate, 1) : '—'}
            </Text>
            <Text style={s.bannerSub}>{hasManualTPN ? 'ml / hr' : 'not prescribed'}</Text>
          </View>
          {/* GIR */}
          <View style={(girHigh || girLow) ? s.bannerCardAlert : s.bannerCard}>
            <Text style={s.bannerLabel}>GIR (Reverse Calc.)</Text>
            <Text style={[s.bannerValue, { color: girHigh || girLow ? C.red : results.gir !== null ? C.slate : C.muted }]}>
              {results.gir !== null ? fmt(results.gir, 2) : '—'}
            </Text>
            <Text style={[s.bannerSub, { color: girHigh ? C.red : girLow ? C.amber : C.muted }]}>
              {results.gir !== null ? 'mg/kg/min' : 'enter TPN rate'}
            </Text>
          </View>
          {/* Lipid Rate — shows prescribed vs calculated when both present */}
          <View style={fatRateHigh || lipidRateWarn
            ? { ...s.bannerCardLast, backgroundColor: fatRateHigh ? C.redBg : C.amberBg }
            : s.bannerCardLast}>
            <Text style={s.bannerLabel}>Lipid Rate (Calc.)</Text>
            <Text style={[s.bannerValue, { color: fatRateHigh ? C.red : C.slate }]}>
              {fmt(results.lipidRate, 1)}
            </Text>
            <Text style={[s.bannerSub, { color: fatRateHigh ? C.red : C.muted }]}>ml / hr</Text>
            {hasManualLipid && (
              <Text style={[s.bannerSub, { color: lipidRateWarn ? C.amber : C.green, fontWeight: 700, marginTop: 1 }]}>
                {lipidRateWarn ? `⚠ สั่ง: ${fmt(manualLipidRate, 1)} ml/hr (ต่างกัน ${fmt(lipidRateDeviation, 1)})` : `✓ สั่ง: ${fmt(manualLipidRate, 1)} ml/hr`}
              </Text>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CLINICAL ALERT BANNERS
        ══════════════════════════════════════════════════════════════════ */}
        {fatRateHigh && (
          <WarnBanner level="red"
            text={`CRITICAL ALERT — Fat Infusion Rate: ${fmt(results.fatRateGKgHr, 3)} g/kg/hr exceeds safe limit of 0.17 g/kg/hr — Risk of Fat Overload Syndrome — Reduce Lipid target immediately`} />
        )}
        {(girHigh || girLow) && (
          <WarnBanner level="amber"
            text={`GIR ${girHigh ? 'ABOVE' : 'BELOW'} TARGET — ${fmt(results.gir, 2)} mg/kg/min (target range: ${GIR_MIN_SAFE}–${GIR_MAX_SAFE} mg/kg/min) — Adjust prescribed TPN Rate or Dextrose concentration`} />
        )}
        {peripheralRisk && (
          <WarnBanner level="amber"
            text={`PERIPHERAL LINE RISK — Dextrose ${inputs.dextrosePct}% · Estimated Osmolarity ${fmt(results.estOsmolarity, 0)} mOsm/L exceeds peripheral limit (${OSMOLARITY_PERIPHERAL_MAX} mOsm/L) — Consider Central venous access`} />
        )}
        {caxPHigh && (
          <WarnBanner level="yellow"
            text={`PRECIPITATION RISK — Ca×PO4 = ${fmt(results.caxP, 1)} mmol²/L² (threshold: >${CA_PO4_PRODUCT_THRESHOLD}) or Ca+PO4 total >${CA_PO4_SUM_THRESHOLD} mmol — Reduce Calcium or Phosphate, or administer via separate line`} />
        )}
        {lipidRateWarn && (
          <WarnBanner level="amber"
            text={`LIPID RATE MISMATCH — Prescribed: ${fmt(manualLipidRate, 1)} ml/hr · Calculated: ${fmt(results.lipidRate, 1)} ml/hr · Deviation: ${fmt(lipidRateDeviation, 1)} ml/hr — Please verify prescribed lipid rate before dispensing`} />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PREPARATION ORDER TABLE
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="Preparation Order" tag="ตารางส่วนประกอบสารอาหาร" />
        <View style={s.table}>
          {/* Column header */}
          <View style={s.tHead}>
            <Text style={[s.tH,     { width: '35%' }]}>Ingredients</Text>
            <Text style={[s.tH,     { width: '21%', textAlign: 'center' }]}>Target / kg/day</Text>
            <Text style={[s.tH,     { width: '15%', textAlign: 'right'  }]}>Vol. (ml)</Text>
            <Text style={[s.tHLast, { width: '29%' }]}>Remarks</Text>
          </View>

          {/* Part 1 — TPN bag */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 1 — TPN Bag  ·  Mix in one bag (2-in-1)</Text>
          </View>
          {bag2in1Rows.map(renderIngredientRow)}

          {/* Sterile water highlight */}
          <View style={s.tRowHL} wrap={false}>
            <Text style={[s.tCName,   { width: '35%', fontWeight: 700, color: '#92400e' }]}>Sterile Water for Injection</Text>
            <Text style={[s.tCTarget, { width: '21%', color: '#92400e' }]}>q.s. to volume</Text>
            <Text style={[s.tCVol,    { width: '15%', color: '#92400e', fontSize: T.sub }]}>{fmt(results.sterileWaterMl)}</Text>
            <Text style={[s.tCNote,   { width: '29%', color: '#92400e' }]}>Adjust to reach prescribed TPN volume</Text>
          </View>

          {/* Heparin */}
          <View style={s.tRowHep} wrap={false}>
            <Text style={[s.tCName,   { width: '35%', fontWeight: 700, color: '#92400e' }]}>Heparin (Sodium)</Text>
            <Text style={[s.tCTarget, { width: '21%', color: '#92400e' }]}>{fmt(results.heparinUnitPerMl, 1)} unit/ml</Text>
            <Text style={[s.tCVol,    { width: '15%', color: '#92400e' }]}>{fmt(results.heparinMl, 2)}</Text>
            <Text style={[s.tCNote,   { width: '29%', color: '#92400e' }]}>{fmt(results.heparinUnits, 0)} IU total · stock 100 IU/ml</Text>
          </View>

          {/* Part 2 — Lipid */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>Part 2 — Lipid Emulsion  ·  Separate line (Y-site / piggyback)</Text>
          </View>
          {lipidRows.map(renderIngredientRow)}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            ENERGY + CLINICAL SAFETY (side by side columns)
        ══════════════════════════════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', gap: SP.md }}>

          {/* ── Energy distribution ── */}
          <View style={{ flex: 1.1 }}>
            <SectionHeader title="Energy Distribution" tag="สัดส่วนพลังงาน" />

            <View style={s.cardRow}>
              <StatCard label="Total Energy" value={fmt(results.totalEnergy, 1)} unit="kcal/day" />
              <StatCard label="kcal / kg / day" value={fmt(results.kcalPerKg, 1)} unit="kcal/kg" />
              <StatCard
                label="NPC : N Ratio"
                value={fmt(results.npcN, 0)}
                sub={`target ${NPC_N_TARGET_MIN}–${NPC_N_TARGET_MAX}`}
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
                  <Text style={[s.tCVol,    { width: '30%' }]}>{fmt(row.kcal, 1)}</Text>
                  <Text style={[s.tCVol,    { width: '30%' }]}>{fmt(row.pct, 1)} %</Text>
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
                value={results.gir !== null ? fmt(results.gir, 2) : '—'}
                unit={results.gir !== null ? 'mg/kg/min' : ''}
                sub={girHigh ? '⚠ High >12' : girLow ? '⚠ Low <4' : results.gir !== null ? 'target 4–12 ✓' : 'enter TPN rate'}
                tone={girHigh || girLow ? 'alert' : 'normal'}
              />
              <StatCard
                label="Osmolarity"
                value={fmt(results.estOsmolarity, 0)}
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
                value={fmt(results.caxP, 1)}
                unit="mmol²/L²"
                sub={caxPHigh ? `⚠ Precip. risk` : 'Compatible ✓'}
                tone={caxPHigh ? 'warn' : 'normal'}
              />
            </View>

            {/* Electrolyte totals */}
            <View style={[s.table, { marginBottom: 0 }]}>
              <View style={s.tHead}>
                <Text style={[s.tH, { width: '40%' }]}>Electrolyte</Text>
                <Text style={[s.tH, { width: '35%', textAlign: 'right' }]}>Amount</Text>
                <Text style={[s.tHLast, { width: '25%' }]}>Source</Text>
              </View>
              {[
                { name: 'Sodium (Na)',    val: `${fmt(results.totalNaActual, 2)} mEq/kg/d`, src: '3%NaCl + NaGlyPhos' },
                { name: 'Potassium (K)', val: `${fmt(results.totalKActual,  2)} mEq/kg/d`, src: '15%KCl + K2HPO4' },
                { name: 'Phosphate (PO4)',val: `${fmt(results.totalPO4,     2)} mmol/kg/d`,src: 'NaGlyPhos + K2HPO4' },
              ].map((row, i) => (
                <View style={i % 2 === 0 ? s.tRow : s.tRowAlt} key={row.name} wrap={false}>
                  <Text style={[s.tCName,   { width: '40%' }]}>{row.name}</Text>
                  <Text style={[s.tCVol,    { width: '35%' }]}>{row.val}</Text>
                  <Text style={[s.tCNote,   { width: '25%' }]}>{row.src}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SPECIAL INSTRUCTIONS & SIGNATURES
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader title="Special Instructions" tag="คำสั่งพิเศษ / หมายเหตุ" />
        <View style={s.notesBox}>
          <Text style={s.notesTitle}>หมายเหตุ / คำสั่งพิเศษ / Notes &amp; Special Instructions</Text>
          <View style={s.notesLine} />
          <View style={s.notesLine} />
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
            {thaiBreak(`* เอกสารนี้สร้างโดยระบบ PediCalc — ${hospNameTh} — กรุณาตรวจสอบโดยผู้มีสิทธิ์ก่อนใช้งานทุกครั้ง`)}
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
