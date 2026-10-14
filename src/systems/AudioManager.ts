import Phaser from 'phaser';
import { AUDIO } from '../config';
import { SOUNDS, type SfxKey } from '../sounds';

type VolumeSound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound;

/** Efectos y música. El sonido de Phaser es global al juego, así que basta con una instancia. */
class AudioManagerImpl {
  private game: Phaser.Game | null = null;
  private music: VolumeSound | null = null;
  private ducked = false;
  // Estado propio: en Web Audio, sound.mute se lee de un nodo de ganancia y no cambia al instante.
  private isMuted = false;
  private readonly lastPlayed = new Map<SfxKey, number>();
  private readonly warned = new Set<string>();

  init(game: Phaser.Game): void {
    this.game = game;
    this.isMuted = AudioManagerImpl.loadMuted();
    game.sound.mute = this.isMuted;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  toggleMute(): boolean {
    const muted = !this.isMuted;
    this.isMuted = muted;
    if (this.game) this.game.sound.mute = muted;
    try {
      localStorage.setItem(AUDIO.mutedStorageKey, muted ? '1' : '0');
    } catch {
      // localStorage no disponible: la preferencia dura solo esta sesión.
    }
    return muted;
  }

  /** Máx. N instancias a la vez y una cada X ms por efecto, con un pequeño cambio de tono. */
  playSfx(id: SfxKey): void {
    const sound = this.game?.sound;
    if (!sound || this.isMuted) return;
    const entry = SOUNDS[id];
    if (!this.isLoaded(entry.key)) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(id) ?? -Infinity) < AUDIO.sfxMinIntervalMs) return;
    let playing = 0;
    for (const s of sound.getAll(entry.key)) if (s.isPlaying) playing++;
    if (playing >= AUDIO.sfxMaxInstances) return;
    this.lastPlayed.set(id, now);
    const v = AUDIO.sfxPitchVariation;
    sound.play(entry.key, { volume: entry.volume, rate: 1 + Phaser.Math.FloatBetween(-v, v) });
  }

  startMusic(): void {
    const sound = this.game?.sound;
    const entry = SOUNDS.music;
    this.ducked = false;
    if (!sound || !this.isLoaded(entry.key)) return;
    if (!this.music) this.music = sound.add(entry.key, { loop: entry.loop ?? false }) as VolumeSound;
    this.applyMusicVolume();
    if (!this.music.isPlaying) this.music.play();
  }

  /** Baja la música (pausa, menú de mejoras) o la devuelve a su volumen. */
  setMusicDucked(ducked: boolean): void {
    this.ducked = ducked;
    this.applyMusicVolume();
  }

  stopMusic(): void {
    this.music?.stop();
  }

  private applyMusicVolume(): void {
    this.music?.setVolume(SOUNDS.music.volume * (this.ducked ? AUDIO.musicDuckedFactor : 1));
  }

  private isLoaded(key: string): boolean {
    if (this.game?.cache.audio.exists(key)) return true;
    if (!this.warned.has(key)) {
      this.warned.add(key);
      console.warn(`[audio] "${key}" no está cargado; se omite.`);
    }
    return false;
  }

  private static loadMuted(): boolean {
    try {
      return localStorage.getItem(AUDIO.mutedStorageKey) === '1';
    } catch {
      return false;
    }
  }
}

export const AudioManager = new AudioManagerImpl();
