// TODOS los números del juego. Ver GDD.md.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;

export const CAMERA_LERP = 0.1;

export const PHYSICS_DEBUG = false;
/** Parámetro de URL para activar el debug físico: `?debug=1`. */
export const DEBUG_URL_PARAM = 'debug';

export const CANVAS_BG_COLOR = '#000000';

export const BEST_TIME_STORAGE_KEY = 'viviendaSurvivors.best';

export const DEPTH = {
  background: -1000,
  entities: 0,
  player: 10,
  joystick: 1000,
} as const;

// Sección 4 — Jugador
export const PLAYER = {
  hitboxRadius: 14,
  maxHp: 100,
  speed: 200,
  invulnerabilitySeconds: 0.5,
  invulnerabilityAlpha: 0.5,
  pickupRadius: 60,
  euroAttractSpeed: 400,
  regenPerSecond: 0,
} as const;

// Sección 2 — Joystick virtual (táctil)
export const JOYSTICK = {
  radius: 60,
  /** Fracción de la altura de pantalla a partir de la cual se puede crear (mitad inferior). */
  activationYRatio: 0.5,
  baseColor: 0xffffff,
  baseAlpha: 0.15,
  baseLineWidth: 2,
  baseLineAlpha: 0.4,
  knobRadius: 24,
  knobColor: 0xffffff,
  knobAlpha: 0.4,
} as const;

export const UI = {
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  menu: {
    bgColor: '#1a1a1a',
    titleY: 140,
    titleSize: 64,
    titleColor: '#ffd447',
    subtitleY: 210,
    subtitleSize: 22,
    subtitleColor: '#dddddd',
    buttonY: 310,
    buttonSize: 32,
    buttonColor: '#1a1a1a',
    buttonBg: '#ffd447',
    buttonBgHover: '#ffe680',
    buttonPadX: 28,
    buttonPadY: 12,
    bestY: 380,
    bestSize: 20,
    bestColor: '#aaaaaa',
    footerMarginBottom: 24,
    footerSize: 14,
    footerColor: '#888888',
  },
} as const;

export const SECONDS_PER_MINUTE = 60;
