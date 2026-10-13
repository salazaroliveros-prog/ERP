import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConstructERP Guatemala - Control de Obras y Firma Digital',
  description: 'ERP integral para arquitectos y constructoras en Guatemala: control de obras, presupuestos APU, planillas y firma digital de capataces.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/assets/icon-192.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen text-slate-100 antialiased selection:bg-sky-400 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
