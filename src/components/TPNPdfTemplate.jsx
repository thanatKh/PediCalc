import { Document, Page, Text, View, Image, Font, StyleSheet } from '@react-pdf/renderer';

// ── Font registration (must run before any <Text> renders) ──
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: '/fonts/Sarabun-Regular.ttf' },
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

// ── StyleSheet (react-pdf uses pt-based units; 1 mm ≈ 2.835 pt) ──
const s = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Sarabun',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0d6e6e',
    paddingBottom: 6,
    marginBottom: 6,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo:    { width: 44, height: 44, objectFit: 'contain' },
  logoFallback: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#cbd5e1',
    alignItems: 'center', justifyContent: 'center',
  },
  hospitalName: { fontFamily: 'Kanit', fontSize: 13, fontWeight: 700, color: '#0d6e6e' },
  formTitle:    { fontFamily: 'Kanit', fontSize: 11, fontWeight: 600, color: '#1e293b', marginTop: 1 },
  formSubtitle: { fontSize: 8.5, color: '#64748b', marginTop: 1 },
  headerRight:  { textAlign: 'right' },
  metaLine:     { fontSize: 8.5, color: '#475569', marginBottom: 2 },
  metaLabel:    { color: '#64748b', fontWeight: 700 },
  docId:        { fontFamily: 'Kanit', fontWeight: 700, color: '#0d6e6e' },

  // Patient info
  patientBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4,
    padding: 6, marginBottom: 5,
  },
  patientGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  patientCell: { width: '33.33%', fontSize: 9, paddingVertical: 1.5 },
  cellLabel:   { color: '#475569', fontWeight: 700 },
  warnText:    { color: '#e11d48', fontWeight: 700 },
  pill: {
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 99, fontSize: 8, fontWeight: 700,
  },

  // Summary bar
  summaryRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  summaryItem: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4,
    padding: 4, alignItems: 'center',
  },
  summaryLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontFamily: 'Kanit', fontSize: 10, fontWeight: 700, color: '#0d6e6e', marginTop: 1 },

  // Section header
  sectionHdr: {
    fontFamily: 'Kanit', fontSize: 10, fontWeight: 700, color: '#0d6e6e',
    borderBottomWidth: 1, borderBottomColor: '#0d6e6e',
    paddingBottom: 2, marginBottom: 4, marginTop: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  // Table
  table:    { borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 2, marginBottom: 2 },
  tHeadRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },
  tRow:     { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  tRowAlt:  { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  tH:       { padding: 4, fontFamily: 'Kanit', fontSize: 8.5, fontWeight: 700, textAlign: 'center', color: '#1e293b', borderRightWidth: 0.5, borderRightColor: '#cbd5e1' },
  tHLast:   { padding: 4, fontFamily: 'Kanit', fontSize: 8.5, fontWeight: 700, textAlign: 'center', color: '#1e293b' },
  tC:       { padding: 4, fontSize: 9, color: '#1e293b', borderRightWidth: 0.5, borderRightColor: '#e2e8f0' },
  tCCenter: { padding: 4, fontSize: 9, color: '#475569', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#e2e8f0' },
  tCNum:    { padding: 4, fontSize: 9.5, color: '#1e293b', textAlign: 'right', fontWeight: 700, borderRightWidth: 0.5, borderRightColor: '#e2e8f0' },
  tCLast:   { padding: 4, fontSize: 8.5, color: '#64748b' },

  // Sterile water highlight row
  tRowAmber: { flexDirection: 'row', backgroundColor: '#fffbeb', borderTopWidth: 1, borderTopColor: '#94a3b8' },

  // Energy + safety grids
  gridRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  gridItem: {
    flex: 1, borderWidth: 0.5, borderColor: '#e2e8f0', borderRadius: 4,
    padding: 4, backgroundColor: '#f8fafc', alignItems: 'center',
  },
  gridItemAlert: {
    flex: 1, borderWidth: 1, borderColor: '#f59e0b', borderRadius: 4,
    padding: 4, backgroundColor: '#fffbeb', alignItems: 'center',
  },
  gridItemDanger: {
    flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 4,
    padding: 4, backgroundColor: '#fff1f2', alignItems: 'center',
  },
  gridLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase' },
  gridValue: { fontFamily: 'Kanit', fontSize: 11, fontWeight: 700, color: '#1e293b', marginTop: 1 },
  gridSub:   { fontSize: 7.5, color: '#64748b' },

  // Warning banner
  warnBanner: {
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 4, padding: 5, marginBottom: 5,
    fontSize: 9, color: '#991b1b', fontWeight: 700,
  },

  // Notes box
  notesBox: {
    borderWidth: 0.5, borderColor: '#e2e8f0', borderRadius: 4,
    minHeight: 28, padding: 5,
    fontSize: 8.5, color: '#94a3b8', fontStyle: 'italic',
  },

  // Footer
  footerWrap: { marginTop: 'auto' },
  sigRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 5 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: '#94a3b8', width: '100%', height: 18, marginBottom: 3 },
  sigCaption: { fontSize: 9, fontWeight: 700 },
  sigRole:    { fontFamily: 'Kanit', fontSize: 9, fontWeight: 600, color: '#0d6e6e', marginTop: 1 },
  sigEn:      { fontSize: 8.5, color: '#64748b' },
  sigNameLine: { borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1', borderStyle: 'dashed', width: '100%', height: 14, marginTop: 4, marginBottom: 3 },
  sigName:    { fontSize: 8.5, color: '#475569' },

  // Doc footer
  docFooter: {
    borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 7.5, color: '#94a3b8',
  },
});

// ── Helper: render a row of the ingredient table ──
const renderRow = (row, i) => {
  const rowStyle = i % 2 === 1 ? s.tRowAlt : s.tRow;
  return (
    <View style={rowStyle} key={i}>
      <Text style={[s.tC, { width: '40%' }]}>{row.name}</Text>
      <Text style={[s.tCCenter, { width: '22%' }]}>{row.target}</Text>
      <Text style={[s.tCNum, { width: '15%', color: row.color || '#1e293b' }]}>{fmt(row.ml)}</Text>
      <Text style={[s.tCLast, { width: '23%' }]}>{row.note}</Text>
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
    { name: '10% Aminoven Infant',     target: `${inputs.proteinTarget} g/kg`, ml: results.aminovenMl,    note: '2.5–3.5 g/kg/day' },
    { name: '3% NaCl',                  target: `${inputs.na3PctTarget} mEq/kg`, ml: results.na3PctMl,   note: '0.5 mEq/ml' },
    { name: 'Sodium Glycerophosphate',  target: `${inputs.naGlyceroTarget} mEq/kg`, ml: results.naGlyceroml, note: 'Na + PO4' },
    { name: '15% KCl',                  target: `${inputs.k15PctTarget} mEq/kg`, ml: results.k15PctMl,   note: '2 mEq/ml' },
    { name: '8.71% K2HPO4',             target: `${inputs.k2hpo4Target} mEq/kg`, ml: results.k2hpo4Ml,   note: '1 mEq/ml' },
    { name: '10% Calcium Gluconate',    target: `${inputs.caTarget} mmol/kg`,   ml: results.caGluconateMl, note: '0.25 mmol/ml' },
    { name: '50% MgSO4',                target: `${inputs.mgTarget} mEq/kg`,    ml: results.mgso4Ml,      note: '4 mEq/ml' },
    { name: 'Soluvit-N',                target: `${inputs.soluvitTarget} ml/kg`, ml: results.soluvitMl,   note: 'วิตามินละลายน้ำ' },
    { name: 'Pediatrace',               target: `${inputs.pediatraceTarget} ml/kg`, ml: results.pediatraceMl, note: 'ธาตุอาหารรอง' },
  ];

  const lipidRows = [
    { name: '20% SMOFlipid',      target: `${inputs.lipidTarget} g/kg`,      ml: results.lipidMl,     note: 'MCT/Soy/Olive/Fish oil', color: '#047857' },
    { name: 'Vitalipid N Infant', target: `${inputs.vitalipidTarget} ml/kg`, ml: results.vitalipidMl, note: 'เติมใน lipid bag' },
  ];

  const energyItems = [
    { label: 'Total Energy', val: fmt(results.totalEnergy, 1), sub: 'kcal/day' },
    { label: 'kcal/kg/day',  val: fmt(results.kcalPerKg, 1),   sub: 'kcal/kg' },
    { label: 'CHO',          val: `${fmt(results.choPct, 1)}%`, sub: `${fmt(results.cho_kcal,1)} kcal` },
    { label: 'Protein',      val: `${fmt(results.proteinPct,1)}%`, sub: `${fmt(results.protein_kcal,1)} kcal` },
    { label: 'Fat',          val: `${fmt(results.fatPct, 1)}%`, sub: `${fmt(results.fat_kcal,1)} kcal` },
    { label: 'NPC : N',      val: fmt(results.npcN, 0),        sub: 'target 150–200' },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.headerRow}>
          <View style={s.logoRow}>
            {logoUrl
              ? <Image src={logoUrl} style={s.logo} />
              : <View style={s.logoFallback}><Text style={{ fontSize: 7, color: '#94a3b8' }}>LOGO</Text></View>
            }
            <View>
              <Text style={s.hospitalName}>โรงพยาบาลกบินทร์บุรี | Kabinburi Hospital</Text>
              <Text style={s.formTitle}>{isNewborn ? 'NEONATAL' : 'PEDIATRIC'} PARENTERAL NUTRITION ORDER FORM</Text>
              <Text style={s.formSubtitle}>{isNewborn ? 'คำสั่งจ่ายสารอาหารทางหลอดเลือดดำ · ทารกแรกเกิด' : 'คำสั่งจ่ายสารอาหารทางหลอดเลือดดำ · กุมารเวชกรรม'}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.metaLine}><Text style={s.metaLabel}>เลขที่เอกสาร: </Text><Text style={s.docId}>{docId}</Text></Text>
            <Text style={s.metaLine}><Text style={s.metaLabel}>วันที่พิมพ์: </Text>{nowDate}</Text>
            <Text style={s.metaLine}><Text style={s.metaLabel}>เวลา: </Text>{nowTime} น.</Text>
          </View>
        </View>

        {/* PATIENT INFO */}
        <View style={s.patientBox}>
          <View style={s.patientGrid}>
            <Text style={s.patientCell}><Text style={s.cellLabel}>ชื่อ-สกุล: </Text>{inputs.name || 'ไม่ระบุ'}</Text>
            <Text style={s.patientCell}>
              <Text style={s.cellLabel}>HN: </Text>
              {inputs.hn ? <Text>{inputs.hn}</Text> : <Text style={s.warnText}>⚠ ยังไม่ระบุ HN</Text>}
            </Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>Ward: </Text>{inputs.ward || '—'}</Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>อายุ: </Text>{inputs.ageMonth || '0'} เดือน {inputs.ageDay || '0'} วัน</Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>น้ำหนัก: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700 }}>{inputs.bw || '—'} kg</Text></Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>ส่วนสูง: </Text>{inputs.height ? `${inputs.height} cm` : '—'}</Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>โหมด: </Text><Text style={{ fontFamily: 'Kanit', fontWeight: 700, color: '#0d6e6e' }}>{isNewborn ? 'Newborn (+25 ml dead space)' : 'Pediatric'}</Text></Text>
            <Text style={s.patientCell}>
              <Text style={s.cellLabel}>Route: </Text>
              <Text style={[s.pill, { backgroundColor: isCentral ? '#dcfce7' : '#fef9c3', color: isCentral ? '#166534' : '#854d0e' }]}>
                {isCentral ? 'Central line' : 'Peripheral line'}
              </Text>
            </Text>
            <Text style={s.patientCell}><Text style={s.cellLabel}>เริ่มให้ TPN: </Text>{inputs.startDate ? fmtDate(inputs.startDate) : <Text style={{ color: '#f59e0b' }}>ยังไม่ระบุ</Text>}</Text>
          </View>
        </View>

        {/* SUMMARY BAR */}
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Total Volume/day</Text>
            <Text style={s.summaryValue}>{fmt(results.totalVolume, 1)} ml</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>Volume Target</Text>
            <Text style={[s.summaryValue, { color: '#1e293b' }]}>{inputs.volumeTarget} ml/kg/day</Text>
          </View>
          <View style={[s.summaryItem, { backgroundColor: '#eff6ff' }]}>
            <Text style={s.summaryLabel}>2-in-1 Bag Rate</Text>
            <Text style={[s.summaryValue, { color: '#1d4ed8', fontSize: 11 }]}>{fmt(results.infusionRate, 1)} ml/hr</Text>
          </View>
          <View style={[s.summaryItem, { backgroundColor: '#f0fdf4' }]}>
            <Text style={s.summaryLabel}>Lipid Rate</Text>
            <Text style={[s.summaryValue, { color: '#047857' }]}>{fmt(results.lipidMl / 24, 1)} ml/hr</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>DSF</Text>
            <Text style={[s.summaryValue, { color: '#475569' }]}>{fmt(results.dsf, 3)}</Text>
          </View>
        </View>

        {/* PART 1: 2-in-1 BAG */}
        <Text style={s.sectionHdr}>ส่วนที่ 1 · 2-in-1 Bag (เตรียมรวมในถุงเดียว)</Text>
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.tH, { width: '40%' }]}>ส่วนประกอบ (Ingredients)</Text>
            <Text style={[s.tH, { width: '22%' }]}>เป้าหมาย / kg/day</Text>
            <Text style={[s.tH, { width: '15%' }]}>ปริมาตร (ml)</Text>
            <Text style={[s.tHLast, { width: '23%' }]}>ช่วงปกติ / หมายเหตุ</Text>
          </View>
          {bag2in1Rows.map(renderRow)}
          <View style={s.tRowAmber}>
            <Text style={[s.tC, { width: '40%', fontWeight: 700, color: '#92400e' }]}>Sterile Water for Injection</Text>
            <Text style={[s.tCCenter, { width: '22%', color: '#92400e' }]}>เติมให้ครบปริมาตร</Text>
            <Text style={[s.tCNum, { width: '15%', color: '#92400e', fontSize: 10.5 }]}>{fmt(results.sterileWaterMl)}</Text>
            <Text style={[s.tCLast, { width: '23%', color: '#92400e' }]}>ปริมาตรน้ำกลั่นเติมเต็ม Total Vol</Text>
          </View>
        </View>

        {/* PART 2: LIPID */}
        <Text style={s.sectionHdr}>ส่วนที่ 2 · Lipid Emulsion (แยกสาย — Y-site หรือ piggyback)</Text>
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.tH, { width: '40%' }]}>ส่วนประกอบ (Ingredients)</Text>
            <Text style={[s.tH, { width: '22%' }]}>เป้าหมาย / kg/day</Text>
            <Text style={[s.tH, { width: '15%' }]}>ปริมาตร (ml)</Text>
            <Text style={[s.tHLast, { width: '23%' }]}>ช่วงปกติ / หมายเหตุ</Text>
          </View>
          {lipidRows.map(renderRow)}
        </View>

        {/* ENERGY */}
        <Text style={s.sectionHdr}>พลังงาน · Energy Distribution</Text>
        <View style={s.gridRow}>
          {energyItems.map((item) => (
            <View style={s.gridItem} key={item.label}>
              <Text style={s.gridLabel}>{item.label}</Text>
              <Text style={s.gridValue}>{item.val}</Text>
              <Text style={s.gridSub}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* SAFETY */}
        <Text style={s.sectionHdr}>Clinical Safety Checks</Text>
        <View style={s.gridRow}>
          {/* GIR */}
          <View style={girHigh || girLow ? s.gridItemAlert : s.gridItem}>
            <Text style={s.gridLabel}>GIR</Text>
            <Text style={[s.gridValue, { color: girHigh || girLow ? '#b45309' : '#1e293b' }]}>{fmt(results.gir, 1)} <Text style={{ fontSize: 7, fontFamily: 'Sarabun', fontWeight: 400 }}>mg/kg/min</Text></Text>
            <Text style={[s.gridSub, { color: girHigh || girLow ? '#b45309' : '#64748b' }]}>{girHigh ? '⚠ สูงเกิน' : girLow ? '⚠ ต่ำเกิน' : 'target 4–12 ✓'}</Text>
          </View>
          {/* Osmolarity */}
          <View style={osmHigh && !isCentral ? s.gridItemDanger : osmHigh ? s.gridItemAlert : s.gridItem}>
            <Text style={s.gridLabel}>Osmolarity</Text>
            <Text style={[s.gridValue, { color: osmHigh ? '#b91c1c' : '#1e293b' }]}>{fmt(results.estOsmolarity, 0)} <Text style={{ fontSize: 7, fontFamily: 'Sarabun', fontWeight: 400 }}>mOsm/L</Text></Text>
            <Text style={[s.gridSub, { color: osmHigh ? '#b91c1c' : '#64748b' }]}>
              {osmHigh && !isCentral ? '⚠ ต้องให้ทาง Central' : osmHigh ? 'Central line required' : 'peripheral OK ✓'}
            </Text>
          </View>
          {/* Fat Rate */}
          <View style={fatRateHigh ? s.gridItemAlert : s.gridItem}>
            <Text style={s.gridLabel}>Fat Infusion Rate</Text>
            <Text style={[s.gridValue, { color: fatRateHigh ? '#b45309' : '#1e293b' }]}>{fmt(results.lipidMl / 24, 2)} <Text style={{ fontSize: 7, fontFamily: 'Sarabun', fontWeight: 400 }}>ml/hr</Text></Text>
            <Text style={[s.gridSub, { color: fatRateHigh ? '#b45309' : '#64748b' }]}>{fatRateHigh ? '⚠ max 0.17 g/kg/hr' : 'max 0.17 g/kg/hr ✓'}</Text>
          </View>
          {/* Ca + PO4 */}
          <View style={caxPHigh ? s.gridItemDanger : s.gridItem}>
            <Text style={s.gridLabel}>Ca + PO4 (mEq)</Text>
            <Text style={[s.gridValue, { color: caxPHigh ? '#b91c1c' : '#1e293b' }]}>{fmt(results.caxP, 1)} <Text style={{ fontSize: 7, fontFamily: 'Sarabun', fontWeight: 400 }}>mEq</Text></Text>
            <Text style={[s.gridSub, { color: caxPHigh ? '#b91c1c' : '#64748b' }]}>{caxPHigh ? '⚠ เสี่ยงตกตะกอน >45' : 'ความเข้ากันได้ปกติ ✓'}</Text>
          </View>
        </View>

        {/* Warning banner */}
        {osmHigh && !isCentral && (
          <Text style={s.warnBanner}>
            ⚠ คำเตือน: Osmolarity {fmt(results.estOsmolarity, 0)} mOsm/L เกินขีดจำกัดของ Peripheral line ({'<'}900 mOsm/L) — ต้องให้ทาง Central line เท่านั้น
          </Text>
        )}

        {/* SPECIAL INSTRUCTIONS */}
        <Text style={s.sectionHdr}>หมายเหตุพิเศษ / Special Instructions</Text>
        <View style={s.notesBox}>
          <Text>(ระบุคำสั่งพิเศษ เช่น ปรับ rate, หยุด lipid ถ้า TG &gt;250, ลด rate 50% ถ้า glucose &gt;180, ฯลฯ)</Text>
        </View>

        {/* FOOTER */}
        <View style={s.footerWrap}>
          <View style={s.sigRow}>
            {[
              { role: 'แพทย์ผู้สั่งยา', en: 'Physician' },
              { role: 'พยาบาลผู้เตรียม', en: 'Nurse' },
              { role: 'เภสัชกรผู้ตรวจสอบ', en: 'Pharmacist' },
            ].map((sig) => (
              <View key={sig.role} style={s.sigBlock}>
                <View style={s.sigLine} />
                <Text style={s.sigCaption}>ลงชื่อ ....................................</Text>
                <Text style={s.sigRole}>{sig.role}</Text>
                <Text style={s.sigEn}>({sig.en})</Text>
                <View style={s.sigNameLine} />
                <Text style={s.sigName}>( ........................................ )</Text>
              </View>
            ))}
          </View>

          <View style={s.docFooter}>
            <Text style={{ fontStyle: 'italic', flex: 1 }}>* เอกสารสร้างอัตโนมัติโดยระบบ PediCalc — โรงพยาบาลกบินทร์บุรี กรุณาตรวจสอบก่อนใช้งานทุกครั้ง</Text>
            <Text style={{ fontFamily: 'Kanit', color: '#64748b' }} render={({ pageNumber, totalPages }) => `เลขที่: ${docId} · หน้า ${pageNumber}/${totalPages}`} fixed />
          </View>
        </View>
      </Page>
    </Document>
  );
}
