import { CompanySettings } from './types';

const STORAGE_KEY = 'constructerp_company_branding';

/**
 * Obtiene el nombre principal visible de la empresa dando prioridad al
 * título de encabezado configurado, nombre comercial, razón social o alias.
 */
export function getEffectiveCompanyName(company?: Partial<CompanySettings> | null): string {
  if (!company) return 'ConstructERP Guatemala';
  return (
    company.headerTitle?.trim() ||
    company.commercialName?.trim() ||
    company.companyName?.trim() ||
    company.legalName?.trim() ||
    'ConstructERP Guatemala'
  );
}

/**
 * Procesa un archivo de imagen subido por el usuario.
 * Valida estrictamente formato PNG o JPEG.
 * Utiliza un Canvas para normalizar el tamaño (hasta 512x512 píxeles) preservando
 * nitidez y transparencia para PNG o fondo blanco para JPEG.
 */
export async function processLogoFile(file: File): Promise<{
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
}> {
  // Validar formato
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Formato de imagen inválido. Solo se admiten archivos en formato PNG o JPEG/JPG.');
  }

  const isPng = file.type.toLowerCase().includes('png');
  const targetMime: 'image/png' | 'image/jpeg' = isPng ? 'image/png' : 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de logotipo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen del logotipo.'));
      img.onload = () => {
        try {
          // Normalizar dimensiones cuadradas hasta 512x512
          const targetSize = 512;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              dataUrl: reader.result as string,
              mimeType: targetMime,
              width: img.width,
              height: img.height,
            });
            return;
          }

          // Para JPEG, pintar fondo blanco limpio; para PNG mantener transparencia
          if (!isPng) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetSize, targetSize);
          }

          // Calcular escalado manteniendo proporción centrado
          const scale = Math.min(targetSize / img.width, targetSize / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const offsetX = (targetSize - drawW) / 2;
          const offsetY = (targetSize - drawH) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

          const finalDataUrl = canvas.toDataURL(targetMime, isPng ? 0.95 : 0.9);
          resolve({
            dataUrl: finalDataUrl,
            mimeType: targetMime,
            width: targetSize,
            height: targetSize,
          });
        } catch {
          // Si falla canvas, retornar data URL original
          resolve({
            dataUrl: reader.result as string,
            mimeType: targetMime,
            width: img.width,
            height: img.height,
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Guarda las configuraciones de empresa y logotipo en LocalStorage.
 */
export function saveCompanyBrandingLocal(company: CompanySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
  } catch (e) {
    console.warn('No se pudo guardar la marca de empresa en LocalStorage:', e);
  }
}

/**
 * Carga las configuraciones de empresa y logotipo desde LocalStorage.
 */
export function loadSavedCompanyBranding(): CompanySettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanySettings;
  } catch (e) {
    console.warn('Error al leer marca de empresa desde LocalStorage:', e);
    return null;
  }
}

/**
 * Aplica activamente la marca, logotipo y encabezado en el DOM:
 * 1. Título de la pestaña del navegador (document.title).
 * 2. Favicon (link[rel="icon"], link[rel="shortcut icon"]).
 * 3. Icono de pantalla de inicio Apple / iOS (link[rel="apple-touch-icon"]).
 * 4. PWA Web App Manifest dinámico generado en Blob para que la app
 *    se instale con este logotipo e icono en Android, Windows, Mac o iOS.
 */
export function applyCompanyBrandingToDOM(company: CompanySettings): void {
  if (typeof document === 'undefined') return;

  const companyName = getEffectiveCompanyName(company);

  // 1. Actualizar título de la ventana
  document.title = `${companyName} - Control de Obras y Bitácoras`;

  // 2. Si hay logotipo, actualizar favicon e iconos de instalación de dispositivos
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    const logoUrl = company.logoUrl;

    // Actualizar / crear link favicon
    const updateOrCreateLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    updateOrCreateLink('icon', logoUrl);
    updateOrCreateLink('shortcut icon', logoUrl);
    updateOrCreateLink('apple-touch-icon', logoUrl);
    updateOrCreateLink('apple-touch-icon-precomposed', logoUrl);

    // 3. Generar y enlazar Web App Manifest dinámico en Blob
    try {
      const dynamicManifest = {
        name: `${companyName} - ConstructERP Guatemala`,
        short_name: companyName.slice(0, 20),
        description: `Sistema ERP de control de obras, presupuestos APU y bitácoras para ${companyName}.`,
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: company.primaryColor || '#0284c7',
        icons: [
          {
            src: logoUrl,
            sizes: '192x192',
            type: company.logoType || 'image/png',
            purpose: 'any',
          },
          {
            src: logoUrl,
            sizes: '512x512',
            type: company.logoType || 'image/png',
            purpose: 'any maskable',
          },
        ],
      };

      const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
        type: 'application/manifest+json',
      });
      const manifestBlobUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestBlobUrl;
    } catch (manifestErr) {
      console.warn('Error al inyectar manifest dinámico:', manifestErr);
    }
  }
}
