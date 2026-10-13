import { CompanySettings } from './types';
import { getEffectiveCompanyName } from './brandingService';

export type PaperFormat = 'carta' | 'oficio' | 'a4';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginSize = 'normal' | 'estrecho' | 'amplio';

export interface PageConfig {
  format: PaperFormat;
  orientation: PageOrientation;
  margin: MarginSize;
}

export interface ComputedPageMetrics {
  pageWidth: number;
  pageHeight: number;
  marginMm: number;
  contentWidth: number;
  contentHeight: number;
  formatLabel: string;
  orientationLabel: string;
}

/**
 * Retorna las dimensiones milimétricas exactas según el formato, orientación y margen.
 * Carta (Letter): 215.9 x 279.4 mm
 * Oficio (Legal): 215.9 x 355.6 mm
 * A4: 210 x 297 mm
 */
export function getPageMetrics(
  format: PaperFormat = 'carta',
  orientation: PageOrientation = 'portrait',
  margin: MarginSize = 'normal'
): ComputedPageMetrics {
  let baseW = 215.9;
  let baseH = 279.4;
  let formatLabel = 'Carta (8.5" × 11")';

  if (format === 'oficio') {
    baseW = 215.9;
    baseH = 355.6;
    formatLabel = 'Oficio (8.5" × 14")';
  } else if (format === 'a4') {
    baseW = 210.0;
    baseH = 297.0;
    formatLabel = 'A4 (210 × 297 mm)';
  }

  const pageWidth = orientation === 'portrait' ? baseW : baseH;
  const pageHeight = orientation === 'portrait' ? baseH : baseW;

  let marginMm = 15;
  if (margin === 'estrecho') marginMm = 10;
  if (margin === 'amplio') marginMm = 20;

  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  return {
    pageWidth,
    pageHeight,
    marginMm,
    contentWidth,
    contentHeight,
    formatLabel,
    orientationLabel: orientation === 'portrait' ? 'Vertical' : 'Horizontal',
  };
}

/**
 * Inyecta una regla dinámica de CSS @page en el documento para que
 * la orden de impresión nativa (window.print()) respete el tamaño de hoja,
 * márgenes y orientación configurados por el usuario.
 */
export function injectPrintPageStyles(
  format: PaperFormat = 'carta',
  orientation: PageOrientation = 'portrait',
  margin: MarginSize = 'normal'
): () => void {
  if (typeof document === 'undefined') return () => {};

  const styleId = 'dynamic-constructerp-print-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const cssSize =
    format === 'carta' ? 'letter' : format === 'oficio' ? 'legal' : 'A4';
  const marginMm = margin === 'estrecho' ? '10mm' : margin === 'amplio' ? '20mm' : '15mm';

  styleEl.textContent = `
    @media print {
      @page {
        size: ${cssSize} ${orientation};
        margin: ${marginMm};
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  return () => {
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  };
}

/**
 * Helper para dibujar el encabezado oficial de la empresa en cualquier documento PDF
 * adaptándose dinámicamente al ancho útil, tamaño de hoja y orientación.
 */
export function drawPdfHeader(
  doc: any,
  company: CompanySettings,
  title: string,
  subTitle: string,
  metrics: ComputedPageMetrics,
  currentY: number,
  currency: string = 'GTQ'
): number {
  const { marginMm, contentWidth, pageWidth } = metrics;
  let y = currentY;

  // Fondo superior azul obscuro
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(marginMm, y, contentWidth, 26, 'F');

  // Acento dorado
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(marginMm, y + 25, contentWidth, 1.5, 'F');

  // Incrustar logotipo si existe
  let textStartX = marginMm + 5;
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    try {
      const format =
        company.logoUrl.includes('jpeg') || company.logoUrl.includes('jpg') ? 'JPEG' : 'PNG';
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginMm + 2, y + 2, 22, 22, 2, 2, 'F');
      doc.addImage(company.logoUrl, format, marginMm + 3, y + 3, 20, 20);
      textStartX = marginMm + 28;
    } catch (e) {
      console.warn('Error dibujando logotipo en PDF:', e);
    }
  }

  const companyName = getEffectiveCompanyName(company).toUpperCase();

  // Nombre de empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(companyName, textStartX, y + 7);

  // Subtítulo con NIT y contacto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  const nitDetails = `NIT: ${company.nit || 'C/F'} • ${company.address || 'Guatemala'} • Tel: ${company.phone || 'N/A'}`;
  doc.text(nitDetails, textStartX, y + 13);

  // Leyenda de moneda y tipo de cambio
  const tcDetails = `Documento Oficial de Liquidación & Control • Moneda: ${currency} • T.C.: Q ${Number(company.exchangeRate || 7.82).toFixed(2)}`;
  doc.text(tcDetails, textStartX, y + 19);

  // Fecha y hora en esquina derecha
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(253, 224, 71); // amber-300
  const dateStr = `Emisión: ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(dateStr, pageWidth - marginMm - 4, y + 7, { align: 'right' });

  // Hoja y orientación
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Formato: ${metrics.formatLabel} (${metrics.orientationLabel})`, pageWidth - marginMm - 4, y + 13, { align: 'right' });

  y += 32;

  // Título principal del reporte
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, marginMm, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subTitle, marginMm, y + 5);

  y += 11;
  return y;
}

/**
 * Estampa el pie de página legal y numeración "Página X de Y" en todas las páginas generadas
 */
export function stampPdfFooters(
  doc: any,
  metrics: ComputedPageMetrics,
  companyName: string = 'ConstructERP Guatemala'
): void {
  const totalPages = doc.getNumberOfPages();
  const { marginMm, pageHeight, pageWidth } = metrics;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);

    // Línea divisoria de pie de página
    doc.setDrawColor(226, 232, 240);
    doc.line(marginMm, pageHeight - 9, pageWidth - marginMm, pageHeight - 9);

    const footerText = `${companyName} © Sistema Certificado de Control de Obras y Bitácoras para la República de Guatemala.`;
    doc.text(footerText, marginMm, pageHeight - 5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginMm, pageHeight - 5, { align: 'right' });
  }
}
