export type ShareResult = 'shared' | 'cancelled' | 'copied' | 'manual';

/** Menú nativo en táctil; si no, portapapeles; si tampoco, devuelve 'manual'. */
export async function shareText(text: string): Promise<ShareResult> {
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (touch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}
