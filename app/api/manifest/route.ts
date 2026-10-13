import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'ConstructERP Guatemala - Control de Obras';
  const shortName = searchParams.get('shortName') || 'ConstructERP';
  const icon = searchParams.get('icon') || '/assets/icon-192.png';

  const manifest = {
    name: name,
    short_name: shortName,
    description: 'ERP integral para control de obras, presupuestos APU, planillas y firma digital de capataces.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#0284c7',
    orientation: 'portrait-primary',
    icons: [
      {
        src: icon,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: icon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
