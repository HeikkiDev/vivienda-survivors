// TODOS los textos visibles, por idioma. Ver GDD.md y NOTES.md (multi-idioma).
import {
  CANA_HEAL,
  DEFAULT_LANGUAGE,
  EVOLUTION_MULTIPLIERS,
  EVOLUTIONS,
  LANGUAGE_STORAGE_KEY,
  PASSIVES,
  VICTORY_MINUTE,
  type Language,
  type PromiseEffect,
} from './config';

const pct = (ratio: number): number => Math.round(ratio * 100);
/** "+50%" a partir de un multiplicador (1,5). */
const pctUp = (multiplier: number): number => pct(multiplier - 1);
const decimal = (n: number, sep: string): string => String(n).replace('.', sep);

const EM = EVOLUTION_MULTIPLIERS;
const EV = EVOLUTIONS;

type EffectLabels = Record<keyof PromiseEffect, string>;

/** "Daño ×2, XP ×0,5": describe un efecto de promesa a partir de sus multiplicadores de config. */
function describeEffect(effect: PromiseEffect, labels: EffectLabels, decimalSep: string): string {
  return (Object.keys(effect) as Array<keyof PromiseEffect>)
    .map((k) => {
      const v = effect[k];
      return typeof v === 'number' ? `${labels[k]} ×${String(v).replace('.', decimalSep)}` : labels[k];
    })
    .join(', ');
}

/** Datos de la partida para el texto de compartir (GDD H12). */
export interface ShareStats {
  time: string;
  level: number;
  kills: number;
  brokenPromises: number;
  url: string;
}

const shareStatsEs = (s: ShareStats): string =>
  `Nivel ${s.level} · ${s.kills.toLocaleString('es-ES')} enemigos derrotados · ` +
  `${s.brokenPromises} ${s.brokenPromises === 1 ? 'promesa incumplida' : 'promesas incumplidas'}`;

const shareStatsEn = (s: ShareStats): string =>
  `Level ${s.level} · ${s.kills.toLocaleString('en-US')} enemies defeated · ` +
  `${s.brokenPromises} broken ${s.brokenPromises === 1 ? 'promise' : 'promises'}`;

const ES_EFFECT_LABELS: EffectLabels = {
  damage: 'Daño',
  enemySpeed: 'Velocidad enemigos',
  pickupRadius: 'Imán',
  xpGain: 'XP',
  cooldown: 'Recarga',
  playerSpeed: 'Tu velocidad',
  invulnerable: 'Invulnerable',
};

const EN_EFFECT_LABELS: EffectLabels = {
  damage: 'Damage',
  enemySpeed: 'Enemy speed',
  pickupRadius: 'Magnet',
  xpGain: 'XP',
  cooldown: 'Cooldown',
  playerSpeed: 'Your speed',
  invulnerable: 'Invulnerable',
};

