// Anuncios de Google AdSense (H5 Games Ads, API adBreak) y consentimiento (CMP de Google). Ver README.
// Sin ADS.publisherId no se carga nada y todas las funciones siguen sin anuncio.
import Phaser from 'phaser';
import { ADS, MS_PER_SECOND } from '../config';
import { AudioManager } from './AudioManager';

/** Estado final de un adBreak (`placementInfo.breakStatus`). */
type BreakStatus =
  | 'notReady'
  | 'timeout'
  | 'error'
  | 'noAdPreloaded'
  | 'frequencyCapped'
  | 'ignored'
  | 'other'
  | 'dismissed'
  | 'viewed';

interface PlacementInfo {
  breakType?: string;
  breakName?: string;
  breakFormat?: string;
  breakStatus?: BreakStatus;
}

interface AdBreakParams {
  type: 'next' | 'reward';
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
  beforeReward?: (showAdFn: () => void) => void;
  adDismissed?: () => void;
  adViewed?: () => void;
  adBreakDone?: (placementInfo: PlacementInfo) => void;
}

interface AdConfigParams {
  sound?: 'on' | 'off';
  preloadAdBreaks?: 'on' | 'auto';
  onReady?: () => void;
}

type FcCallback = (() => void) | Record<string, () => void>;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: (params: AdBreakParams) => void;
    adConfig?: (params: AdConfigParams) => void;
    googlefc?: { callbackQueue?: FcCallback[]; showRevocationMessage?: () => void };
  }
}

/** Callbacks de la oferta de anuncio con recompensa. */
export interface RewardOffer {
  /** Hay un anuncio listo: muestra el botón; `watch()` (dentro del gesto del usuario) lo reproduce. */
  onOffer: (watch: () => void) => void;
  /** Fin de la oferta: `viewed` solo si el anuncio se vio entero. No se llama tras `cancel()`. */
  onDone: (viewed: boolean) => void;
}

const PUBLISHER_ID_PATTERN = /^(?:ca-)?pub-\d+$/;
const BREAK_NAMES = { next: 'nueva-partida', reward: 'revivir' } as const;
const FC_PRESENT_FRAME = 'googlefcPresent';

class AdsImpl {
  private game: Phaser.Game | null = null;
  /** ID "pub-…" válido configurado: se cargan la CMP y, tras el consentimiento, los anuncios. */
  private configured = false;
  /** El SDK de anuncios ha confirmado que está listo (`adConfig.onReady`). */
  private ready = false;
  private showing = false;
  private scriptRequested = false;
  private lastAdAt = 0;

  init(game: Phaser.Game): void {
    this.game = game;
    this.lastAdAt = performance.now();
    const id = ADS.publisherId.trim();
    if (!id) return;
    if (!PUBLISHER_ID_PATTERN.test(id)) {
      console.warn(`[ads] ADS.publisherId "${id}" no es válido (ca-pub-…); se juega sin anuncios.`);
      return;
    }
    this.configured = true;
    const pubId = id.replace(/^ca-/, '');
    this.loadConsent(pubId, () => this.loadAdsScript(`ca-${pubId}`));
  }

  /** Hay CMP (publisherId configurado): el menú muestra "Preferencias de privacidad". */
  get hasConsentManager(): boolean {
    return this.configured;
  }

  /** Se puede ofrecer revivir: SDK listo y sin otro anuncio en pantalla. */
  get canOfferReward(): boolean {
    return this.isUsable();
  }

  /** Reabre el mensaje de consentimiento de la CMP. */
  showPrivacyOptions(): void {
    if (!this.configured) return;
    const fc = this.fc();
    fc.callbackQueue!.push(() => fc.showRevocationMessage?.());
  }

  /** Informa al SDK de si el juego tiene el sonido activado. */
  syncSound(): void {
    if (this.configured) window.adConfig?.({ sound: AudioManager.muted ? 'off' : 'on' });
  }

