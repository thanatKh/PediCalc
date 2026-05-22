import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
    { src: '/fonts/Sarabun-Italic.ttf',   fontStyle: 'italic' },
    { src: '/fonts/Sarabun-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Sarabun-Bold.ttf',     fontWeight: 700 },
  ],
});
Font.register({
  family: 'Kanit',
  fonts: [
    { src: '/fonts/Kanit-Regular.ttf' },
    { src: '/fonts/Kanit-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Kanit-Bold.ttf',     fontWeight: 700 },
  ],
});

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
  page: { padding: '18 22 14 22', fontFamily: 'Sarabun', fontSize: 8.5, color: SLATE, backgroundColor: '#fff' },

  // ── Header ──
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 5, marginBottom: 5 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo:      { width: 40, height: 40, objectFit: 'contain' },
  logoFallback: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  hTitle:    { fontFamily: 'Kanit', fontSize: 12, fontWeight: 700, color: TEAL },
  hForm:     { fontFamily: 'Kanit', fontSize: 10, fontWeight: 600, color: SLATE, marginTop: 1 },
  hSub:      { fontSize: 8, color: MUTED, marginTop: 1 },
  hRight:    { textAlign: 'right', fontSize: 8, color: '#475569' },
  hMeta:     { marginBottom: 1.5 },
  hDocId:    { fontFamily: 'Kanit', fontWeight: 700, color: TEAL },

  // ── Patient box: two-tone left-bar card ──
  pBox: { flexDirection: 'row', borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  pBar: { width: 4, backgroundColor: TEAL },
  pInner: { flex: 1, padding: '5 6', backgroundColor: '#f8fafc' },
  pGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pCell: { width: '33.33%', fontSize: 8.5, paddingVertical: 1.2 },
  pLabel: { fontWeight: 700, color: '#475569' },
  pWarn:  { color: '#e11d48', fontWeight: 700 },
  pGreen: { color: '#166534', fontWeight: 700 },
  pAmber: { color: '#854d0e', fontWeight: 700 },

  // ── Rate banner: horizontal colored strip ──
  rateBanner: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  rateCard: { flex: 1, borderRadius: 3, padding: '4 6', alignItems: 'center' },
  rateLabel: { fontSize: 6.5, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.3 },
  rateValue: { fontFamily: 'Kanit', fontSize: 10, fontWeight: 700, marginTop: 1 },

  // ── Section header: left accent bar ──
  secHdr: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 3, gap: 5 },
  secBar: { width: 3, height: 11, backgroundColor: TEAL, borderRadius: 2 },
  secTxt: { fontFamily: 'Kanit', fontSize: 9, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.4 },
  secTag: { marginLeft: 'auto', fontSize: 7, color: MUTED, fontStyle: 'italic' },

  // ── Table ──
  table:   { borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 2, marginBottom: 3, overflow: 'hidden' },
  tHead:   { flexDirection: 'row', backgroundColor: TEAL },
  tRow:    { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  tRowAlt: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER, backgroundColor: '#f8fafc' },
  tRowHL:  { flexDirection: 'row', borderTopWidth: 1,   borderTopColor: '#94a3b8', backgroundColor: '#fffbeb' },
  tH:      { padding: '3.5 4', fontFamily: 'Kanit', fontSize: 8, fontWeight: 600, color: '#fff', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.25)' },
  tHLast:  { padding: '3.5 4', fontFamily: 'Kanit', fontSize: 8, fontWeight: 600, color: '#fff', textAlign: 'center' },
  tC:      { padding: '3 4', fontSize: 8.5, color: SLATE, borderRightWidth: 0.5, borderRightColor: BORDER },
  tCC:     { padding: '3 4', fontSize: 8.5, color: MUTED,  textAlign: 'center', borderRightWidth: 0.5, borderRightColor: BORDER },
  tCN:     { padding: '3 4', fontSize: 9,   color: SLATE,  textAlign: 'right',  fontWeight: 700, borderRightWidth: 0.5, borderRightColor: BORDER },
  tCL:     { padding: '3 4', fontSize: 8,   color: MUTED },

  // ── Combined ingredient table ──
  tSubHdr: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderTopWidth: 0.5, borderTopColor: BORDER },
  tSubTxt: { padding: '2.5 4', fontFamily: 'Kanit', fontSize: 7.5, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.3 },

  // ── Energy + Safety: compact horizontal cards ──
  panelRow: { flexDirection: 'row', gap: 3, marginBottom: 3 },
  panelCard: { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, padding: '3.5 4', alignItems: 'center', backgroundColor: '#f8fafc' },
  panelAlert: { flex: 1, borderWidth: 1, borderColor: '#f59e0b', borderRadius: 3, padding: '3.5 4', alignItems: 'center', backgroundColor: '#fffbeb' },
  panelDanger:{ flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 3, padding: '3.5 4', alignItems: 'center', backgroundColor: '#fff1f2' },
  panelLabel: { fontSize: 6.5, color: MUTED, textTransform: 'uppercase' },
  panelValue: { fontFamily: 'Kanit', fontSize: 10, fontWeight: 700, color: SLATE, marginTop: 1 },
  panelSub:   { fontSize: 7, color: MUTED },

  // ── Warning banner ──
  warnBanner: { backgroundColor: '#fee2e2', borderLeftWidth: 3, borderLeftColor: '#ef4444', borderRadius: 2, padding: '4 6', marginBottom: 3, fontSize: 8, color: '#991b1b', fontWeight: 700 },

  // ── Notes ──
  notesBox: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 3, height: 18, padding: '3 5', fontSize: 8, color: '#94a3b8', fontStyle: 'italic' },

  // ── Signatures ──
  sigRow:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigLine:  { borderBottomWidth: 0.5, borderBottomColor: '#94a3b8', width: '100%', height: 36, marginBottom: 3 },
  sigRole:  { fontFamily: 'Kanit', fontSize: 9, fontWeight: 600, color: TEAL },
  sigEn:    { fontSize: 8, color: MUTED },

  // ── Doc footer ──
  docFooter: { borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 3, marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
});

