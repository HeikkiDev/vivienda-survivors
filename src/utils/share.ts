export type ShareResult = 'shared' | 'cancelled' | 'imageCopied' | 'imageDownloaded' | 'copied' | 'manual';

export interface SharePayload {
  text: string;
  /** Imagen del resultado; se pide como promesa para crear el ClipboardItem dentro del gesto (Safari). */
  image: Promise<Blob | null> | null;
  fileName: string;
  mimeType: string;
}

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

/**
 * Táctil: menú nativo con imagen (o solo texto).
 * Escritorio: imagen al portapapeles; si no se puede, se descarga.
 * Sin imagen: texto al portapapeles; si no se puede, 'manual'.
 */
export async function shareResult({ text, image, fileName, mimeType }: SharePayload): Promise<ShareResult> {
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

  if (image && !touch && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [mimeType]: image.then((b) => b ?? Promise.reject(new Error('no image'))) }),
      ]);
      return 'imageCopied';
    } catch {
      // Sin permiso (p. ej. iframe) o navegador sin soporte: se descarga.
    }
  }

  const blob = image ? await image : null;

  if (touch && typeof navigator.share === 'function') {
    const file = blob ? new File([blob], fileName, { type: blob.type }) : null;
    const data: ShareData = file && navigator.canShare?.({ files: [file] }) ? { files: [file], text } : { text };
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
    }
  }

  if (blob && !touch) {
    downloadBlob(blob, fileName);
    return 'imageDownloaded';
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
