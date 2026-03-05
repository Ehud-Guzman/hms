import React, { useEffect } from 'react';
import { usePrint } from './PrintContext';

const PrintStyle = () => {
  const { headerText, footerText, logoUrl } = usePrint();

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* ---------- PAGE SETUP ---------- */
        @page {
          margin: 0.3in; /* Even smaller margins */
          size: A4;
        }

        /* ---------- HIDE NON-PRINT ELEMENTS ---------- */
        nav, header, footer, aside,
        .navbar, .sidebar, .main-header, .app-sidebar,
        .no-print, .print\\:hidden,
        button, .btn, [role="button"] {
          display: none !important;
        }

        /* ---------- BASE PRINT STYLES ---------- */
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-family: Arial, sans-serif;
          color: black !important;
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10pt; /* Smaller base font */
          line-height: 1.3;
        }

        /* Compact headings */
        h1 { font-size: 16pt; margin: 0 0 8pt 0; }
        h2 { font-size: 14pt; margin: 0 0 6pt 0; }
        h3 { font-size: 12pt; margin: 0 0 4pt 0; }
        h4 { font-size: 11pt; margin: 0 0 3pt 0; }

        /* Force all text to black */
        * {
          color: black !important;
          background-color: transparent !important;
        }

        /* ---------- PRESERVE LAYOUT ---------- */
        .grid, [class*="grid"] {
          display: grid !important;
          gap: 4px !important; /* Minimal gap */
        }

        /* ---------- PAGE BREAK CONTROL ---------- */
        .section, [class*="section"] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 8px !important; /* Reduce spacing between sections */
        }

        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          break-after: avoid;
        }

        table, tr, td, th, .badge-group {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* ---------- PRINT HEADER & FOOTER ---------- */
        .print-header, .print-footer {
          display: flex !important;
        }

        .print-header {
          align-items: center;
          border-bottom: 1px solid #333;
          margin-bottom: 12px;
          padding-bottom: 6px;
        }

        .print-header img {
          max-height: 30px;
          margin-right: 10px;
        }

        .print-header h1 {
          font-size: 14pt;
          margin: 0;
        }

        .print-footer {
          text-align: center;
          font-size: 8pt;
          margin-top: 12px;
          border-top: 1px solid #ccc;
          padding-top: 4px;
        }

        /* ---------- UTILITIES ---------- */
        .card, [class*="card"] {
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }

        .badge, [class*="badge"] {
          background-color: #f0f0f0 !important;
          border: 1px solid #ccc !important;
          padding: 1px 4px !important;
          margin: 1px !important;
          font-size: 8pt !important;
        }

        .infoItem, [class*="infoItem"] {
          margin-bottom: 4px !important;
        }

        .label, .value {
          font-size: 9pt !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [headerText, footerText, logoUrl]);

  return (
    <>
      <div className="print-header" style={{ display: 'none' }}>
        {logoUrl && <img src={logoUrl} alt="Hospital Logo" />}
        <h1>{headerText}</h1>
      </div>
      <div className="print-footer" style={{ display: 'none' }}>
        Generated on {new Date().toLocaleDateString()} – {footerText}
      </div>
    </>
  );
};

export default PrintStyle;