const ES = {
  healing: (amount: number) => `+${String(amount).replace('.', ',')}`,
  menu: {
    title: 'VIVIENDA SURVIVORS',
    subtitle: 'Sobrevive 10 minutos al mercado inmobiliario',
    play: 'Buscar piso',
    best: (time: string) => `Récord: ${time}`,
    noBest: 'Récord: --:--',
    footer: 'Parodia. Cualquier parecido con la realidad es pura coincidencia (no).',
    language: 'Idioma:',
  },
  mobile: {
    rotate: 'Gira el móvil 📱↻',
    iosFullscreen: 'Para pantalla completa: Compartir → Añadir a pantalla de inicio',
  },
  hud: {
    level: (n: number) => `Nv ${n}`,
  },
  pause: {
    title: 'PAUSA',
    hint: 'Esc / P o ⏸ para continuar',
  },
  levelUp: {
    title: '¡Ascenso! (de sueldo no)',
    newItem: '¡NUEVO!',
    levelChange: (from: number) => `Nv ${from} → ${from + 1}`,
    key: (n: number) => `[${n}]`,
    evolution: '¡EVOLUCIÓN!',
  },
  evolutionBanner: (name: string) => `¡${name}!`,
  evolutions: {
    linkedin: { name: 'LinkedIn Premium', desc: "Ahora con insignia de 'Open to work'", effect: `Dispara en ${EV.linkedin.directions} direcciones, atraviesa a todos y +${pctUp(EM.linkedin.damage)}% daño.` },
    antidesahucios: { name: 'Escudo Antidesahucios', desc: 'Esta vez sí se cumple', effect: `Aura +${pctUp(EM.antidesahucios.radius)}% radio y +${pctUp(EM.antidesahucios.damage)}% daño. Cura ${EV.antidesahucios.healPerKill} por enemigo abatido (máx. ${EV.antidesahucios.maxHealPerSecond}/s).` },
    manifestacion: { name: 'Manifestación', desc: 'Somos miles y no cabemos en 20 m²', effect: `Ritmo ×${decimal(1 / EM.manifestacion.cooldown, ',')}, radio ×${decimal(EM.manifestacion.radius, ',')} y gran empuje. 1 de cada ${EV.manifestacion.giantEvery} llena la pantalla.` },
    huelga: { name: 'Huelga general', desc: 'Hoy no paga nadie', effect: `${EV.huelga.orbs} puños, órbita +${pctUp(EM.huelga.orbitRadius)}%, +${pctUp(EM.huelga.damage)}% daño y puños ×${decimal(EM.huelga.size, ',')}.` },
  },
  weapons: {
    curriculum: { name: 'Lanzador de currículums', desc: 'Lanza currículums al enemigo más cercano.', effect: 'Dispara al enemigo más cercano. Al subir: más proyectiles y atraviesan.' },
    escudo: { name: 'Escudo Ley de Vivienda', desc: 'Protege… en teoría. Depende de tu comunidad autónoma.', effect: 'Aura permanente que daña a todo lo que tengas cerca.' },
    grito: { name: 'Grito "¡Eso es un trastero!"', desc: 'Onda expansiva que daña y empuja a los que te rodean.', effect: 'Explosión periódica a tu alrededor: daña y empuja.' },
    sindicato: { name: 'Sindicato de inquilinos', desc: 'Puños en órbita. La unión hace la fuerza.', effect: 'Puños que orbitan y golpean al pasar. Al subir: más puños.' },
  },
  passives: {
    aval: { name: 'Aval de tus padres', desc: 'Tus padres avalan con su casa. Sin presión.', effect: `+${PASSIVES.aval.maxHpPerLevel} vida máxima y cura ${PASSIVES.aval.healPerLevel}.` },
    piso: { name: 'Piso compartido', desc: '5 personas, 1 baño. Eficiencia máxima.', effect: `−${pct(PASSIVES.piso.cooldownReductionPerLevel)}% recarga de todas las armas.` },
    bono: { name: 'Bono Alquiler Joven', desc: 'Llega tarde, pero llega.', effect: `+${pct(PASSIVES.bono.pickupRadiusPerLevel)}% radio de recogida y +${pct(PASSIVES.bono.speedPerLevel)}% velocidad.` },
    trabajo: { name: 'Segundo trabajo', desc: 'Riders de día, camarero de noche.', effect: `+${pct(PASSIVES.trabajo.damagePerLevel)}% daño de todas las armas.` },
    teletrabajo: { name: 'Teletrabajo', desc: 'Sin transporte, sin gastos. +0,3 HP/s', effect: `Regenera +${String(PASSIVES.teletrabajo.regenPerLevel).replace('.', ',')} HP/s.` },
  },
  cana: { name: 'Caña con los colegas', desc: 'Lo único asequible', effect: `Cura ${CANA_HEAL} de vida.` },
  grito: {
    shout: '¡ESO ES UN TRASTERO!',
    evolvedShout: '¡SOMOS MILES!',
  },
  promises: {
    viviendas: '¡Un millón de viviendas públicas!',
    alquiler: '¡Bajaremos el alquiler por decreto!',
    ayudas: '¡Ayudas directas a la juventud!',
    especulacion: '¡Acabaremos con la especulación!',
    digna: '¡Vivienda digna para todos!',
  },
  promise: {
    spawned: '🗳️ ¡Elecciones! Ha aparecido una urna: cógela',
    title: (promise: string) => `🗳️ ${promise}`,
    effect: (e: PromiseEffect) => describeEffect(e, ES_EFFECT_LABELS, ','),
    buffLine: (now: string, ifBroken: string) => `${now}  ·  Si se incumple: ${ifBroken}`,
    question: (seconds: number) => `¿Se cumplirá? ${seconds} s`,
    fulfilled: '✅ ¡Promesa cumplida! (milagro)',
    brokenTitle: (promise: string) => `❌ ${promise}`,
    broken: '❌ PROMESA INCUMPLIDA',
    brokenDetail: (effect: string, seconds: number) => `${effect} durante ${seconds} s`,
  },
  enemies: {
    ipc: { name: 'Subida del IPC', desc: 'Sube poco a poco, pero nunca para.' },
    casero: { name: 'Casero de contrato de 11 meses', desc: 'Te renueva cada año… subiendo el precio.' },
    agencia: { name: 'Agencia con honorarios', desc: 'Llega la primera y te cobra por enseñarte el piso.' },
    fondo: { name: 'Fondo buitre', desc: 'Lento pero duro. Compra edificios enteros.' },
  },
  elite: {
    name: (base: string) => `${base} premium`,
    spawned: (name: string) => `¡Cuidado! ${name} a la vista: suelta un cofre`,
  },
  chest: {
    title: '¡Te ha tocado un piso de protección oficial!',
    subtitle: 'Solo había 40.000 solicitudes',
    skipHint: 'Toca o pulsa una tecla para saltar',
    jackpot: '¡Sorteo ganado! Ni te lo crees.',
    euros: 'Euros para subir 1 nivel',
    continue: 'Continuar',
  },
  boss: {
    warning: '⚠️ ¡Se está inflando la BURBUJA 2.0!',
    death: 'La burbuja ha pinchado… de momento.',
  },
  victory: {
    title: '¡VICTORIA!',
    subtitle: `Has aguantado ${VICTORY_MINUTE} minutos… ahora toca firmar.`,
  },
  defeat: {
    title: 'DERROTA',
    subtitle: 'El mercado inmobiliario ha podido contigo.',
  },
  gameOver: {
    victoryTitle: '🏠 Has firmado la hipoteca… a 40 años.',
    victorySubtitle: 'Euribor + 1,5%. Enhorabuena (?)',
    victoryButton: 'Volver a buscar piso',
    defeatTitle: 'Has vuelto a casa de tus padres.',
    defeatSubtitle: 'Tu habitación sigue igual que a los 15.',
    retry: 'Reintentar',
    level: (n: number) => `Nivel: ${n}`,
    kills: (n: number) => `Enemigos derrotados: ${n}`,
    brokenPromises: (n: number) => `Promesas incumplidas: ${n}`,
    evolutions: (n: number) => `Evoluciones: ${n}`,
    chests: (n: number) => `Cofres abiertos: ${n}`,
    timeSurvived: (t: string) => `Tiempo sobrevivido: ${t}`,
    share: '📤 Compartir',
    copied: '✅ ¡Copiado!',
    imageCopied: '✅ ¡Imagen copiada!',
    imageDownloaded: '✅ ¡Imagen descargada!',
    cardStats: (s: ShareStats) => `⏱ ${s.time} · ${shareStatsEs(s)}`,
    cardFooter: (url: string) => `▶ Juega gratis en ${url.replace(/^https?:\/\//, '')}`,
    manualCopy: 'Copia este texto para compartirlo:',
    shareVictory: (s: ShareStats) =>
      `🏠 He firmado una hipoteca a 40 años en Vivienda Survivors. ${shareStatsEs(s)}. ¿Y tú? ${s.url}`,
    shareDefeat: (s: ShareStats) =>
      `🛏️ He vuelto a casa de mis padres tras ${s.time} buscando piso en Vivienda Survivors. ${shareStatsEs(s)}. ¿Aguantas más? ${s.url}`,
  },
};

