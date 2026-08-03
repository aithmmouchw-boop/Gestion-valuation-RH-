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
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().substring(0, 10)}.xlsx`);
}
