import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-100 p-4">
      <div className="text-center space-y-4 max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
        <h2 className="text-4xl font-extrabold text-amber-400">404</h2>
        <h3 className="text-xl font-bold text-white">Página No Encontrada</h3>
        <p className="text-sm text-slate-300">
          La ruta solicitada no existe o no está disponible en ConstructERP Guatemala.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-sm"
          >
            Regresar al Tablero de Control
          </Link>
        </div>
      </div>
    </div>
  );
}