const SectionHeader = ({ title, tag }) => (
  <View style={s.secHdr}>
    <View style={s.secBar} />
    <Text style={s.secTxt}>{title}</Text>
    {tag && <Text style={s.secTag}>{tag}</Text>}
  </View>
);

const renderRow = (row, i, last = false) => {
  const rowStyle = last ? s.tRowHL : i % 2 === 1 ? s.tRowAlt : s.tRow;
  return (
    <View style={rowStyle} key={i}>
      <Text style={[s.tC, { width: '38%' }]}>{row.name}</Text>
      <Text style={[s.tCC, { width: '22%' }]}>{row.target}</Text>
      <Text style={[s.tCN, { width: '16%', color: row.color || SLATE }]}>{fmt(row.ml)}</Text>
      <Text style={[s.tCL, { width: '24%' }]}>{row.note}</Text>
    </View>
  );
};

export default function TPNPdfDocument({ inputs, results, logoUrl }) {
  if (!results) return null;

  const docId   = genDocId();
  const nowDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const isCentral   = inputs.lineType === 'central';
  const isNewborn   = inputs.patientType === 'newborn';
  const osmHigh     = (results.estOsmolarity ?? 0) > 900;
  const girHigh     = (results.gir ?? 0) > 12;
  const girLow      = (results.gir ?? 0) < 4;
  const bwNum       = parseFloat(inputs.bw) || 1;
  const fatRateHigh = results.lipidMl > 0 && (results.lipidMl / 24) > 0.17 * bwNum;
  const caxPHigh    = (results.caxP ?? 0) > 45;

  const bag2in1Rows = [
    { name: `Dextrose ${inputs.dextrosePct || 10}% (จาก 50% Glucose)`, target: `GIR ${fmt(results.gir,1)} mg/kg/min`, ml: results.dextroseMl, note: '0.5 g/ml → เจือจางด้วยน้ำกลั่น', color: '#1d4ed8' },
    { name: '10% Aminoven Infant',    target: `${inputs.proteinTarget} g/kg`,       ml: results.aminovenMl,    note: '2.5–3.5 g/kg/day' },
    { name: '3% NaCl',                target: `${inputs.na3PctTarget} mEq/kg`,      ml: results.na3PctMl,      note: '0.5 mEq/ml' },
    { name: 'Sodium Glycerophosphate',target: `${inputs.naGlyceroTarget} mEq/kg`,   ml: results.naGlyceroml,   note: 'Na + PO4' },
    { name: '15% KCl',                target: `${inputs.k15PctTarget} mEq/kg`,      ml: results.k15PctMl,      note: '2 mEq/ml' },
    { name: '8.71% K2HPO4',           target: `${inputs.k2hpo4Target} mEq/kg`,      ml: results.k2hpo4Ml,      note: '1 mEq/ml' },
    { name: '10% Calcium Gluconate',  target: `${inputs.caTarget} mmol/kg`,         ml: results.caGluconateMl, note: '0.25 mmol/ml' },
    { name: '50% MgSO4',              target: `${inputs.mgTarget} mEq/kg`,          ml: results.mgso4Ml,       note: '4 mEq/ml' },
    { name: 'Soluvit-N',              target: `${inputs.soluvitTarget} ml/kg`,      ml: results.soluvitMl,     note: 'วิตามินละลายน้ำ' },
    { name: 'Pediatrace',             target: `${inputs.pediatraceTarget} ml/kg`,   ml: results.pediatraceMl,  note: 'ธาตุอาหารรอง' },
  ];

  const lipidRows = [
    { name: '20% SMOFlipid',      target: `${inputs.lipidTarget} g/kg`,      ml: results.lipidMl,     note: 'MCT/Soy/Olive/Fish oil', color: '#047857' },
    { name: 'Vitalipid N Infant', target: `${inputs.vitalipidTarget} ml/kg`, ml: results.vitalipidMl, note: 'เติมใน lipid bag' },
  ];

  const tableHeader = (
    <View style={s.tHead}>
      <Text style={[s.tH,     { width: '38%' }]}>ส่วนประกอบ (Ingredients)</Text>
      <Text style={[s.tH,     { width: '22%' }]}>เป้าหมาย / kg/day</Text>
      <Text style={[s.tH,     { width: '16%' }]}>ปริมาตร (ml)</Text>
      <Text style={[s.tHLast, { width: '24%' }]}>หมายเหตุ</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.headerRow}>
          <View style={s.logoRow}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logo} />
              : <View style={s.logoFallback}><Text style={{ fontSize: 7, color: MUTED }}>LOGO</Text></View>
            }
            <View>
              <Text style={s.hTitle}>โรงพยาบาลกบินทร์บุรี | Kabinburi Hospital</Text>
              <Text style={s.hForm}>{isNewborn ? 'NEONATAL' : 'PEDIATRIC'} PARENTERAL NUTRITION ORDER FORM</Text>
              <Text style={s.hSub}>{isNewborn ? 'คำสั่งจ่ายสารอาหารทางหลอดเลือดดำ · ทารกแรกเกิด' : 'คำสั่งจ่ายสารอาหารทางหลอดเลือดดำ · กุมารเวชกรรม'}</Text>
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
              <Text style={s.pCell}><Text style={s.pLabel}>ชื่อ-สกุล: </Text>{inputs.name || 'ไม่ระบุ'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>HN: </Text>{inputs.hn ? inputs.hn : <Text style={s.pWarn}>⚠ ยังไม่ระบุ</Text>}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Ward: </Text>{inputs.ward || '—'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>อายุ: </Text>{inputs.ageMonth || '0'} เดือน {inputs.ageDay || '0'} วัน</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>น้ำหนัก: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700 }}>{inputs.bw || '—'} kg</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>ส่วนสูง: </Text>{inputs.height ? `${inputs.height} cm` : '—'}</Text>
              <Text style={s.pCell}><Text style={s.pLabel}>โหมด: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700, color: TEAL }}>{isNewborn ? 'Newborn (+25 ml)' : 'Pediatric'}</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>Route: </Text><Text style={isCentral ? s.pGreen : s.pAmber}>{isCentral ? 'Central line' : 'Peripheral line'}</Text></Text>
              <Text style={s.pCell}><Text style={s.pLabel}>เริ่มให้ TPN: </Text>{inputs.startDate ? fmtDate(inputs.startDate) : <Text style={{ color: '#f59e0b' }}>ยังไม่ระบุ</Text>}</Text>
            </View>
          </View>
        </View>

        {/* ── RATE BANNER ── */}
        <View style={s.rateBanner}>
          {[
            { label: 'Total Volume / day', val: `${fmt(results.totalVolume, 1)} ml`,       bg: TEAL_L,   color: TEAL },
            { label: 'Volume Target',       val: `${inputs.volumeTarget} ml/kg/day`,         bg: '#f8fafc', color: SLATE },
            { label: '2-in-1 Bag Rate',     val: `${fmt(results.infusionRate, 1)} ml/hr`,   bg: '#eff6ff', color: '#1d4ed8' },
            { label: 'Lipid Rate (แยกสาย)', val: `${fmt(results.lipidMl / 24, 1)} ml/hr`, bg: '#f0fdf4', color: '#047857' },
            { label: 'DSF',                 val: fmt(results.dsf, 3),                        bg: '#f8fafc', color: MUTED },
          ].map((item) => (
            <View key={item.label} style={[s.rateCard, { backgroundColor: item.bg, borderWidth: 0.5, borderColor: BORDER }]}>
              <Text style={s.rateLabel}>{item.label}</Text>
              <Text style={[s.rateValue, { color: item.color }]}>{item.val}</Text>
            </View>
          ))}
        </View>

        {/* ── COMBINED INGREDIENTS TABLE ── */}
        <SectionHeader title="ใบสั่งจ่าย · Preparation Order" />
        <View style={s.table}>
          {tableHeader}
          {/* Sub-header: 2-in-1 bag */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>ส่วนที่ 1 · 2-in-1 Bag (เตรียมรวมในถุงเดียว)</Text>
          </View>
          {bag2in1Rows.map((row, i) => renderRow(row, i))}
          {/* Sterile water totals row */}
          <View style={s.tRowHL}>
            <Text style={[s.tC,  { width: '38%', fontWeight: 700, color: '#92400e' }]}>Sterile Water for Injection</Text>
            <Text style={[s.tCC, { width: '22%', color: '#92400e' }]}>เติมให้ครบปริมาตร</Text>
            <Text style={[s.tCN, { width: '16%', color: '#92400e', fontSize: 10 }]}>{fmt(results.sterileWaterMl)}</Text>
            <Text style={[s.tCL, { width: '24%', color: '#92400e' }]}>ปริมาตรน้ำกลั่นเติมเต็ม</Text>
          </View>
          {/* Sub-header: lipid */}
          <View style={s.tSubHdr}>
            <Text style={s.tSubTxt}>ส่วนที่ 2 · Lipid Emulsion (แยกสาย — Y-site / piggyback)</Text>
          </View>
          {lipidRows.map((row, i) => renderRow(row, i))}
        </View>

        {/* ── ENERGY + SAFETY (side by side) ── */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Energy */}
          <View style={{ flex: 1 }}>
            <SectionHeader title="Energy Distribution" />
            <View style={s.panelRow}>
              {[
                { label: 'Total Energy', val: fmt(results.totalEnergy, 1), sub: 'kcal/day' },
                { label: 'kcal/kg/day',  val: fmt(results.kcalPerKg, 1),   sub: 'kcal/kg' },
                { label: 'CHO',          val: `${fmt(results.choPct, 1)}%`, sub: `${fmt(results.cho_kcal,1)} kcal` },
              ].map((item) => (
                <View style={s.panelCard} key={item.label}>
                  <Text style={s.panelLabel}>{item.label}</Text>
                  <Text style={[s.panelValue, { color: TEAL }]}>{item.val}</Text>
                  <Text style={s.panelSub}>{item.sub}</Text>
                </View>
              ))}
            </View>
            <View style={s.panelRow}>
              {[
                { label: 'Protein', val: `${fmt(results.proteinPct,1)}%`, sub: `${fmt(results.protein_kcal,1)} kcal` },
                { label: 'Fat',     val: `${fmt(results.fatPct, 1)}%`,    sub: `${fmt(results.fat_kcal,1)} kcal` },
                { label: 'NPC:N',   val: fmt(results.npcN, 0),            sub: 'target 150–200' },
              ].map((item) => (
                <View style={s.panelCard} key={item.label}>
                  <Text style={s.panelLabel}>{item.label}</Text>
                  <Text style={[s.panelValue, { color: TEAL }]}>{item.val}</Text>
                  <Text style={s.panelSub}>{item.sub}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Safety */}
          <View style={{ flex: 1 }}>
            <SectionHeader title="Clinical Safety Checks" />
            <View style={s.panelRow}>
              <View style={girHigh || girLow ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>GIR</Text>
                <Text style={[s.panelValue, { color: girHigh || girLow ? '#b45309' : SLATE }]}>{fmt(results.gir, 1)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> mg/kg/min</Text></Text>
                <Text style={[s.panelSub, { color: girHigh || girLow ? '#b45309' : MUTED }]}>{girHigh ? '⚠ สูงเกิน' : girLow ? '⚠ ต่ำเกิน' : 'target 4–12 ✓'}</Text>
              </View>
              <View style={osmHigh && !isCentral ? s.panelDanger : osmHigh ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>Osmolarity</Text>
                <Text style={[s.panelValue, { color: osmHigh ? '#b91c1c' : SLATE }]}>{fmt(results.estOsmolarity, 0)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> mOsm/L</Text></Text>
                <Text style={[s.panelSub, { color: osmHigh ? '#b91c1c' : MUTED }]}>{osmHigh && !isCentral ? '⚠ Central only' : osmHigh ? 'Central required' : 'peripheral OK ✓'}</Text>
              </View>
            </View>
            <View style={s.panelRow}>
              <View style={fatRateHigh ? s.panelAlert : s.panelCard}>
                <Text style={s.panelLabel}>Fat Rate</Text>
                <Text style={[s.panelValue, { color: fatRateHigh ? '#b45309' : SLATE }]}>{fmt(results.lipidMl / 24, 2)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> ml/hr</Text></Text>
                <Text style={[s.panelSub, { color: fatRateHigh ? '#b45309' : MUTED }]}>{fatRateHigh ? '⚠ max 0.17 g/kg/hr' : '✓ max 0.17 g/kg/hr'}</Text>
              </View>
              <View style={caxPHigh ? s.panelDanger : s.panelCard}>
                <Text style={s.panelLabel}>Ca + PO4</Text>
                <Text style={[s.panelValue, { color: caxPHigh ? '#b91c1c' : SLATE }]}>{fmt(results.caxP, 1)}<Text style={{ fontSize: 6.5, fontFamily: 'Sarabun', fontWeight: 400 }}> mEq</Text></Text>
                <Text style={[s.panelSub, { color: caxPHigh ? '#b91c1c' : MUTED }]}>{caxPHigh ? '⚠ ตกตะกอน >45' : 'เข้ากันได้ปกติ ✓'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── OSMOLARITY WARNING BANNER ── */}
        {osmHigh && !isCentral && (
          <Text style={s.warnBanner}>⚠ Osmolarity {fmt(results.estOsmolarity, 0)} mOsm/L เกินขีดจำกัด Peripheral line — ต้องให้ทาง Central line เท่านั้น</Text>
        )}

        {/* ── NOTES ── */}
        <SectionHeader title="หมายเหตุพิเศษ / Special Instructions" />
        <View style={s.notesBox}>
          <Text>หมายเหตุ / คำสั่งพิเศษ ................................................................................................................................................................................................</Text>
        </View>

        {/* ── SIGNATURES ── */}
        <View style={s.sigRow}>
          {[
            { role: 'แพทย์ผู้สั่งยา',      en: 'Physician' },
            { role: 'พยาบาลผู้เตรียม',     en: 'Nurse' },
            { role: 'เภสัชกรผู้ตรวจสอบ', en: 'Pharmacist' },
          ].map((sig) => (
            <View key={sig.role} style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigRole}>{sig.role}</Text>
              <Text style={s.sigEn}>({sig.en})</Text>
            </View>
          ))}
        </View>

        {/* ── DOC FOOTER ── */}
        <View style={s.docFooter}>
          <Text style={{ fontStyle: 'italic', flex: 1 }}>* เอกสารสร้างอัตโนมัติโดยระบบ PediCalc — โรงพยาบาลกบินทร์บุรี กรุณาตรวจสอบก่อนใช้งานทุกครั้ง</Text>
          <Text style={{ fontFamily: 'Kanit', color: MUTED }} render={({ pageNumber, totalPages }) => `${docId} · หน้า ${pageNumber}/${totalPages}`} fixed />
        </View>

      </Page>
    </Document>
  );
}
