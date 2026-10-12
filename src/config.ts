// TODOS los números del juego. Ver GDD.md.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;

export const CAMERA_LERP = 0.1;

export const PHYSICS_DEBUG = false;

export const CANVAS_BG_COLOR = '#000000';

export const BEST_TIME_STORAGE_KEY = 'viviendaSurvivors.best';

export const DEPTH = {
  background: -1000,
  entities: 0,
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
