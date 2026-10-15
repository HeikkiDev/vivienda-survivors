// TODOS los números del juego. Ver GDD.md.
import type { EnemyId, PassiveId, PromiseId, WeaponId } from './types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/**
 * Scale.EXPAND: el área lógica base es GAME_WIDTH×GAME_HEIGHT y crece para llenar la pantalla
 * hasta estos máximos (ancho en pantallas panorámicas, alto en ventanas más altas que 16:9).
 * Más allá, se ve con franjas negras.
 */
export const VIEW_MAX_WIDTH = 1400;
export const VIEW_MAX_HEIGHT = 720;

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;

export const CAMERA_LERP = 0.1;

/** Sección 15 (H8) — Shake leve de cámara al recibir daño. */
export const CAMERA_SHAKE = {
  durationMs: 100,
  intensity: 0.005,
} as const;

export const PHYSICS_DEBUG = false;
/** Parámetro de URL para activar el debug físico: `?debug=1`. */
export const DEBUG_URL_PARAM = 'debug';

/** Experiencia móvil: media query de vertical y retardo para recalcular la escala tras girar/redimensionar. */
export const MOBILE = {
  portraitQuery: '(orientation: portrait)',
  standaloneQuery: '(display-mode: standalone), (display-mode: fullscreen)',
  rescaleDelayMs: 250,
  iosTouchPoints: 1,
} as const;
/** Parámetro de URL para empezar el reloj en un minuto concreto: `?min=7`. */
export const DEBUG_START_MINUTE_PARAM = 'min';
/** Parámetro de URL para ganar al empezar la partida (ver la animación de victoria): `?win=1`. */
export const DEBUG_WIN_PARAM = 'win';

export const CANVAS_BG_COLOR = '#000000';

export const BEST_TIME_STORAGE_KEY = 'viviendaSurvivors.best';

