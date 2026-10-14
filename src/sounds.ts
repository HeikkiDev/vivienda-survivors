// TODAS las entradas de audio del juego (GDD H11).
// Cambiar sonidos = editar solo este archivo + añadir archivos en public/assets/sfx|music/.
// Ningún otro archivo contiene rutas de audio.

export type SfxKey = 'shoot' | 'hit' | 'hurt' | 'coin' | 'levelup' | 'promise' | 'death';
export type SoundId = SfxKey | 'music';

export interface SoundEntry {
  /** Clave en la caché de audio de Phaser. */
  key: string;
  /** Si es una lista, Phaser elige el primer formato que soporte el navegador. */
  path: string | string[];
  volume: number;
  loop?: boolean;
}

export const SOUNDS: Record<SoundId, SoundEntry> = {
  shoot: { key: 'sfx_shoot', path: 'assets/sfx/shoot.wav', volume: 0.25 },
  hit: { key: 'sfx_hit', path: 'assets/sfx/hit.wav', volume: 0.3 },
  hurt: { key: 'sfx_hurt', path: 'assets/sfx/hurt.wav', volume: 0.6 },
  coin: { key: 'sfx_coin', path: 'assets/sfx/coin.wav', volume: 0.3 },
  levelup: { key: 'sfx_levelup', path: 'assets/sfx/levelup.wav', volume: 0.6 },
  promise: { key: 'sfx_promise', path: 'assets/sfx/promise.wav', volume: 0.6 },
  death: { key: 'sfx_death', path: 'assets/sfx/death.wav', volume: 0.7 },
  // .ogg primero; .mp3 para Safari/iOS, que no siempre reproduce Ogg Vorbis.
  music: { key: 'music_loop', path: ['assets/music/loop.ogg', 'assets/music/loop.mp3'], volume: 0.35, loop: true },
};

export function getSoundAssets(): SoundEntry[] {
  return Object.values(SOUNDS);
}
