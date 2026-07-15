import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DashboardSummary } from '../types';

export async function exportDashboardPdf(
  element: HTMLElement,
  summary: DashboardSummary,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#1a1b1d',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  pdf.setFontSize(16);
  pdf.text(summary.dashboard.name, margin, margin + 4);

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Space: ${summary.spaceName}`, margin, margin + 12);
  pdf.text(`Exported: ${dateStr}`, margin, margin + 18);
  pdf.text(`Owner: ${summary.dashboard.ownerName}`, margin, margin + 24);
  pdf.text(
    `Created: ${new Date(summary.dashboard.createdAt).toLocaleDateString()} | Updated: ${new Date(summary.dashboard.updatedAt).toLocaleDateString()}`,
    margin,
    margin + 30,
  );

  pdf.setTextColor(0);

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const startY = margin + 36;
  const availableHeight = pageHeight - startY - margin;

  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, 'PNG', margin, startY, imgWidth, imgHeight);
  } else {
    const scaledHeight = availableHeight;
    const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
    pdf.addImage(imgData, 'PNG', margin, startY, scaledWidth, scaledHeight);
  }

  const safeName = summary.dashboard.name.replace(/[^\w\s-]/g, '').trim() || 'dashboard';
  pdf.save(`${safeName}-${now.toISOString().slice(0, 10)}.pdf`);
}
