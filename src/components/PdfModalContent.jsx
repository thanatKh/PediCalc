import { useEffect, useMemo } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import TPNPdfTemplate from '@/components/TPNPdfTemplate';

export default function PdfModalContent({ inputs, results, logoUrl, hospital, onBlobReady }) {
  const doc = useMemo(
    () => <TPNPdfTemplate inputs={inputs} results={results} logoUrl={logoUrl} hospital={hospital} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let cancelled = false;
    pdf(doc).toBlob().then((blob) => {
      if (!cancelled) onBlobReady?.(URL.createObjectURL(blob));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none', display: 'block' }}>
      {doc}
    </PDFViewer>
  );
}