  /**
   * Intersticial entre partidas. `done` se llama siempre una vez: al instante si no toca anuncio
   * (sin SDK, sin consentimiento o sin pasar `ADS.interstitialMinGapSeconds`) o al terminar el anuncio.
   */
  showInterstitial(done: () => void): void {
    const gapMs = ADS.interstitialMinGapSeconds * MS_PER_SECOND;
    if (!this.isUsable() || performance.now() - this.lastAdAt < gapMs) {
      done();
      return;
    }
    let finished = false;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      done();
    };
    // Red de seguridad por si el SDK no responde. Si aun así el anuncio empieza tarde, beforeAd pausa el juego entero.
    const timer = window.setTimeout(finish, ADS.responseTimeoutMs);
    window.adBreak!({
      type: 'next',
      name: BREAK_NAMES.next,
      beforeAd: () => {
        window.clearTimeout(timer);
        this.beforeAd();
      },
      afterAd: () => this.afterAd(),
      adBreakDone: finish,
    });
  }

  /** Pide un anuncio con recompensa. Devuelve `cancel()` para retirar la oferta (el jugador la rechaza). */
  offerReward(offer: RewardOffer): () => void {
    let settled = false;
    let viewed = false;
    let timer = 0;
    const settle = (result: boolean): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      offer.onDone(result);
    };
    const cancel = (): void => {
      settled = true;
      window.clearTimeout(timer);
    };
    if (!this.isUsable()) {
      settle(false);
      return cancel;
    }
    timer = window.setTimeout(() => settle(false), ADS.responseTimeoutMs);
    window.adBreak!({
      type: 'reward',
      name: BREAK_NAMES.reward,
      beforeAd: () => {
        window.clearTimeout(timer);
        this.beforeAd();
      },
      afterAd: () => this.afterAd(),
      beforeReward: (showAdFn) => {
        if (settled) return;
        window.clearTimeout(timer);
        // Con el anuncio ya cargado no hay tiempo de espera: el SDK siempre acaba llamando a adBreakDone.
        offer.onOffer(() => {
          if (!settled) showAdFn();
        });
      },
      adViewed: () => {
        viewed = true;
      },
      adDismissed: () => {
        viewed = false;
      },
      adBreakDone: () => settle(viewed),
    });
    return cancel;
  }

  private isUsable(): boolean {
    return this.ready && !this.showing && typeof window.adBreak === 'function';
  }

  /** Durante el anuncio: juego en pausa y sin sonido. */
  private beforeAd(): void {
    this.showing = true;
    AudioManager.setAdMuted(true);
    this.game?.pause();
  }

  private afterAd(): void {
    this.showing = false;
    this.lastAdAt = performance.now();
    AudioManager.setAdMuted(false);
    this.game?.resume();
  }

  private fc(): NonNullable<Window['googlefc']> {
    const fc = (window.googlefc ??= {});
    fc.callbackQueue ??= [];
    return fc;
  }

  /** CMP certificada de Google (Privacy & messaging). Los anuncios no se cargan hasta que hay datos de consentimiento. */
  private loadConsent(pubId: string, onConsentReady: () => void): void {
    this.fc().callbackQueue!.push({ CONSENT_DATA_READY: onConsentReady });
    AdsImpl.addScript(`${ADS.consentScriptUrl}${pubId}?ers=1`, (s) => {
      s.onerror = () => console.warn('[ads] No se pudo cargar la CMP de Google; se juega sin anuncios.');
    });
    AdsImpl.signalGooglefcPresent();
  }

  private loadAdsScript(client: string): void {
    // CONSENT_DATA_READY puede repetirse si el jugador cambia sus preferencias.
    if (this.scriptRequested) return;
    this.scriptRequested = true;
    window.adsbygoogle = window.adsbygoogle || [];
    const push = (params: AdBreakParams | AdConfigParams): void => {
      window.adsbygoogle!.push(params);
    };
    window.adBreak = push;
    window.adConfig = push;
    AdsImpl.addScript(`${ADS.scriptUrl}?client=${encodeURIComponent(client)}`, (s) => {
      s.crossOrigin = 'anonymous';
      s.dataset.adClient = client;
      s.dataset.adFrequencyHint = `${ADS.interstitialMinGapSeconds}s`;
      if (ADS.testMode) s.dataset.adbreakTest = 'on';
      s.onerror = () => console.warn('[ads] No se pudo cargar adsbygoogle.js (¿bloqueador?); se juega sin anuncios.');
    });
    window.adConfig({
      sound: AudioManager.muted ? 'off' : 'on',
      preloadAdBreaks: 'on',
      onReady: () => {
        this.ready = true;
      },
    });
  }

  private static addScript(src: string, setup: (script: HTMLScriptElement) => void): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    setup(script);
    document.head.appendChild(script);
  }

  /** Iframe que la CMP de Google usa para detectar que su etiqueta está en la página (fragmento oficial). */
  private static signalGooglefcPresent(): void {
    if (document.querySelector(`iframe[name="${FC_PRESENT_FRAME}"]`)) return;
    if (!document.body) {
      window.setTimeout(() => AdsImpl.signalGooglefcPresent(), 0);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = FC_PRESENT_FRAME;
    document.body.appendChild(iframe);
  }
}

export const Ads = new AdsImpl();
