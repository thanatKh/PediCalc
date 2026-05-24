import { useEffect, useMemo, useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { FileText, Share2, Loader2 } from 'lucide-react';
import TPNPdfTemplate from '@/components/TPNPdfTemplate';

export default function PdfModalContent({ inputs, results, logoUrl, hospital, onBlobReady, isMobile, filename, onShare }) {
  const doc = useMemo(
    () => <TPNPdfTemplate inputs={inputs} results={results} logoUrl={logoUrl} hospital={hospital} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pdf(doc).toBlob().then((blob) => {
      if (!cancelled) {
        onBlobReady?.(URL.createObjectURL(blob));
        setReady(true);
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Mobile: show a "PDF ready" placeholder instead of the broken iframe viewer ── */
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        {!ready ? (
          <>
            <Loader2 size={36} className="animate-spin text-teal-400" />
            <p className="text-slate-400 font-sans text-sm">กำลังสร้าง PDF…</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-teal-500/10 ring-1 ring-teal-400/20">
              <FileText size={40} className="text-teal-400" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-mitr font-semibold text-base">PDF พร้อมแล้ว</p>
              <p className="text-slate-400 font-sans text-xs break-all">{filename}</p>
            </div>
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all text-white font-mitr font-semibold text-sm"
            >
              <Share2 size={16} />
              แชร์ / บันทึก PDF
            </button>
            <p className="text-slate-500 font-sans text-xs">เปิดใน Files, แชร์ หรือพิมพ์ผ่าน iOS</p>
          </>
        )}
      </div>
    );
  }

  /* ── Desktop: keep the full PDFViewer — unchanged ── */
  return (
    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none', display: 'block' }}>
      {doc}
    </PDFViewer>
  );
}
