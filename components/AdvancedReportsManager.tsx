'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  Receipt,
  DollarSign,
  MapPin,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  HardHat,
  ChevronDown,
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  Info,
  Terminal,
} from 'lucide-react';
import { Project, CompanySettings, ExpenseRecord, FieldVisit, AttendanceRecord, Employee } from '@/lib/types';
import { formatGTQ, formatUSD } from '@/lib/data';
import {
  exportProjectAccountingWorkbook,
  downloadVbaMacroFile,
  GUATEMALAN_ACCOUNTING_VBA_MACROS,
} from '@/lib/excelAccountingExport';

interface AdvancedReportsManagerProps {
  projects: Project[];
  activeProjectId: string;
  company: CompanySettings;
  expenses: ExpenseRecord[];
  fieldVisits: FieldVisit[];
  currency: 'GTQ' | 'USD';
  attendance?: AttendanceRecord[];
  employees?: Employee[];
}

type ReportType = 'project_summary' | 'expense_report' | 'field_visits' | 'consolidated';

export const AdvancedReportsManager: React.FC<AdvancedReportsManagerProps> = ({
  projects,
  activeProjectId,
  company,
  expenses,
  fieldVisits,
  currency,
  attendance = [],
  employees = [],
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [reportType, setReportType] = useState<ReportType>('consolidated');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isCopiedVba, setIsCopiedVba] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [excelSuccessToast, setExcelSuccessToast] = useState(false);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Filtered data
  const projectExpenses = expenses.filter((e) => {
    const matchProject = selectedProjectId === 'all' || e.projectId === activeProject.id;
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchProject && matchCategory;
  });

  const projectVisits = fieldVisits.filter((v) => {
    return selectedProjectId === 'all' || v.projectId === activeProject.id;
  });

  const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = selectedProjectId === 'all'
    ? projects.reduce((sum, p) => sum + p.budgetTotal, 0)
    : activeProject.budgetTotal;
  const balance = totalBudget - totalSpent;

  const formatMoney = (val: number) => {
    return currency === 'GTQ' ? formatGTQ(val) : formatUSD(val, company.exchangeRate);
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportProjectAccountingWorkbook({
        project: activeProject,
        company,
        expenses: projectExpenses,
        fieldVisits: projectVisits,
        currency,
        attendance,
        employees,
      });
      setExcelSuccessToast(true);
      setTimeout(() => setExcelSuccessToast(false), 4500);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
    } finally {
      setTimeout(() => setIsExportingExcel(false), 800);
    }
  };

  const handleCopyVba = () => {
    const code = GUATEMALAN_ACCOUNTING_VBA_MACROS
      .replace(/{PROJECT_CODE}/g, activeProject.code)
      .replace(/{PROJECT_NAME}/g, activeProject.name)
      .replace(/{DATE_GENERATED}/g, new Date().toLocaleString('es-GT'));
    navigator.clipboard.writeText(code);
    setIsCopiedVba(true);
    setTimeout(() => setIsCopiedVba(false), 2500);
  };

  // Generate Professional Formatted PDF with jsPDF
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Helper for header banner
      const drawHeader = (titleText: string, subTitleText: string) => {
        // Dark top accent bar
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(margin, y, pageWidth - margin * 2, 26, 'F');

        // Gold brand accent line
        doc.setFillColor(245, 158, 11); // amber-500
        doc.rect(margin, y + 25, pageWidth - margin * 2, 1.5, 'F');

        // Company title & subtitle
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(company.companyName.toUpperCase(), margin + 5, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.text(`NIT: ${company.nit} • ${company.address} • Tel: ${company.phone}`, margin + 5, y + 13);
        doc.text(
          `Documento Oficial de Control y Liquidación de Obra • Moneda: ${currency} • T.C.: Q ${company.exchangeRate.toFixed(2)}`,
          margin + 5,
          y + 19
        );

        // Date of generation
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(253, 224, 71); // amber-300
        const dateStr = `Fecha Emisión: ${new Date().toLocaleDateString('es-GT')} ${new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`;
        doc.text(dateStr, pageWidth - margin - 5, y + 7, { align: 'right' });

        y += 33;

        // Title box
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(titleText, margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(subTitleText, margin, y + 5);

        y += 12;
      };

      // Helper for page check
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = margin;
          // Running small header on subsequent pages
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.text(`ConstructERP Guatemala • ${activeProject.code} - ${activeProject.name}`, margin + 3, y + 4.5);
          doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });
          y += 12;
        }
      };

      // Draw Main Header
      let reportMainTitle = 'INFORME CONSOLIDADO EJECUTIVO DE OBRA';
      let reportSubTitle = `Proyecto: ${activeProject.code} - ${activeProject.name} | Ubicación: ${activeProject.location}`;

      if (reportType === 'project_summary') {
        reportMainTitle = 'RESUMEN EJECUTIVO & AVANCES FÍSICOS DE OBRA';
        reportSubTitle = `Supervisión de Proyecto: ${activeProject.name} (${activeProject.code})`;
      } else if (reportType === 'expense_report') {
        reportMainTitle = 'REPORTE DE EJECUCIÓN FINANCIERA & FACTURAS SAT';
        reportSubTitle = `Detalle de Compras, Mano de Obra y Maquinaria en ${activeProject.name}`;
      } else if (reportType === 'field_visits') {
        reportMainTitle = 'BITÁCORAS DE CAMPO & REGISTRO DE SUPERVISIÓN';
        reportSubTitle = `Firmas de Capataz y Registros Georreferenciados en ${activeProject.name}`;
      }

      drawHeader(reportMainTitle, reportSubTitle);

      // 1. PROJECT METADATA & FINANCIAL SUMMARY CARDS
      if (reportType === 'project_summary' || reportType === 'consolidated') {
        checkPageBreak(38);

        // Project Info Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('DATOS GENERALES DEL PROYECTO', margin + 4, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);

        // Col 1
        doc.text(`Cliente / Propietario: ${activeProject.client}`, margin + 4, y + 12);
        doc.text(`Ubicación: ${activeProject.location}`, margin + 4, y + 17);
        doc.text(`Municipio / Depto: ${activeProject.municipality}, ${activeProject.department}`, margin + 4, y + 22);

        // Col 2
        const col2X = margin + 95;
        doc.text(`Código Obra: ${activeProject.code}`, col2X, y + 12);
        doc.text(`Estado Actual: ${activeProject.status}`, col2X, y + 17);
        doc.text(`Avance Físico Certificado: ${activeProject.progressPercent}%`, col2X, y + 22);

        // Col 3
        const col3X = pageWidth - margin - 35;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);
        doc.text(`Progreso: ${activeProject.progressPercent}%`, col3X, y + 15, { align: 'right' });

        y += 32;

        // KPI Metric Cards Row
        checkPageBreak(24);
        const cardWidth = (pageWidth - margin * 2 - 6) / 3;

        // Card 1: Presupuesto
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(margin, y, cardWidth, 18, 2, 2, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 64, 175);
        doc.setFont('helvetica', 'bold');
        doc.text('PRESUPUESTO AUTORIZADO', margin + 3, y + 6);
        doc.setFontSize(10.5);
        doc.text(formatMoney(totalBudget), margin + 3, y + 13);

        // Card 2: Ejecutado
        const card2X = margin + cardWidth + 3;
        doc.setFillColor(254, 242, 242); // red-50
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(card2X, y, cardWidth, 18, 2, 2, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(153, 27, 27);
        doc.text('INVERSIÓN EJECUTADA', card2X + 3, y + 6);
        doc.setFontSize(10.5);
        doc.text(formatMoney(totalSpent), card2X + 3, y + 13);

        // Card 3: Saldo
        const card3X = card2X + cardWidth + 3;
        doc.setFillColor(240, 253, 244); // green-50
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(card3X, y, cardWidth, 18, 2, 2, 'FD');
        doc.setFontSize(7.5);
        doc.setTextColor(22, 101, 52);
        doc.text('SALDO DISPONIBLE', card3X + 3, y + 6);
        doc.setFontSize(10.5);
        doc.text(formatMoney(balance), card3X + 3, y + 13);

        y += 24;
      }

      // 2. EXPENSE REPORT TABLE
      if (reportType === 'expense_report' || reportType === 'consolidated') {
        checkPageBreak(40);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('DETALLE DE GASTOS Y COMPRAS CERTIFICADAS (SAT)', margin, y);
        y += 5;

        // Table Header
        const tableW = pageWidth - margin * 2;
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(margin, y, tableW, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');

        doc.text('Fecha', margin + 2, y + 4.5);
        doc.text('Proveedor / Empresa', margin + 20, y + 4.5);
        doc.text('NIT', margin + 65, y + 4.5);
        doc.text('No. Factura', margin + 88, y + 4.5);
        doc.text('Categoría / Concepto', margin + 112, y + 4.5);
        doc.text(`Total (${currency})`, pageWidth - margin - 2, y + 4.5, { align: 'right' });

        y += 7;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        projectExpenses.forEach((exp, idx) => {
          checkPageBreak(8);

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, tableW, 6.5, 'F');
          }

          doc.setDrawColor(241, 245, 249);
          doc.line(margin, y + 6.5, pageWidth - margin, y + 6.5);

          doc.setTextColor(51, 65, 85);
          doc.text(exp.date, margin + 2, y + 4.5);

          // Truncate supplier if too long
          const supplierClean = exp.supplier.length > 25 ? exp.supplier.substring(0, 25) + '...' : exp.supplier;
          doc.text(supplierClean, margin + 20, y + 4.5);
          doc.text(exp.nitSupplier, margin + 65, y + 4.5);
          doc.text(exp.facturaNumber, margin + 88, y + 4.5);

          const descClean = exp.description.length > 30 ? exp.description.substring(0, 30) + '...' : exp.description;
          doc.text(descClean, margin + 112, y + 4.5);

          doc.setFont('helvetica', 'bold');
          doc.text(formatMoney(exp.amount), pageWidth - margin - 2, y + 4.5, { align: 'right' });
          doc.setFont('helvetica', 'normal');

          y += 6.5;
        });

        // Table Total Summary Box
        checkPageBreak(12);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, tableW, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`TOTAL EJECUTADO (${projectExpenses.length} REGISTROS):`, margin + 2, y + 4.8);
        doc.text(formatMoney(totalSpent), pageWidth - margin - 2, y + 4.8, { align: 'right' });
        y += 12;
      }

      // 3. FIELD VISITS & FOREMAN DIGITAL SIGNATURES SECTION
      if (reportType === 'field_visits' || reportType === 'consolidated') {
        checkPageBreak(35);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('REGISTRO DE BITÁCORAS DE CAMPO & FIRMAS AUTORIZADAS', margin, y);
        y += 5;

        projectVisits.forEach((visit) => {
          checkPageBreak(22);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, pageWidth - margin * 2, 19, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`Fecha: ${visit.date} • Clima: ${visit.weather} • Obreros: ${visit.workersCount}`, margin + 3, y + 5);

          // Status stamp
          doc.setTextColor(16, 185, 129); // emerald
          doc.text(`[ ${visit.status.toUpperCase()} ]`, pageWidth - margin - 4, y + 5, { align: 'right' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);

          const notesClean = visit.notes.length > 95 ? visit.notes.substring(0, 95) + '...' : visit.notes;
          doc.text(`Novedades: "${notesClean}"`, margin + 3, y + 10);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 65, 85);
          const foremanText = `Capataz: ${visit.foremanName} • DPI: ${visit.signerDpi || '2489 10293 0101'}`;
          doc.text(foremanText, margin + 3, y + 15);

          if (visit.gpsCoords) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(100, 116, 139);
            doc.text(`GPS: ${visit.gpsCoords.lat.toFixed(4)}°N, ${visit.gpsCoords.lng.toFixed(4)}°W`, pageWidth - margin - 4, y + 15, {
              align: 'right',
            });
          }

          y += 22;
        });
      }

      // 4. OFFICIAL SIGNATURE & LEGAL AUDIT BLOCK
      checkPageBreak(38);
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      const sigWidth = (pageWidth - margin * 2 - 20) / 3;

      // Sig 1: Ing. Residente
      doc.setDrawColor(100, 116, 139);
      doc.line(margin, y + 12, margin + sigWidth, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Ing. Residente de Obra', margin + sigWidth / 2, y + 16, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Colegiado Activo No. 14,892', margin + sigWidth / 2, y + 19.5, { align: 'center' });

      // Sig 2: Capataz General
      const sig2X = margin + sigWidth + 10;
      doc.line(sig2X, y + 12, sig2X + sigWidth, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Capataz General de Campo', sig2X + sigWidth / 2, y + 16, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Supervisión y Validación en Sitio', sig2X + sigWidth / 2, y + 19.5, { align: 'center' });

      // Sig 3: Auditoria Financiera
      const sig3X = sig2X + sigWidth + 10;
      doc.line(sig3X, y + 12, sig3X + sigWidth, y + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Auditoría Financiera & SAT', sig3X + sigWidth / 2, y + 16, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Sello y Visto Bueno Oficial', sig3X + sigWidth / 2, y + 19.5, { align: 'center' });

      // Document Legal Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'ConstructERP Guatemala © Sistema Integral de Costos, Rendimientos & Bitácoras de Obra para la República de Guatemala.',
          margin,
          pageHeight - 6
        );
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
      }

      // Save PDF file
      const fileName = `Informe_${activeProject.code}_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Centro de Reportes Ejecutivos & Exportación PDF</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generación de informes formales de costos, facturación SAT, avance físico y bitácoras para auditorías y juntas directivas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export to Excel Button with Macros */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Exportar todas las bitácoras y registros de gastos a formato .xlsx profesional con macros preconfiguradas"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExportingExcel ? 'Generando .xlsx...' : 'Exportar .xlsx Contable'}
          </button>

          {/* View Preconfigured VBA Macros */}
          <button
            onClick={() => setShowMacroModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer"
            title="Ver las macros contables preconfiguradas para SAT y pólizas de diario"
          >
            <Code2 className="w-4 h-4 text-emerald-700" />
            Macros VBA
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Imprimir
          </button>

          <button
            onClick={generatePDF}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* Excel Success Notification Banner */}
      {excelSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold">¡Libro de Excel (.xlsx) generado y descargado exitosamente!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Incluye 5 hojas especializadas para auditoría fiscal SAT e IGSS: <strong>Resumen_Ejecutivo</strong>, <strong>Registro_Gastos_Contable</strong> (desglose IVA 12% SAT), <strong>Auditoria_Asistencia_SAT_IGSS</strong> (marcajes GPS, cuotas patronales y retenciones laborales), <strong>Bitacoras_Campo_Diarias</strong> (firmas de capataces) y <strong>Macros_Contabilidad_VBA</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setExcelSuccessToast(false)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filter & Configuration Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Seleccionado</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Reporte a Exportar</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
          >
            <option value="consolidated">Informe Integral Consolidado (Proyecto + Gastos + Bitácoras)</option>
            <option value="project_summary">Resumen Ejecutivo & Avances Físicos</option>
            <option value="expense_report">Reporte de Gastos, Inversión & Facturas SAT</option>
            <option value="field_visits">Bitácoras de Campo & Firmas de Capataces</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Filtro de Categoría</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-medium"
          >
            <option value="all">Todas las Categorías ({expenses.length} gastos)</option>
            <option value="Materiales (Cementos, Hierro)">Materiales (Cementos, Hierro)</option>
            <option value="Mano de Obra">Mano de Obra</option>
            <option value="Maquinaria y Combustible">Maquinaria y Combustible</option>
            <option value="Permisos & Licencias">Permisos & Licencias</option>
          </select>
        </div>
      </div>

      {/* Printable Preview Canvas / Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {activeProject.code}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {activeProject.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{activeProject.name}</h3>
            <p className="text-xs text-slate-500">
              Cliente: {activeProject.client} • {activeProject.location}, {activeProject.municipality}
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 sm:border-l sm:border-slate-100 sm:pl-6">
            <p className="font-bold text-slate-900">{company.companyName}</p>
            <p>NIT: {company.nit}</p>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              Emisión: {new Date().toLocaleDateString('es-GT')}
            </p>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-[11px] font-bold text-blue-900 uppercase">Presupuesto Autorizado</p>
            <p className="text-xl font-bold text-blue-950 mt-1">{formatMoney(totalBudget)}</p>
            <p className="text-[10px] text-blue-700 mt-0.5">Monto contractual de obra</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-[11px] font-bold text-rose-900 uppercase">Inversión Ejecutada</p>
            <p className="text-xl font-bold text-rose-950 mt-1">{formatMoney(totalSpent)}</p>
            <p className="text-[10px] text-rose-700 mt-0.5">{((totalSpent / totalBudget) * 100).toFixed(1)}% del presupuesto</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-900 uppercase">Saldo Disponible</p>
            <p className="text-xl font-bold text-emerald-950 mt-1">{formatMoney(balance)}</p>
            <p className="text-[10px] text-emerald-700 mt-0.5">Avance Físico: {activeProject.progressPercent}%</p>
          </div>
        </div>

        {/* Expenses Table Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-500" />
              Detalle de Gastos y Facturas para Auditoría
            </h4>
            <span className="text-xs text-slate-500">{projectExpenses.length} registros</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3">NIT</th>
                  <th className="py-2.5 px-3">Factura</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectExpenses.slice(0, 10).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{exp.date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{exp.supplier}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{exp.nitSupplier}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{exp.facturaNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{exp.description}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatMoney(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right">
                    Total Gastos en Este Reporte:
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-600 font-bold">{formatMoney(totalSpent)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bitácoras & Signatures Preview */}
        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Certificación de Bitácoras de Campo Firmadas ({projectVisits.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projectVisits.map((visit) => (
              <div key={visit.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{visit.date}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                    {visit.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic">"{visit.notes}"</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Capataz: <strong>{visit.foremanName}</strong></span>
                  {visit.gpsCoords && (
                    <span>GPS: {visit.gpsCoords.lat.toFixed(4)}, {visit.gpsCoords.lng.toFixed(4)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official Signatures Block Preview */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-2">
            <div className="border-b border-slate-400 w-36 mx-auto h-8" />
            <p className="font-bold text-slate-800">Ing. Residente de Obra</p>
            <p className="text-[10px] text-slate-500">Colegiado Activo No. 14,892</p>
          </div>
          <div className="space-y-2">
            <div className="border-b border-slate-400 w-36 mx-auto h-8" />
            <p className="font-bold text-slate-800">Capataz General de Campo</p>
            <p className="text-[10px] text-slate-500">Supervisión y Verificación</p>
          </div>
          <div className="space-y-2">
            <div className="border-b border-slate-400 w-36 mx-auto h-8" />
            <p className="font-bold text-slate-800">Auditoría Financiera & SAT</p>
            <p className="text-[10px] text-slate-500">Sello de Aprobación</p>
          </div>
        </div>
      </div>

      {/* Modal: Preconfigured Accounting VBA Macros */}
      {showMacroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Code2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">Macros Contables Automatizadas (Excel VBA)</h3>
                  <p className="text-xs text-slate-400">
                    Preconfiguradas para {activeProject.code} • Libro de Compras SAT, Auditoría y Póliza de Diario
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMacroModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-emerald-800 block mb-1">1. GenerarLibroComprasSAT</span>
                  <p className="text-[11px] text-slate-600">
                    Crea la hoja con formato oficial SAT separando Subtotal e IVA Crédito Fiscal (12%).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-blue-800 block mb-1">2. AuditarFacturasDuplicadas</span>
                  <p className="text-[11px] text-slate-600">
                    Escanea los NITs y números de factura, resaltando en rojo cualquier duplicidad.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-amber-800 block mb-1">3. GenerarPolizaContable</span>
                  <p className="text-[11px] text-slate-600">
                    Asiento de partida doble: Obras en Proceso + IVA Crédito contra Bancos/Cuentas por Pagar.
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Terminal className="w-4 h-4 text-blue-700" /> Cómo usar las macros en Excel:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-blue-800">
                  <li>Abra el archivo <strong>.xlsx</strong> descargado en Microsoft Excel.</li>
                  <li>Presione <kbd className="px-1.5 py-0.5 rounded bg-white font-mono shadow-2xs border border-blue-300">Alt + F11</kbd> para abrir el editor de Visual Basic.</li>
                  <li>Haga clic en <strong>Insertar &gt; Módulo</strong> y pegue el código inferior (o importe el archivo <strong>.bas</strong>).</li>
                  <li>Presione <kbd className="px-1.5 py-0.5 rounded bg-white font-mono shadow-2xs border border-blue-300">Alt + F8</kbd> en Excel para ejecutar cualquier macro con 1 clic.</li>
                </ol>
              </div>

              {/* VBA Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Código Fuente VBA (Visual Basic for Applications):</span>
                  <button
                    onClick={handleCopyVba}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    {isCopiedVba ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> ¡Código Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Código
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800 select-all leading-relaxed">
                  {GUATEMALAN_ACCOUNTING_VBA_MACROS.replace(/{PROJECT_CODE}/g, activeProject.code)
                    .replace(/{PROJECT_NAME}/g, activeProject.name)
                    .replace(/{DATE_GENERATED}/g, new Date().toLocaleString('es-GT'))}
                </pre>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => downloadVbaMacroFile(activeProject)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar Archivo .BAS
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMacroModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    handleExportExcel();
                    setShowMacroModal(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Descargar .xlsx Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
