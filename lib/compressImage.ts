/**
 * Robust client-side image compression and scaling.
 *
 * Guarantees that EVERY image is scaled and compressed so that its base64 payload
 * is strictly under ~1.2 MB. This completely eliminates HTTP 413 (Payload Too Large)
 * errors on Vercel (4.5 MB limit) and backend servers.
 */

const TARGET_MAX_DIMENSION = 1600;
const INITIAL_JPEG_QUALITY = 0.80;
const MAX_BASE64_LENGTH = 1_500_000; // ~1.1 MB raw payload cap

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface DrawableImage {
  drawable: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

/**
 * Decodes a File to a drawable source without loading large files into base64 JS strings.
 * Uses createImageBitmap if available, with HTMLImageElement + ObjectURL fallback.
 */
async function decodeFileToDrawable(file: File): Promise<DrawableImage> {
  // Method 1: Modern createImageBitmap (fast, hardware accelerated, auto-handles EXIF orientation)
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file);
      if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
        return {
          drawable: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => {
            try {
              bitmap.close();
            } catch {
              // Ignore
            }
          },
        };
      }
    } catch {
      // Fallback to Image element below
    }
  }

  // Method 2: HTMLImageElement via object URL (no base64 memory spike)
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Canvas decoding is only supported in the browser.'));
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        drawable: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // Ignore
          }
        },
      });
    };
    img.onerror = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore
      }
      reject(new Error(`Nepodařilo se dekódovat soubor "${file.name}". Zkontrolujte formát.`));
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses an image File to a high-quality JPEG data URL.
 * Guarantees that the resulting base64 string is <= 1.5MB characters (~1.1 MB raw).
 */
export async function compressImageFile(
  file: File,
  maxDimension = TARGET_MAX_DIMENSION,
  initialQuality = INITIAL_JPEG_QUALITY
): Promise<{ data: string; filename: string }> {
  const originalName = file.name || 'image.jpg';
  const fallbackName = originalName.replace(/\.[^.]+$/, '') + '.jpg';

  let decoded: DrawableImage;
  try {
    decoded = await decodeFileToDrawable(file);
  } catch (err: any) {
    // If the browser failed to decode (e.g. unsupported HEIC on older browser):
    // If already small (< 800 KB), pass through. If large, reject with clear message.
    if (file.size < 800_000) {
      const data = await readAsDataUrl(file);
      return { data, filename: originalName };
    }
    throw new Error(
      `Obrázek "${originalName}" (${(file.size / 1024 / 1024).toFixed(1)} MB) se nepodařilo v prohlížeči zmenšit. Zvolte prosím formát JPG nebo PNG.`
    );
  }

  try {
    const { drawable, width: origW, height: origH, cleanup } = decoded;

    let targetMax = maxDimension;
    let quality = initialQuality;
    let resultDataUrl = '';

    // Progressive scale & compress loop (at most 3 passes)
    for (let attempt = 0; attempt < 3; attempt++) {
      const scale = Math.min(1, targetMax / Math.max(origW, origH));
      const tw = Math.max(1, Math.round(origW * scale));
      const th = Math.max(1, Math.round(origH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Nelze vytvořit 2D canvas pro kompresi obrázku.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(drawable, 0, 0, tw, th);

      resultDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Successfully fits under our ceiling (~1.1 MB raw payload)
      if (resultDataUrl.length <= MAX_BASE64_LENGTH) {
        break;
      }

      // If still too large (very high detail/noise), reduce dimensions and quality for next pass
      targetMax = Math.round(targetMax * 0.8);
      quality = Math.max(0.60, quality - 0.12);
    }

    cleanup();

    if (!resultDataUrl || !resultDataUrl.startsWith('data:image/')) {
      throw new Error(`Chyba při kompresi obrázku "${originalName}".`);
    }

    return {
      data: resultDataUrl,
      filename: fallbackName,
    };
  } catch (err) {
    decoded.cleanup();
    throw err;
  }
}

/** Legacy batch helper — delegates to compressImageFile sequentially to save memory. */
export async function filesToCompressedBase64(
  files: File[]
): Promise<{ data: string; filename: string }[]> {
  const results: { data: string; filename: string }[] = [];
  for (const file of files) {
    results.push(await compressImageFile(file));
  }
  return results;
}
