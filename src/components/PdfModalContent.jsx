import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import TPNPdfTemplate from '@/components/TPNPdfTemplate';

function makeDoc(inputs, results, logoUrl, hospital) {
  return <TPNPdfTemplate inputs={inputs} results={results} logoUrl={logoUrl} hospital={hospital} />;
}

export function PdfDownloadButton({ inputs, results, logoUrl, filename, hospital }) {
  return (
    <PDFDownloadLink document={makeDoc(inputs, results, logoUrl, hospital)} fileName={filename}>
      {({ loading }) => (
        <span
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mitr font-semibold transition-colors ${
            loading
              ? 'bg-white/10 text-white/40 cursor-wait'
              : 'bg-white text-slate-700 hover:bg-white/90 cursor-pointer'
          }`}
        >
          {loading
            ? <><Loader2 size={13} className="animate-spin" /> กำลังเตรียม…</>
            : <><Download size={13} /> ดาวน์โหลด PDF</>
          }
        </span>
      )}
    </PDFDownloadLink>
  );
}

export default function PdfModalContent({ inputs, results, logoUrl, hospital }) {
  return (
    <PDFViewer width="100%" height="100%" showToolbar={false}>
      {makeDoc(inputs, results, logoUrl, hospital)}
    </PDFViewer>
  );
}