export type Texts = typeof ES;


const EN: Texts = {
  healing: (amount: number) => `+${amount}`,
  menu: {
    title: 'VIVIENDA SURVIVORS',
    subtitle: 'Survive 10 minutes of the housing market',
    play: 'Find a flat',
    best: (time: string) => `Best: ${time}`,
    noBest: 'Best: --:--',
    footer: 'Parody. Any resemblance to reality is purely coincidental (not).',
    language: 'Language:',
  },
  mobile: {
    rotate: 'Rotate your phone 📱↻',
    iosFullscreen: 'For fullscreen: Share → Add to Home Screen',
  },
  hud: {
    level: (n: number) => `Lv ${n}`,
  },
  pause: {
    title: 'PAUSED',
    hint: 'Esc / P or ⏸ to resume',
  },
  levelUp: {
    title: 'Promotion! (not a pay rise)',
    newItem: 'NEW!',
    levelChange: (from: number) => `Lv ${from} → ${from + 1}`,
    key: (n: number) => `[${n}]`,
    evolution: 'EVOLUTION!',
  },
  evolutionBanner: (name: string) => `${name}!`,
  evolutions: {
    linkedin: { name: 'LinkedIn Premium', desc: "Now with an 'Open to work' badge", effect: `Shoots in ${EV.linkedin.directions} directions, pierces everything and +${pctUp(EM.linkedin.damage)}% damage.` },
    antidesahucios: { name: 'Anti-Eviction Shield', desc: 'This time it is enforced', effect: `Aura +${pctUp(EM.antidesahucios.radius)}% radius and +${pctUp(EM.antidesahucios.damage)}% damage. Heals ${EV.antidesahucios.healPerKill} per enemy killed (max ${EV.antidesahucios.maxHealPerSecond}/s).` },
    manifestacion: { name: 'Mass Protest', desc: "We are thousands and we don't fit in 20 m²", effect: `Rate ×${decimal(1 / EM.manifestacion.cooldown, '.')}, radius ×${decimal(EM.manifestacion.radius, '.')}, strong knockback. 1 in ${EV.manifestacion.giantEvery} fills the screen.` },
    huelga: { name: 'General Strike', desc: 'Nobody pays today', effect: `${EV.huelga.orbs} fists, orbit +${pctUp(EM.huelga.orbitRadius)}%, +${pctUp(EM.huelga.damage)}% damage and fists ×${decimal(EM.huelga.size, '.')}.` },
  },
  weapons: {
    curriculum: { name: 'CV Launcher', desc: 'Throws CVs at the nearest enemy.', effect: 'Shoots the nearest enemy. Upgrades: more projectiles that pierce.' },
    escudo: { name: 'Housing Law Shield', desc: 'Protects you… in theory. Depends on your region.', effect: 'Permanent aura that damages everything near you.' },
    grito: { name: 'Shout "That\'s a storage room!"', desc: 'Shockwave that damages and pushes back whoever surrounds you.', effect: 'Periodic blast around you: damages and knocks back.' },
    sindicato: { name: 'Tenants\' Union', desc: 'Orbiting fists. Strength in unity.', effect: 'Fists orbit you and hit on contact. Upgrades: more fists.' },
  },
  passives: {
    aval: { name: 'Parents as Guarantors', desc: 'Your parents put their house on the line. No pressure.', effect: `+${PASSIVES.aval.maxHpPerLevel} max HP and heals ${PASSIVES.aval.healPerLevel}.` },
    piso: { name: 'Shared Flat', desc: '5 people, 1 bathroom. Peak efficiency.', effect: `−${pct(PASSIVES.piso.cooldownReductionPerLevel)}% cooldown on all weapons.` },
    bono: { name: 'Youth Rent Allowance', desc: 'Arrives late, but it arrives.', effect: `+${pct(PASSIVES.bono.pickupRadiusPerLevel)}% pickup radius and +${pct(PASSIVES.bono.speedPerLevel)}% speed.` },
    trabajo: { name: 'Second Job', desc: 'Rider by day, waiter by night.', effect: `+${pct(PASSIVES.trabajo.damagePerLevel)}% damage on all weapons.` },
    teletrabajo: { name: 'Remote Work', desc: 'No commute, no expenses. +0.3 HP/s', effect: `Regenerates +${PASSIVES.teletrabajo.regenPerLevel} HP/s.` },
  },
  cana: { name: 'Beer with Friends', desc: 'The only affordable thing', effect: `Heals ${CANA_HEAL} HP.` },
  grito: {
    shout: 'THAT\'S A STORAGE ROOM!',
    evolvedShout: 'WE ARE THOUSANDS!',
  },
  promises: {
    viviendas: 'A million public homes!',
    alquiler: 'We\'ll lower rents by decree!',
    ayudas: 'Direct aid for young people!',
    especulacion: 'We\'ll end speculation!',
    digna: 'Decent housing for everyone!',
  },
  promise: {
    spawned: '🗳️ Elections! A ballot box has appeared: grab it',
    title: (promise: string) => `🗳️ ${promise}`,
    effect: (e: PromiseEffect) => describeEffect(e, EN_EFFECT_LABELS, '.'),
    buffLine: (now: string, ifBroken: string) => `${now}  ·  If broken: ${ifBroken}`,
    question: (seconds: number) => `Will they keep it? ${seconds} s`,
    fulfilled: '✅ Promise kept! (miracle)',
    brokenTitle: (promise: string) => `❌ ${promise}`,
    broken: '❌ PROMISE BROKEN',
    brokenDetail: (effect: string, seconds: number) => `${effect} for ${seconds} s`,
  },
  enemies: {
    ipc: { name: 'Inflation Spike', desc: 'Rises slowly, but never stops.' },
    casero: { name: '11-Month-Lease Landlord', desc: 'Renews your contract every year… at a higher price.' },
    agencia: { name: 'Agency with Fees', desc: 'Gets there first and charges you for the viewing.' },
    fondo: { name: 'Vulture Fund', desc: 'Slow but tough. Buys whole buildings.' },
  },
  elite: {
    name: (base: string) => `Premium ${base}`,
    spawned: (name: string) => `Watch out! ${name} spotted: it drops a chest`,
  },
  chest: {
    title: 'You won a social housing flat!',
    subtitle: 'There were only 40,000 applications',
    skipHint: 'Tap or press any key to skip',
    jackpot: 'Lottery won! You can\'t believe it.',
    euros: 'Euros for 1 level',
    continue: 'Continue',
  },
  boss: {
    warning: '⚠️ BUBBLE 2.0 is inflating!',
    death: 'The bubble has burst… for now.',
  },
  victory: {
    title: 'VICTORY!',
    subtitle: `You lasted ${VICTORY_MINUTE} minutes… now it's time to sign.`,
  },
  defeat: {
    title: 'DEFEAT',
    subtitle: 'The housing market got the better of you.',
  },
  gameOver: {
    victoryTitle: '🏠 You signed the mortgage… for 40 years.',
    victorySubtitle: 'Euribor + 1.5%. Congratulations (?)',
    victoryButton: 'Go flat hunting again',
    defeatTitle: 'You moved back in with your parents.',
    defeatSubtitle: 'Your room is just like when you were 15.',
    retry: 'Retry',
    level: (n: number) => `Level: ${n}`,
    kills: (n: number) => `Enemies defeated: ${n}`,
    brokenPromises: (n: number) => `Broken promises: ${n}`,
    evolutions: (n: number) => `Evolutions: ${n}`,
    chests: (n: number) => `Chests opened: ${n}`,
    timeSurvived: (t: string) => `Time survived: ${t}`,
    share: '📤 Share',
    copied: '✅ Copied!',
    imageCopied: '✅ Image copied!',
    imageDownloaded: '✅ Image downloaded!',
    cardStats: (s: ShareStats) => `⏱ ${s.time} · ${shareStatsEn(s)}`,
    cardFooter: (url: string) => `▶ Play free at ${url.replace(/^https?:\/\//, '')}`,
    manualCopy: 'Copy this text to share it:',
    shareVictory: (s: ShareStats) =>
      `🏠 I signed a 40-year mortgage in Vivienda Survivors. ${shareStatsEn(s)}. Can you beat that? ${s.url}`,
    shareDefeat: (s: ShareStats) =>
      `🛏️ I moved back in with my parents after ${s.time} of flat hunting in Vivienda Survivors. ${shareStatsEn(s)}. Can you last longer? ${s.url}`,
  },
};

const DICTIONARIES: Record<Language, Texts> = { en: EN, es: ES };

/** Nombre de cada idioma en su propio idioma (para el selector del menú). */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', es: 'Español' };

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(DICTIONARIES, value);

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // localStorage no disponible: se usa el idioma por defecto.
  }
  return DEFAULT_LANGUAGE;
}

let currentLanguage: Language = loadLanguage();

/** Textos del idioma activo. Es un binding vivo: se actualiza al llamar a setLanguage(). */
export let TEXTS: Texts = DICTIONARIES[currentLanguage];

function applyDocumentLanguage(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = currentLanguage;
}
applyDocumentLanguage();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  TEXTS = DICTIONARIES[lang];
  applyDocumentLanguage();
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage no disponible: el idioma solo dura esta sesión.
  }
}
