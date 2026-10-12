// Experiencia móvil: overlay de orientación, reescalado, pantalla completa y aviso de iOS.
import Phaser from 'phaser';
import { MOBILE } from './config';
import { TEXTS } from './texts';

const OVERLAY_ID = 'rotate-overlay';

/** Pausa las escenas en marcha mientras el móvil está en vertical y las reanuda al volver a horizontal. */
export function setupMobile(game: Phaser.Game): void {
  const portrait = window.matchMedia(MOBILE.portraitQuery);
  const overlay = document.getElementById(OVERLAY_ID);
  const pausedByOrientation = new Set<string>();

  // Se ejecuta en cada frame mientras se está en vertical, para cubrir también escenas que arranquen después.
  const pauseRunningScenes = (): void => {
    for (const scene of game.scene.getScenes(true)) {
      scene.scene.pause();
      pausedByOrientation.add(scene.scene.key);
    }
  };

  const resumePausedScenes = (): void => {
    for (const key of pausedByOrientation) {
      if (game.scene.isPaused(key)) game.scene.resume(key);
    }
    pausedByOrientation.clear();
  };

  let blocked = false;
  const applyOrientation = (): void => {
    const isPortrait = portrait.matches;
    if (overlay) {
      overlay.textContent = TEXTS.mobile.rotate;
      overlay.hidden = !isPortrait;
    }
    if (isPortrait && !blocked) {
      blocked = true;
      game.events.on(Phaser.Core.Events.POST_STEP, pauseRunningScenes);
      pauseRunningScenes();
    } else if (!isPortrait && blocked) {
      blocked = false;
      game.events.off(Phaser.Core.Events.POST_STEP, pauseRunningScenes);
      resumePausedScenes();
    }
  };

  // Algunos navegadores móviles informan del tamaño nuevo con retraso tras girar.
  let rescaleTimer: number | undefined;
  const rescale = (): void => {
    game.scale.refresh();
    window.clearTimeout(rescaleTimer);
    rescaleTimer = window.setTimeout(() => game.scale.refresh(), MOBILE.rescaleDelayMs);
  };

  const onViewportChange = (): void => {
    rescale();
    applyOrientation();
  };

  portrait.addEventListener('change', applyOrientation);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
  window.visualViewport?.addEventListener('resize', onViewportChange);

  game.events.once(Phaser.Core.Events.READY, onViewportChange);
  applyOrientation();
}

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

/** Pantalla completa + bloqueo en horizontal. Falla en silencio si el navegador no lo soporta (p. ej. iOS). */
export async function enterFullscreenLandscape(): Promise<void> {
  const root = document.documentElement;
  if (typeof root.requestFullscreen !== 'function') return;
  try {
    if (!document.fullscreenElement) await root.requestFullscreen();
    await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape');
  } catch {
    // No soportado o denegado: se sigue jugando sin pantalla completa/bloqueo.
  }
}

/** iOS en el navegador (Safari, Chrome…), no instalado en la pantalla de inicio. */
export function shouldShowIOSInstallHint(): boolean {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > MOBILE.iosTouchPoints);
  if (!isIOS) return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = nav.standalone === true || window.matchMedia(MOBILE.standaloneQuery).matches;
  return !standalone;
}
