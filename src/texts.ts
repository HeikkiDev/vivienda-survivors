// TODOS los textos visibles (en español). Ver GDD.md.
import { CANA_HEAL, PASSIVES } from './config';

const pct = (ratio: number): number => Math.round(ratio * 100);

export const TEXTS = {
  menu: {
    title: 'VIVIENDA SURVIVORS',
    subtitle: 'Sobrevive 10 minutos al mercado inmobiliario',
    play: 'Buscar piso',
    best: (time: string) => `Récord: ${time}`,
    noBest: 'Récord: --:--',
    footer: 'Parodia. Cualquier parecido con la realidad es pura coincidencia (no).',
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
  },
  cana: { name: 'Caña con los colegas', desc: 'Lo único asequible', effect: `Cura ${CANA_HEAL} de vida.` },
  grito: {
    shout: '¡ESO ES UN TRASTERO!',
  },
  promises: {
    viviendas: '¡Un millón de viviendas públicas!',
    alquiler: '¡Bajaremos el alquiler por decreto!',
    ayudas: '¡Ayudas directas a la juventud!',
    especulacion: '¡Acabaremos con la especulación!',
    digna: '¡Vivienda digna para todos!',
  },
  promise: {
    fulfilled: '✅ ¡Promesa cumplida! (milagro)',
    broken: '❌ PROMESA INCUMPLIDA',
    countdown: (seconds: number) => `${seconds} s`,
  },
  boss: {
    warning: '⚠️ ¡Se está inflando la BURBUJA 2.0!',
    death: 'La burbuja ha pinchado… de momento.',
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
    timeSurvived: (t: string) => `Tiempo sobrevivido: ${t}`,
  },
} as const;
