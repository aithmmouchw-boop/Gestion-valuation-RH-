import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToPDF(title: string, headers: string[], rows: (string | number)[][], fileName: string = 'export_groupe_premium') {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header banner for Groupe Premium
  doc.setFillColor(11, 66, 38); // Premium Deep Emerald Green
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('GROUPE PREMIUM — PERFORMANCE & DÉVELOPPEMENT RH', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 18);

  // Title of the table/view
  doc.setFontSize(13);
  doc.setTextColor(11, 66, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 34);

  // Table
  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows as any,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 66, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248]
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Groupe Premium Maroc — Document confidentiel RH | Page ${i} sur ${pageCount}`, 14, 287);
  }

  doc.save(`${fileName}_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export function exportToExcel(sheetName: string, headers: string[], rows: (string | number)[][], fileName: string = 'export_groupe_premium') {
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const cols = headers.map(() => ({ wch: 22 }));
  worksheet['!cols'] = cols;

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (sheetName || 'Export')
    .replace(/[\\/?*[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 31) || 'Export';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().substring(0, 10)}.xlsx`);
}


export function exportDossierEvaluationPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  validations: { role: string; name?: string; status: string; comment?: string }[],
  fileName: string = 'dossier_evaluation'
) {
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFillColor(11, 66, 38);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("GROUPE PREMIUM — DOSSIER D'ÉVALUATION RH", 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 18);

  doc.setFontSize(13);
  doc.setTextColor(11, 66, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 34);

  const unifiedHeaders = ['Section', 'Élément / Compétence', 'Commentaire', 'Note / Statut'];
  const normalizedRows = rows.map(row => {
    if (row.length >= 4) return [row[0] || '-', row[1] || '-', row[2] || '-', row[3] || '-'];
    if (row.length === 3) return [row[0] || '-', row[1] || '-', row[2] || '-', '-'];
    return [row[0] || '-', row[1] || '-', '-', '-'];
  });
  const validationRows = validations.map(item => [
    'Validation',
    item.name ? `${item.role}\n${item.name}` : item.role,
    item.comment || '-',
    item.status || '-',
  ]);

  autoTable(doc, {
    startY: 40,
    head: [unifiedHeaders],
    body: [...normalizedRows, ...validationRows] as any,
    theme: 'grid',
    headStyles: { fillColor: [11, 66, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 62 },
      3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 248] },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.raw?.[0] === 'Validation') {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Groupe Premium Maroc — Document confidentiel RH | Page ${i} sur ${pageCount}`, 14, 287);
  }

  doc.save(`${fileName}_${new Date().toISOString().substring(0, 10)}.pdf`);
}
