// TODOS los números del juego. Ver GDD.md.
import type { EnemyId, PassiveId, WeaponId } from './types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;

export const CAMERA_LERP = 0.1;

export const PHYSICS_DEBUG = false;
/** Parámetro de URL para activar el debug físico: `?debug=1`. */
export const DEBUG_URL_PARAM = 'debug';
/** Parámetro de URL para empezar el reloj en un minuto concreto: `?min=7`. */
export const DEBUG_START_MINUTE_PARAM = 'min';

export const CANVAS_BG_COLOR = '#000000';

export const BEST_TIME_STORAGE_KEY = 'viviendaSurvivors.best';

export const DEPTH = {
  background: -1000,
  entities: 0,
  aura: 1,
  euros: 2,
  enemies: 5,
  projectiles: 8,
  effects: 9,
  player: 10,
  healthBar: 11,
  floatingText: 12,
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

// Sección 12 — Barra de vida bajo el jugador
export const HEALTH_BAR = {
  width: 40,
  height: 5,
  offsetY: 24,
  bgColor: 0xcc2222,
  fgColor: 0x33cc33,
} as const;

// Sección 7 — Enemigos

export interface EnemyStats {
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  hitboxRadius: number;
}

export const ENEMIES: Record<EnemyId, EnemyStats> = {
  ipc: { hp: 10, speed: 90, damage: 5, xp: 1, hitboxRadius: 11 },
  casero: { hp: 30, speed: 70, damage: 10, xp: 3, hitboxRadius: 13 },
  agencia: { hp: 20, speed: 130, damage: 8, xp: 2, hitboxRadius: 14 },
  fondo: { hp: 120, speed: 55, damage: 20, xp: 10, hitboxRadius: 20 },
};

export const ENEMY_IDS: readonly EnemyId[] = ['ipc', 'casero', 'agencia', 'fondo'];
export const WEAPON_IDS: readonly WeaponId[] = ['curriculum', 'escudo', 'grito', 'sindicato'];
export const PASSIVE_IDS: readonly PassiveId[] = ['aval', 'piso', 'bono', 'trabajo'];

/** HP × (1 + hpScalePerMinute × minuto actual). */
export const ENEMY_HP_SCALE_PER_MINUTE = 0.1;

/** Destello al recibir daño (ms). */
export const ENEMY_FLASH_MS = 80;

// Sección 5 y 6 — Nivel máximo de armas y pasivas
export const MAX_UPGRADE_LEVEL = 5;

// Sección 5.1 — Lanzador de currículums
export interface CurriculumLevel {
  damage: number;
  cooldown: number;
  projectiles: number;
  pierce: number;
  speed: number;
}

export const CURRICULUM = {
  /** Índice 0 = nivel 1. */
  levels: [
    { damage: 10, cooldown: 1.0, projectiles: 1, pierce: 1, speed: 450 },
    { damage: 12, cooldown: 0.9, projectiles: 1, pierce: 1, speed: 450 },
    { damage: 14, cooldown: 0.9, projectiles: 2, pierce: 1, speed: 450 },
    { damage: 16, cooldown: 0.8, projectiles: 2, pierce: 2, speed: 500 },
    { damage: 20, cooldown: 0.7, projectiles: 3, pierce: 2, speed: 500 },
  ] as readonly CurriculumLevel[],
  lifetime: 1.5,
  /** Abanico ±10° alrededor del objetivo. */
  spreadDegrees: 10,
  hitboxRadius: 8,
  poolSize: 100,
} as const;

// Sección 5.2 — Escudo Ley de Vivienda
export interface EscudoLevel {
  damage: number;
  tick: number;
  radius: number;
}

export const ESCUDO = {
  levels: [
    { damage: 4, tick: 0.5, radius: 70 },
    { damage: 5, tick: 0.5, radius: 80 },
    { damage: 6, tick: 0.45, radius: 90 },
    { damage: 8, tick: 0.4, radius: 100 },
    { damage: 10, tick: 0.35, radius: 115 },
  ] as readonly EscudoLevel[],
  auraColor: 0x3a7bff,
  auraAlpha: 0.25,
} as const;

// Sección 5.3 — Grito "¡Eso es un trastero!"
export interface GritoLevel {
  damage: number;
  cooldown: number;
  radius: number;
}

export const GRITO = {
  levels: [
    { damage: 25, cooldown: 4.0, radius: 140 },
    { damage: 30, cooldown: 3.6, radius: 150 },
    { damage: 38, cooldown: 3.3, radius: 165 },
    { damage: 46, cooldown: 3.0, radius: 180 },
    { damage: 60, cooldown: 2.5, radius: 200 },
  ] as readonly GritoLevel[],
  circleColor: 0xffffff,
  circleAlpha: 0.5,
  growSeconds: 0.2,
  fadeSeconds: 0.3,
  floatingTextSeconds: 0.6,
  floatingTextRise: 20,
  /** Distancia vertical sobre el jugador del icono y del texto flotante. */
  iconOffsetY: 34,
  textOffsetY: 60,
  knockbackSpeed: 150,
  knockbackSeconds: 0.15,
  textSize: 22,
  textColor: '#ffffff',
  textStroke: '#000000',
  textStrokeThickness: 4,
} as const;

// Sección 5.4 — Sindicato de inquilinos
export interface SindicatoLevel {
  damage: number;
  orbs: number;
  orbitRadius: number;
  angularSpeed: number;
}

export const SINDICATO = {
  levels: [
    { damage: 8, orbs: 2, orbitRadius: 90, angularSpeed: 3.0 },
    { damage: 10, orbs: 2, orbitRadius: 95, angularSpeed: 3.3 },
    { damage: 12, orbs: 3, orbitRadius: 100, angularSpeed: 3.6 },
    { damage: 14, orbs: 4, orbitRadius: 105, angularSpeed: 3.9 },
    { damage: 18, orbs: 5, orbitRadius: 110, angularSpeed: 4.2 },
  ] as readonly SindicatoLevel[],
  /** Cada enemigo solo recibe daño de una órbita cada X s. */
  hitCooldown: 0.5,
  hitboxRadius: 12,
} as const;

// Sección 6 — Pasivas (se acumulan aditivamente por nivel)
export const PASSIVES = {
  aval: { maxHpPerLevel: 20, healPerLevel: 20 },
  piso: { cooldownReductionPerLevel: 0.08 },
  bono: { pickupRadiusPerLevel: 0.15, speedPerLevel: 0.05 },
  trabajo: { damagePerLevel: 0.1 },
} as const;

// Sección 9.1 — Menú de subida de nivel
export const LEVEL_UP_OPTIONS = 3;
export const CANA_HEAL = 30;

// Sección 9 — Euros (XP)
export const EURO = {
  hitboxRadius: 5,
  maxOnGround: 400,
} as const;

/** XP para pasar del nivel n al n+1: base + (n − 1) × step. */
export const XP_CURVE = {
  base: 5,
  step: 6,
} as const;

// Sección 3 y 8 — Spawn
export const SPAWN = {
  ringMinDistance: 600,
  ringMaxDistance: 700,
  repositionDistance: 1200,
  maxAlive: 300,
} as const;

export interface SpawnRow {
  interval: number;
  count: number;
  weights: Record<EnemyId, number>;
}

/** Índice = minuto (0–1 → 0, …, 9–10 → 9). */
export const SPAWN_TABLE: readonly SpawnRow[] = [
  { interval: 1.0, count: 2, weights: { ipc: 100, casero: 0, agencia: 0, fondo: 0 } },
  { interval: 0.9, count: 3, weights: { ipc: 70, casero: 30, agencia: 0, fondo: 0 } },
  { interval: 0.8, count: 3, weights: { ipc: 50, casero: 30, agencia: 20, fondo: 0 } },
  { interval: 0.7, count: 4, weights: { ipc: 45, casero: 30, agencia: 25, fondo: 0 } },
  { interval: 0.6, count: 4, weights: { ipc: 40, casero: 30, agencia: 25, fondo: 5 } },
  { interval: 0.55, count: 5, weights: { ipc: 35, casero: 30, agencia: 28, fondo: 7 } },
  { interval: 0.5, count: 5, weights: { ipc: 30, casero: 30, agencia: 30, fondo: 10 } },
  { interval: 0.45, count: 6, weights: { ipc: 30, casero: 25, agencia: 32, fondo: 13 } },
  { interval: 0.5, count: 5, weights: { ipc: 30, casero: 25, agencia: 30, fondo: 15 } },
  { interval: 0.35, count: 8, weights: { ipc: 25, casero: 25, agencia: 30, fondo: 20 } },
];

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
  hud: {
    xpBarHeight: 10,
    xpBarBg: 0x222222,
    xpBarFg: 0x3fa9f5,
    xpBarBgAlpha: 0.8,
    textY: 16,
    textMarginX: 12,
    textSize: 20,
    textColor: '#ffffff',
    textStroke: '#000000',
    textStrokeThickness: 4,
  },
  hudIcons: {
    marginX: 12,
    marginBottom: 22,
    spacing: 40,
    levelOffsetX: 12,
    levelOffsetY: 10,
    levelSize: 13,
  },
  levelUp: {
    overlayColor: 0x000000,
    overlayAlpha: 0.7,
    titleY: 80,
    titleSize: 34,
    titleColor: '#ffd447',
    cardY: 290,
    cardWidth: 240,
    cardHeight: 280,
    cardGap: 30,
    cardColor: 0x2a2a3a,
    cardHoverColor: 0x3a3a55,
    cardStrokeColor: 0xffd447,
    cardStrokeWidth: 2,
    cardPadding: 16,
    keyY: 18,
    keySize: 16,
    keyColor: '#888888',
    iconY: 60,
    iconScale: 2,
    nameY: 115,
    nameSize: 20,
    nameColor: '#ffffff',
    levelY: 160,
    levelSize: 16,
    levelColor: '#ffd447',
    newColor: '#7CFC00',
    descY: 190,
    descSize: 15,
    descColor: '#cccccc',
  },
  gameOver: {
    overlayColor: 0x000000,
    overlayAlpha: 0.85,
    titleY: 130,
    titleSize: 40,
    titleColor: '#ffffff',
    subtitleY: 185,
    subtitleSize: 20,
    subtitleColor: '#cccccc',
    statsY: 250,
    statsSize: 20,
    statsLineSpacing: 8,
    statsColor: '#ffd447',
    buttonY: 440,
    buttonSize: 28,
    buttonColor: '#1a1a1a',
    buttonBg: '#ffd447',
    buttonBgHover: '#ffe680',
    buttonPadX: 24,
    buttonPadY: 10,
  },
} as const;

export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
