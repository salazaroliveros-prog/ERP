import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'ConstructERP Guatemala - Control de Obras';
  const shortName = searchParams.get('shortName') || 'ConstructERP';
  const icon192 = searchParams.get('icon192') || '/icons/logo-192x192.png';
  const icon512 = searchParams.get('icon512') || '/icons/logo-512x512.png';

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
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
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
