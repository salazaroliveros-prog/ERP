'use client';

import React, { useState, useRef } from 'react';
import {
  Settings,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Building2,
  Smartphone,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CompanySettings } from '@/lib/types';
import { processLogoFile, getEffectiveCompanyName } from '@/lib/brandingService';

interface CompanyBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanySettings;
  onUpdateCompany: (updated: CompanySettings) => void;
}

export const CompanyBrandingModal: React.FC<CompanyBrandingModalProps> = ({
  isOpen,
  onClose,
  company,
  onUpdateCompany,
}) => {
  const [legalName, setLegalName] = useState(company.legalName || '');
  const [commercialName, setCommercialName] = useState(company.commercialName || '');
  const [headerTitle, setHeaderTitle] = useState(company.headerTitle || company.commercialName || '');
  const [nit, setNit] = useState(company.nit || '');
  const [architectName, setArchitectName] = useState(company.architectName || '');
  const [architectColNumber, setArchitectColNumber] = useState(company.architectColNumber || '');
  const [address, setAddress] = useState(company.address || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [exchangeRate, setExchangeRate] = useState(company.exchangeRate?.toString() || '7.82');

  // Logotipo state
  const [logoUrl, setLogoUrl] = useState<string | undefined>(company.logoUrl);
  const [logoType, setLogoType] = useState<'image/png' | 'image/jpeg' | undefined>(company.logoType);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setUploadSuccess(null);
    setIsProcessingLogo(true);

    try {
      const processed = await processLogoFile(file);
      setLogoUrl(processed.dataUrl);
      setLogoType(processed.mimeType);
      setUploadSuccess(`Logotipo (${processed.mimeType === 'image/png' ? 'PNG' : 'JPEG'}) procesado correctamente.`);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Error al procesar el archivo.');
    } finally {
      setIsProcessingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
    setLogoType(undefined);
    setUploadSuccess(null);
    setLogoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanySettings = {
      ...company,
      legalName: legalName.trim(),
      commercialName: commercialName.trim(),
      headerTitle: headerTitle.trim() || commercialName.trim(),
      companyName: headerTitle.trim() || commercialName.trim(),
      nit: nit.trim(),
      architectName: architectName.trim(),
      architectColNumber: architectColNumber.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      exchangeRate: Number(exchangeRate) || 7.82,
      logoUrl: logoUrl,
      logoType: logoType,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCompany(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Identidad de Empresa & Logotipo</h3>
              <p className="text-xs text-slate-400">Personaliza el logotipo e ícono oficial para cualquier empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* ================= SECCIÓN 1: SUBIR LOGOTIPO PNG / JPEG ================= */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  Logotipo Oficial de la Empresa
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos soportados: <span className="font-semibold text-sky-300">PNG</span> (con o sin transparencia) y{' '}
                  <span className="font-semibold text-sky-300">JPEG / JPG</span>.
                </p>
              </div>

              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Quitar Logo
                </button>
              )}
            </div>

            {/* Logo Preview & Upload Zone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Preview Box */}
              <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center min-h-[140px]">
                {logoUrl ? (
                  <div className="relative group flex flex-col items-center gap-2">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950/80 p-2 flex items-center justify-center border border-white/10 shadow-inner">
                      {/* eslint-disable-next-js-next-image */}
                      <img
                        src={logoUrl}
                        alt="Logotipo Empresa"
                        className="max-w-full max-h-full object-contain drop-shadow"
                      />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {logoType?.toUpperCase() || 'IMAGEN'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500 py-3">
                    <ImageIcon className="w-10 h-10 stroke-1 mb-2 text-slate-600" />
                    <span className="text-xs font-medium">Sin logotipo</span>
                    <span className="text-[10px] text-slate-600">Usando icono base</span>
                  </div>
                )}
              </div>

              {/* Upload Drop Area */}
              <div className="sm:col-span-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-file-input"
                />
                <label
                  htmlFor="logo-file-input"
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    isProcessingLogo
                      ? 'border-sky-500 bg-sky-500/5'
                      : 'border-slate-700 hover:border-sky-400 bg-slate-900/50 hover:bg-slate-900'
                  }`}
                >
                  <Upload className="w-6 h-6 text-sky-400 mb-2" />
                  <span className="text-xs font-bold text-white">
                    {isProcessingLogo ? 'Procesando logotipo...' : 'Haz clic para seleccionar o arrastra tu logo'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Archivos .PNG o .JPG (Recomendado 512x512 px)
                  </span>
                </label>

                {logoError && (
                  <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{logoError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notification explaining automatic PWA and report inclusion */}
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Impacto Automático en Dispositivos y Reportes</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-white">Ícono de Instalación:</strong> La imagen se configurará dinámicamente como el ícono oficial de la aplicación al instalarla en teléfonos Android, iPhone / iPad y computadoras.
                </li>
                <li>
                  <strong className="text-white">Pantallas del Sistema:</strong> Aparecerá en la barra lateral fija, menú móvil y barra superior.
                </li>
                <li>
                  <strong className="text-white">Informes Oficiales:</strong> Se incrustará en el encabezado de las descargas en PDF, impresiones de planillas, presupuestos y bitácoras.
                </li>
              </ul>
            </div>
          </div>

          {/* ================= SECCIÓN 2: ENCABEZADO Y NOMBRES DE EMPRESA ================= */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nombres de la Empresa & Encabezado Global
            </h4>

            {/* Custom Header Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre / Título de Encabezado Principal
                <span className="text-[11px] font-normal text-slate-400 ml-2">
                  (Se muestra en barra de título, barra de navegación y portadas)
                </span>
              </label>
              <input
                type="text"
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                placeholder="Ej. Morales Proyectos & Obras Civiles, S.A."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  placeholder="Ej. Morales Construcciones"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razón Social (Legal)
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Ej. Inversiones Morales & Cía, S.A."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NIT Empresa (SAT Guatemala)
                </label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="Ej. 1049281-2"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Cambio Bancario (Q por 1 USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Arquitecto / Ingeniero Residente
                </label>
                <input
                  type="text"
                  value={architectName}
                  onChange={(e) => setArchitectName(e.target.value)}
                  placeholder="Ej. Arq. Carlos Mendoza"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  No. Colegiado (CIG / Colegio Arquitectos)
                </label>
                <input
                  type="text"
                  value={architectColNumber}
                  onChange={(e) => setArchitectColNumber(e.target.value)}
                  placeholder="Ej. CIG-14520"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección Sede
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Zona 10, Ciudad de Guatemala"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +502 2233-4455"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 text-center sm:text-left">
              Los cambios se sincronizan en la aplicación, reportes e instalación PWA.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/25 transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar y Aplicar Marca
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
