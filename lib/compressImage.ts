/** Client-side resize/compress so multi-photo uploads stay under Next.js/Vercel body limits. */

const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Compress an image File to a JPEG/PNG data URL.
 * Falls back to the original data URL if canvas processing fails (e.g. HEIC).
 */
export async function compressImageFile(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY
): Promise<{ data: string; filename: string }> {
  const originalName = file.name || 'image.jpg';
  const fallbackName = originalName.replace(/\.[^.]+$/, '') + '.jpg';

  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await loadImage(dataUrl);

    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) {
      return { data: dataUrl, filename: originalName };
    }

    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    // Already small enough and under ~1.2MB — skip re-encode
    if (scale === 1 && file.size < 1_200_000 && file.type === 'image/jpeg') {
      return { data: dataUrl, filename: originalName };
    }

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { data: dataUrl, filename: originalName };
    }

    ctx.drawImage(img, 0, 0, tw, th);

    const preferPng = file.type === 'image/png' && file.size < 800_000;
    const mime = preferPng ? 'image/png' : 'image/jpeg';
    const compressed = canvas.toDataURL(mime, preferPng ? undefined : quality);

    return {
      data: compressed,
      filename: preferPng ? originalName : fallbackName,
    };
  } catch {
    // HEIC / unsupported — send original base64
    const data = await readAsDataUrl(file);
    return { data, filename: originalName };
  }
}

export async function filesToCompressedBase64(
  files: File[]
): Promise<{ data: string; filename: string }[]> {
  const results: { data: string; filename: string }[] = [];
  for (const file of files) {
    results.push(await compressImageFile(file));
  }
  return results;
}