export const LANGUAGES = ['en', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'es';
export const LANGUAGE_STORAGE_KEY = 'viviendaSurvivors.lang';

/** Enlace que acompaña al texto de compartir (GDD H12). */
export const SHARE_URL = 'https://heikkidev.github.io/vivienda-survivors/';

/** Imagen para compartir: captura del final de la partida + resultado (1200×630, formato de vista previa en redes). */
export const SHARE_CARD = {
  width: 1200,
  height: 630,
  /** La franja oscura va de transparente (shadeFromY) a shadeAlpha (abajo). */
  shadeFromY: 280,
  shadeAlpha: 0.9,
  marginX: 48,
  titleY: 462,
  titleSize: 54,
  titleColor: '#ffffff',
  statsY: 528,
  statsSize: 30,
  statsColor: '#ffd447',
  footerY: 588,
  footerSize: 24,
  footerColor: '#dddddd',
  strokeColor: '#000000',
  strokeWidth: 6,
  minFontSize: 16,
  fileName: 'vivienda-survivors.png',
  mimeType: 'image/png',
};

export const AUDIO = {
  sfxMaxInstances: 4,
  sfxMinIntervalMs: 50,
  /** ±5 % de tono aleatorio en cada efecto. */
  sfxPitchVariation: 0.05,
  /** Volumen de la música en pausa y en el menú de mejoras (fracción del normal). */
  musicDuckedFactor: 0.3,
  mutedStorageKey: 'viviendaSurvivors.muted',
};

export const DEPTH = {
  background: -1000,
  entities: 0,
  aura: 1,
  euros: 2,
  enemies: 5,
  boss: 6,
  bossBullets: 7,
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
  /** Periodo (s) de cada fase del parpadeo durante la invulnerabilidad. */
  invulnerabilityBlinkSeconds: 0.1,
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

export const REGEN_FEEDBACK = {
  intervalSeconds: 2,
  offsetY: -32,
  risePixels: 24,
  riseMs: 600,
  fadeMs: 200,
  fontSize: 18,
  strokeThickness: 2,
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
export const PASSIVE_IDS: readonly PassiveId[] = ['aval', 'piso', 'bono', 'trabajo', 'teletrabajo'];

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
  /** Opacidad del escudo cuando su visual es un sprite estirado al radio del aura. */
  spriteAlpha: 0.35,
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
export const TELETRABAJO_REGEN_PER_LEVEL = 0.3;

export const PASSIVES = {
  aval: { maxHpPerLevel: 20, healPerLevel: 20 },
  piso: { cooldownReductionPerLevel: 0.08 },
  bono: { pickupRadiusPerLevel: 0.15, speedPerLevel: 0.05 },
  trabajo: { damagePerLevel: 0.1 },
  teletrabajo: { regenPerLevel: TELETRABAJO_REGEN_PER_LEVEL },
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
  /** Margen mínimo entre la esquina de la pantalla y el anillo de spawn (en 960×540 el anillo no cambia). */
  offscreenMargin: 40,
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

// Sección 7.1 — Boss: Burbuja 2.0
export const BOSS = {
  stats: { hp: 3000, speed: 60, damage: 30, xp: 50, hitboxRadius: 45 } as EnemyStats,
  spawnMinute: 8,
  /** Segundos de aviso antes de aparecer. */
  warningSeconds: 3,
  shootInterval: 5,
  bulletCount: 8,
  bullet: { damage: 10, speed: 200, lifetime: 3, hitboxRadius: 8 },
  bulletPoolSize: 32,
  /** Segundos que se muestra el texto al morir. */
  deathTextSeconds: 3,
} as const;

// Sección 8 — Oleada especial "Temporada turística"
export const TOURIST_WAVE = {
  minute: 5,
  enemy: 'agencia' as EnemyId,
  count: 40,
  radius: 650,
} as const;

/** Sección 11 — Victoria al llegar a este minuto. */
export const VICTORY_MINUTE = 10;

/** Celebración antes de la pantalla de victoria (petición del usuario, ver NOTES.md). */
export const VICTORY_ANIM = {
  /** Tiempo total antes del fundido a GameOverScene. */
  durationMs: 4000,
  fadeOutMs: 600,
  flashMs: 500,
  flashColor: { r: 255, g: 255, b: 255 },
  zoom: 1.4,
  zoomMs: 1500,
  enemyFadeMs: 700,
  playerPulseScale: 1.25,
  playerPulseMs: 300,
} as const;

/** Secuencia de derrota antes de la pantalla final (petición del usuario, ver NOTES.md). */
export const DEFEAT_ANIM = {
  durationMs: 3500,
  fadeOutMs: 800,
  flashMs: 400,
  flashColor: { r: 255, g: 40, b: 40 },
  shakeMs: 500,
  shakeIntensity: 0.02,
  zoom: 1.6,
  zoomMs: 2500,
  /** El jugador cae de lado y se apaga. */
  playerFallAngle: 90,
  playerFallMs: 600,
  playerFallAlpha: 0.5,
} as const;

/** Piezas que caen por la pantalla en las secuencias de fin (confeti). */
export interface FallingPiecesConfig {
  count: number;
  colors: readonly number[];
  alpha: number;
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  /** Ángulo inicial aleatorio en ±angleJitter grados. */
  angleJitter: number;
  driftX: number;
  spinDeg: number;
  fallMinMs: number;
  fallMaxMs: number;
  /** Las piezas salen escalonadas durante este tiempo. */
  spawnSpreadMs: number;
}

// Sección 10 — Promesa electoral
/** Multiplicadores temporales de una promesa (los ausentes valen 1). */
export interface PromiseEffect {
  damage?: number;
  enemySpeed?: number;
  pickupRadius?: number;
  xpGain?: number;
  cooldown?: number;
  playerSpeed?: number;
  invulnerable?: boolean;
}

export const PROMESA = {
  /** Minutos en los que aparece el pickup. */
  spawnMinutes: [2, 4, 6, 8] as readonly number[],
  spawnMinDistance: 250,
  spawnMaxDistance: 400,
  /** Segundos en el suelo antes de desaparecer si no se coge. */
  lifetime: 30,
  hitboxRadius: 16,
  buffSeconds: 20,
  debuffSeconds: 15,
  /** Probabilidad de que se cumpla al terminar el buff. */
  fulfilledChance: 0.5,
  /** Segundos que se muestra el banner "¡Promesa cumplida!". */
  fulfilledBannerSeconds: 3,
  /** Segundos del aviso "ha aparecido una urna". */
  spawnAnnounceSeconds: 4,
  /** Segundos del aviso central de promesa cumplida/incumplida. */
  resolveAnnounceSeconds: 3,
} as const;

export const PROMISES: Record<PromiseId, { buff: PromiseEffect; debuff: PromiseEffect }> = {
  viviendas: { buff: { damage: 2 }, debuff: { damage: 0.6 } },
  alquiler: { buff: { enemySpeed: 0.5 }, debuff: { enemySpeed: 1.3 } },
  ayudas: { buff: { pickupRadius: 4, xpGain: 2 }, debuff: { xpGain: 0.5 } },
  especulacion: { buff: { cooldown: 0.5 }, debuff: { cooldown: 1.5 } },
  digna: { buff: { invulnerable: true }, debuff: { playerSpeed: 0.6 } },
};

export const PROMISE_IDS: readonly PromiseId[] = ['viviendas', 'alquiler', 'ayudas', 'especulacion', 'digna'];

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
    langY: 440,
    langSize: 18,
    langGap: 16,
    langLabelColor: '#aaaaaa',
    langColor: '#dddddd',
    langActiveColor: '#1a1a1a',
    langBg: '#333333',
    langBgHover: '#555555',
    langActiveBg: '#ffd447',
    langPadX: 12,
    langPadY: 6,
    iosHintY: 478,
    iosHintSize: 14,
    iosHintColor: '#ffd447',
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
  pause: {
    buttonMarginX: 24,
    buttonY: 26,
    buttonHitPadding: 8,
    /** El botón de silencio va a la izquierda del de pausa. */
    muteOffsetX: 44,
    overlayColor: 0x000000,
    overlayAlpha: 0.6,
    titleY: 150,
    titleSize: 48,
    titleColor: '#ffd447',
    hintY: 205,
    hintSize: 18,
    hintColor: '#dddddd',
  },
  boss: {
    barY: 42,
    barWidth: 400,
    barHeight: 10,
    barBg: 0x222222,
    barBgAlpha: 0.8,
    barFg: 0xff4fa3,
    barStroke: 0x000000,
    barStrokeWidth: 2,
  },
  /** Presentación de cada tipo de enemigo la primera vez que aparece en la partida. */
  enemyIntro: {
    seconds: 8,
    fadeSeconds: 0.6,
    marginBottom: 80,
    padX: 14,
    padY: 10,
    iconGap: 12,
    lineGap: 4,
    radius: 10,
    bg: 0x000000,
    bgAlpha: 0.7,
    stroke: 0xffd447,
    strokeWidth: 2,
    nameSize: 18,
    nameColor: '#ffd447',
    descSize: 14,
    descColor: '#ffffff',
  },
  victory: {
    titleYRatio: 0.25,
    titleSize: 72,
    titleColor: '#ffd447',
    titleStrokeThickness: 8,
    subtitleGap: 64,
    subtitleSize: 24,
    subtitleColor: '#ffffff',
    subtitleDelayMs: 700,
    subtitleFadeMs: 500,
    popMs: 600,
    pulseScale: 1.08,
    pulseMs: 450,
    confetti: {
      count: 140,
      colors: [0xffd447, 0xff4fa3, 0x3fa9f5, 0x7cfc00, 0xffffff, 0xff8c1a],
      alpha: 1,
      minW: 6,
      maxW: 10,
      minH: 10,
      maxH: 16,
      angleJitter: 180,
      driftX: 80,
      spinDeg: 720,
      fallMinMs: 1800,
      fallMaxMs: 3200,
      spawnSpreadMs: 1800,
    } satisfies FallingPiecesConfig,
  },
  defeat: {
    veilColor: 0x2a0000,
    veilAlpha: 0.6,
    veilMs: 1200,
    titleYRatio: 0.3,
    titleSize: 72,
    titleColor: '#ff4444',
    titleStrokeThickness: 8,
    /** Caída del título desde fuera de la pantalla, con rebote. */
    titleDropDelayMs: 300,
    titleDropMs: 1000,
    subtitleGap: 64,
    subtitleSize: 24,
    subtitleColor: '#dddddd',
    subtitleDelayMs: 1300,
    subtitleFadeMs: 600,
  },
  announcement: {
    y: 180,
    size: 26,
    warningColor: '#ff5555',
    infoColor: '#ffd447',
  },
  promise: {
    bannerY: 62,
    bannerSize: 18,
    bannerLineSpacing: 2,
    bannerPadX: 14,
    bannerPadY: 6,
    bannerBg: '#000000aa',
    buffColor: '#ffd447',
    brokenColor: '#ff5555',
    arrowMargin: 28,
    arrowSize: 14,
    /** Ángulo (rad) entre la punta y cada ala del triángulo. */
    arrowWingAngle: 2.5,
    arrowColor: 0xffd447,
    arrowStroke: 0x000000,
    arrowStrokeWidth: 2,
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
    effectY: 182,
    effectSize: 15,
    effectColor: '#9fe3ff',
    /** Distancia desde el borde inferior de la tarjeta al final del chiste. */
    descBottom: 14,
    descSize: 13,
    descColor: '#aaaaaa',
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
    buttonY: 420,
    buttonSize: 28,
    buttonColor: '#1a1a1a',
    buttonBg: '#ffd447',
    buttonBgHover: '#ffe680',
    buttonPadX: 24,
    buttonPadY: 10,
    shareY: 485,
    shareSize: 20,
    shareColor: '#ffffff',
    shareBg: '#3a3a4a',
    shareBgHover: '#55556a',
    sharePadX: 18,
    sharePadY: 8,
    /** Tiempo que el botón muestra "¡Copiado!". */
    copiedMs: 2000,
  },
} as const;

export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
