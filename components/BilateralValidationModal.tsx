'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Play,
  ArrowRightLeft,
  Server,
  HardDrive,
  ShieldCheck,
  Building,
  MapPin,
  DollarSign,
  Layers,
  X,
  FileCode2,
  Terminal,
} from 'lucide-react';
import { Project } from '@/lib/types';
import {
  REAL_PROJECT_1,
  REAL_PROJECT_2,
  REAL_PROJECT_1_MODIFIED,
  REAL_PROJECT_2_MODIFIED,
  runProjectBilateralValidation,
  ValidationLogItem,
  ValidationReport,
} from '@/lib/projectValidationScript';
import {
  getLocalProjects,
  deleteLocalProject,
  saveLocalProject,
} from '@/lib/offlineStorage';
import { deleteProjectFromFirestore, saveProjectToFirestore, auth } from '@/lib/firebaseService';

interface BilateralValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectsUpdated?: (projects: Project[]) => void;
  userId?: string;
}

export const BilateralValidationModal: React.FC<BilateralValidationModalProps> = ({
  isOpen,
  onClose,
  onProjectsUpdated,
  userId,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepName, setCurrentStepName] = useState('Listo para iniciar');
  const [logs, setLogs] = useState<ValidationLogItem[]>([]);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [cleanupMode, setCleanupMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'projects' | 'report'>('terminal');

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleStartValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setReport(null);
    setCurrentStepName('Inicializando...');

    try {
      const result = await runProjectBilateralValidation({
        cleanup: cleanupMode,
        userId: userId || auth.currentUser?.uid,
        onLog: (log) => {
          setLogs((prev) => [...prev, log]);
        },
        onProgress: (percent, stepName) => {
          setProgress(percent);
          setCurrentStepName(stepName);
        },
        onStateUpdate: (updatedList) => {
          if (onProjectsUpdated) {
            onProjectsUpdated(updatedList);
          }
        },
      });

      setReport(result);
      if (onProjectsUpdated) {
        onProjectsUpdated(getLocalProjects());
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('es-GT', { hour12: false }),
          level: 'error',
          tag: 'SUMMARY',
          message: `Excepción crítica durante la ejecución: ${err?.message || err}`,
        },
      ]);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const handleManualPurgeTestProjects = async () => {
    if (
      !window.confirm(
        '¿Desea eliminar los dos proyectos de prueba (Zona 14 y Escuintla) tanto de la DB Local como de Firebase Firestore?'
      )
    ) {
      return;
    }

    try {
      deleteLocalProject(REAL_PROJECT_1.id);
      deleteLocalProject(REAL_PROJECT_2.id);
      await deleteProjectFromFirestore(REAL_PROJECT_1.id);
      await deleteProjectFromFirestore(REAL_PROJECT_2.id);

      const refreshed = getLocalProjects();
      if (onProjectsUpdated) {
        onProjectsUpdated(refreshed);
      }

      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('es-GT', { hour12: false }),
          level: 'info',
          tag: 'LOCAL_DB',
          message: 'Purga manual completada: Proyectos eliminados de LocalStorage y Firestore.',
        },
      ]);
    } catch (e: any) {
      alert(`Error al purgar: ${e?.message || e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ArrowRightLeft className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Validador Bilateral de Flujos y Bases de Datos
                </h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Local DB ⇄ Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verifica inserción, lectura, modificación y eliminación bilateral en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas resumen de los dos proyectos reales */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white truncate">{REAL_PROJECT_1.name}</span>
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50">
                  {REAL_PROJECT_1.code}
                </span>
              </div>
              <p className="text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                {REAL_PROJECT_1.location}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-300">
                <span className="font-mono text-emerald-400 font-semibold">
                  Q {REAL_PROJECT_1.budgetTotal.toLocaleString()}
                </span>
                <span>Avance: {REAL_PROJECT_1.progressPercent}%</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white truncate">{REAL_PROJECT_2.name}</span>
                <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50">
                  {REAL_PROJECT_2.code}
                </span>
              </div>
              <p className="text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                {REAL_PROJECT_2.location}
              </p>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-300">
                <span className="font-mono text-emerald-400 font-semibold">
                  Q {REAL_PROJECT_2.budgetTotal.toLocaleString()}
                </span>
                <span>Avance: {REAL_PROJECT_2.progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Controles y Acciones */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={cleanupMode}
                onChange={(e) => setCleanupMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <span>
                {cleanupMode ? (
                  <strong className="text-amber-400">Modo Ciclo Completo con Purga (Crear → Modificar → Eliminar)</strong>
                ) : (
                  <strong className="text-emerald-400">Modo Carga Permanente (Crear → Modificar → Conservar en Sistema)</strong>
                )}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualPurgeTestProjects}
              disabled={isRunning}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purgar Proyectos de Prueba
            </button>

            <button
              onClick={handleStartValidation}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ejecutando Validación...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Iniciar Validación Bilateral
                </>
              )}
            </button>
          </div>
        </div>

        {/* Barra de progreso interactiva */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5 text-slate-400">
            <span className="font-medium text-slate-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Paso: <span className="text-white font-semibold">{currentStepName}</span>
            </span>
            <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pestañas de la consola / resultados */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'terminal'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Consola de Auditoría en Vivo
            {logs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {logs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'report'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Matriz de Paridad Bilateral
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs">
          {activeTab === 'terminal' && (
            <div className="space-y-1.5 min-h-[220px]">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2 font-sans">
                  <Database className="w-8 h-8 text-slate-600 mb-1" />
                  <p>Presione &ldquo;Iniciar Validación Bilateral&rdquo; para ejecutar el ciclo de pruebas.</p>
                  <p className="text-xs text-slate-600">
                    También puede ejecutar en la consola de Chrome/DevTools (F12):{' '}
                    <code className="text-indigo-400 bg-slate-900 px-2 py-0.5 rounded font-mono">
                      window.runProjectBilateralValidation()
                    </code>
                  </p>
                </div>
              ) : (
                logs.map((log, index) => {
                  let tagBg = 'bg-slate-800 text-slate-300';
                  if (log.tag === 'LOCAL_DB') tagBg = 'bg-cyan-950 text-cyan-300 border border-cyan-800/60';
                  if (log.tag === 'FIREBASE_REMOTE') tagBg = 'bg-amber-950 text-amber-300 border border-amber-800/60';
                  if (log.tag === 'BILATERAL') tagBg = 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';
                  if (log.tag === 'ROUTING') tagBg = 'bg-purple-950 text-purple-300 border border-purple-800/60';
                  if (log.tag === 'SUMMARY') tagBg = 'bg-indigo-950 text-indigo-300 border border-indigo-800/60';

                  let textClass = 'text-slate-300';
                  if (log.level === 'success') textClass = 'text-emerald-400';
                  if (log.level === 'warning') textClass = 'text-amber-400';
                  if (log.level === 'error') textClass = 'text-rose-400 font-bold';

                  return (
                    <div key={index} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${tagBg}`}>
                        {log.tag}
                      </span>
                      <span className={`${textClass} break-words flex-1`}>{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="font-sans space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 mb-1">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">DB Local (LocalStorage)</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {report?.steps.filter((s) => s.localSuccess).length || 0} / {report?.steps.length || 4}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Operaciones validadas localmente</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <Server className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">DB Remota (Cloud Firestore)</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {report?.steps.filter((s) => s.remoteSuccess).length || 0} / {report?.steps.length || 4}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Operaciones sincronizadas en la nube</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Paridad Bilateral</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {report?.success ? '100%' : 'Listo'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Consistencia de datos y atributos</p>
                </div>
              </div>

              {/* Matriz de pasos */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Operación</th>
                      <th className="py-2.5 px-4">Descripción</th>
                      <th className="py-2.5 px-4 text-center">DB Local</th>
                      <th className="py-2.5 px-4 text-center">Cloud Firestore</th>
                      <th className="py-2.5 px-4 text-center">Paridad Bilateral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {report ? (
                      report.steps.map((step, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-white">{step.step}</td>
                          <td className="py-3 px-4 text-slate-300">{step.description}</td>
                          <td className="py-3 px-4 text-center">
                            {step.localSuccess ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> OK
                              </span>
                            ) : (
                              <span className="text-rose-400">Fallo</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {step.remoteSuccess ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-4 h-4" /> En cola
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {step.bilateralConsistent ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-4 h-4" /> 100% Coincidente
                              </span>
                            ) : (
                              <span className="text-amber-400">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Ejecute la validación para visualizar la matriz de paridad.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enrutamiento de flujos bilateral activo: Local ⇄ Firestore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
