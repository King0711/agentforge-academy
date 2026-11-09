// PDF version of the admin sales report (/admin/sales).
//
// Deliberately has NO buyer details: no names, emails or Paystack references
// (the reference embeds the account id). It is the copy that can leave the
// team; the full buyer list stays in the CSV export.
//
// jsPDF is imported inside the function, so the ~400 KB library is only
// downloaded when someone presses "Export PDF", not with the admin bundle.
//
// The built-in PDF fonts have no naira sign, so amounts read "NGN 1,234.56".
import { summarize, watDateTime } from './salesReport';

const ngn = (n) =>
  `NGN ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const INK = [24, 24, 27];
const MUTED = [107, 114, 128];
const HEAD_FILL = [31, 56, 100];
const BAND = [246, 248, 251];

// `rows` is the output of enrich() in salesReport.js; `from` / `to` are the
// WAT calendar dates (YYYY-MM-DD) the report covers.
export async function buildSalesPdf(rows, { from, to, generatedAt = new Date() }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const summary = summarize(rows);
  const sales = rows.filter((r) => r.sale);
  const notSales = rows.length - sales.length;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sales report', margin, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Social Dev Technologies', margin, 70);
  doc.text(`Period: ${from} to ${to} (Nigerian time)`, margin, 84);
  doc.text(`Generated ${generatedAt.toISOString().slice(0, 10)}`, margin, 98);

  // Headline numbers.
  const cards = [
    ['Sales', String(summary.total.count)],
    ['Charged to customers', ngn(summary.total.charged)],
    ['Paystack fees (est.)', ngn(summary.total.fees)],
    ['Kept after fees', ngn(summary.total.kept)],
  ];
  const gap = 8;
  const cardW = (contentW - gap * 3) / 4;
  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(...BAND);
    doc.roundedRect(x, 112, cardW, 46, 4, 4, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, x + 8, 126);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(value.length > 14 ? 9.5 : 12);
    doc.setTextColor(...INK);
    doc.text(value, x + 8, 146);
    doc.setFont('helvetica', 'normal');
  });

  const tableStyle = {
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: INK },
    headStyles: { fillColor: HEAD_FILL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: BAND },
    footStyles: { fillColor: [229, 233, 240], textColor: INK, fontStyle: 'bold' },
    showFoot: 'lastPage',
  };
  const moneyCols = { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } };
  // columnStyles only reach body cells, so the heading and Total rows are
  // right-aligned here to sit over their numbers.
  const alignHeads = (firstRightCol) => (data) => {
    if (data.section !== 'body' && data.column.index >= firstRightCol) data.cell.styles.halign = 'right';
  };
  const groupTable = (title, firstColumn, groups, startY) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title, margin, startY);
    autoTable(doc, {
      ...tableStyle,
      startY: startY + 8,
      head: [[firstColumn, 'Sales', 'Charged', 'Fees (est.)', 'Kept']],
      body: groups.map((g) => [g.key, g.count, ngn(g.charged), ngn(g.fees), ngn(g.kept)]),
      foot: [['Total', summary.total.count, ngn(summary.total.charged), ngn(summary.total.fees), ngn(summary.total.kept)]],
      columnStyles: moneyCols,
      didParseCell: alignHeads(1),
    });
    return doc.lastAutoTable.finalY;
  };

  let y = 190;
  if (summary.total.count === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text('No sales in this period.', margin, y);
  } else {
    y = groupTable('By product', 'Product', summary.byProduct, y) + 26;
    y = groupTable('By month', 'Month', summary.byMonth, y) + 26;

    // Individual payments, newest last, no buyer details.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    if (y > 700) {
      doc.addPage();
      y = 54;
    }
    doc.text('Payments', margin, y);
    autoTable(doc, {
      ...tableStyle,
      startY: y + 8,
      showFoot: 'never',
      head: [['Date (WAT)', 'Product', 'Charged', 'Fee (est.)', 'Kept']],
      body: sales.map((r) => [watDateTime(r.created_at), r.label, ngn(r.amount), ngn(r.fee), ngn(r.kept)]),
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      didParseCell: alignHeads(2),
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  const notes = [
    'Notes',
    'Charged includes the Paystack fee that checkout adds to the buyer’s total. Kept is the price without that fee.',
    'Fees are estimates worked back from the amount charged. Paystack’s own export has the exact settlement figures.',
    ...(notSales > 0 ? [`${notSales} payment${notSales === 1 ? '' : 's'} in this period did not unlock a product and ${notSales === 1 ? 'is' : 'are'} left out.`] : []),
    'This copy has no buyer names, emails or payment references.',
  ];
  if (y > 740) {
    doc.addPage();
    y = 54;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(notes[0], margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  let ny = y + 13;
  for (const line of notes.slice(1)) {
    const wrapped = doc.splitTextToSize(line, contentW);
    doc.text(wrapped, margin, ny);
    ny += wrapped.length * 11 + 2;
    if (ny > 800) {
      doc.addPage();
      ny = 54;
    }
  }

  // Page numbers.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
  }
  return doc;
}

export async function downloadSalesPdf(rows, range) {
  const doc = await buildSalesPdf(rows, range);
  doc.save(`sales-report_${range.from}_to_${range.to}.pdf`);
}
