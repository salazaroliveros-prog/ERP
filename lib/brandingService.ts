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
 * Genera múltiples tamaños: 192x192, 512x512 (normal y maskable).
 */
export async function processLogoFile(file: File): Promise<{
  dataUrl192: string;
  dataUrl512: string;
  dataUrl192Maskable: string;
  dataUrl512Maskable: string;
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
          // Función para generar icono a un tamaño específico
          const generateIcon = (size: number, isMaskable: boolean) => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (!ctx) return null;

            // Para maskable: fondo seguro, para normal: transparencia (PNG) o blanco (JPEG)
            if (isMaskable) {
              // Safe zone para maskable: 40% del centro (60% padding)
              ctx.fillStyle = isPng ? 'rgba(0,0,0,0)' : '#ffffff';
            } else if (!isPng) {
              ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(0, 0, size, size);

            // Calcular escalado manteniendo proporción centrado
            const scale = Math.min(size / img.width, size / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const offsetX = (size - drawW) / 2;
            const offsetY = (size - drawH) / 2;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

            return canvas.toDataURL(targetMime, isPng ? 0.95 : 0.9);
          };

          const dataUrl192 = generateIcon(192, false);
          const dataUrl512 = generateIcon(512, false);
          const dataUrl192Maskable = generateIcon(192, true);
          const dataUrl512Maskable = generateIcon(512, true);

          // Log del logotipo subido
          const uploadLog = {
            timestamp: new Date().toISOString(),
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            processedMimeType: targetMime,
            originalDimensions: `${img.width}x${img.height}`,
            processedSizes: ['192x192', '512x512', '192x192-maskable', '512x512-maskable'],
          };
          console.log('[ConstructERP] Logotipo subido y procesado:', uploadLog);
          
          // Guardar log en localStorage para auditoría
          if (typeof window !== 'undefined') {
            try {
              const logs = JSON.parse(localStorage.getItem('constructerp_logo_upload_logs') || '[]');
              logs.unshift(uploadLog);
              // Mantener solo los últimos 50 logs
              localStorage.setItem('constructerp_logo_upload_logs', JSON.stringify(logs.slice(0, 50)));
            } catch (e) {
              console.warn('No se pudo guardar log de subida de logotipo:', e);
            }
          }

          resolve({
            dataUrl192: dataUrl192 || (reader.result as string),
            dataUrl512: dataUrl512 || (reader.result as string),
            dataUrl192Maskable: dataUrl192Maskable || (reader.result as string),
            dataUrl512Maskable: dataUrl512Maskable || (reader.result as string),
            mimeType: targetMime,
            width: 512,
            height: 512,
          });
        } catch {
          // Si falla canvas, retornar data URL original
          resolve({
            dataUrl192: reader.result as string,
            dataUrl512: reader.result as string,
            dataUrl192Maskable: reader.result as string,
            dataUrl512Maskable: reader.result as string,
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
 * Obtiene el historial de subidas de logotipos para auditoría.
 */
export function getLogoUploadLogs(): Array<{
  timestamp: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  processedMimeType: string;
  originalDimensions: string;
  processedSizes: string[];
}> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('constructerp_logo_upload_logs') || '[]');
  } catch {
    return [];
  }
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
 *    Incluye versiones normales y maskable en 192x192 y 512x512.
 */
export function applyCompanyBrandingToDOM(company: CompanySettings): void {
  if (typeof document === 'undefined') return;

  const companyName = getEffectiveCompanyName(company);

  // 1. Actualizar título de la ventana
  document.title = `${companyName} - Control de Obras y Bitácoras`;

  // 2. Si hay logotipo, actualizar favicon e iconos de instalación de dispositivos
  if (company.logoUrl && company.logoUrl.startsWith('data:image')) {
    const logoUrl192 = company.logoUrl; // Usar la versión 192 para favicon
    const logoUrl512 = company.logoUrl; // Usar la versión 512 para manifest
    const logoType = company.logoType || 'image/png';

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

    updateOrCreateLink('icon', logoUrl192);
    updateOrCreateLink('shortcut icon', logoUrl192);
    updateOrCreateLink('apple-touch-icon', logoUrl192);
    updateOrCreateLink('apple-touch-icon-precomposed', logoUrl192);

    // 3. Generar y enlazar Web App Manifest dinámico en Blob con iconos maskable
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
            src: logoUrl192,
            sizes: '192x192',
            type: logoType,
            purpose: 'any',
          },
          {
            src: logoUrl512,
            sizes: '512x512',
            type: logoType,
            purpose: 'any maskable',
          },
          {
            src: logoUrl192,
            sizes: '192x192',
            type: logoType,
            purpose: 'maskable',
          },
          {
            src: logoUrl512,
            sizes: '512x512',
            type: logoType,
            purpose: 'maskable',
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
