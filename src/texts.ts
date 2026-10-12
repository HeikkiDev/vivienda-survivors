// TODOS los textos visibles (en español). Ver GDD.md.

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
  levelUp: {
    title: '¡Ascenso! (de sueldo no)',
    newItem: '¡NUEVO!',
    levelChange: (from: number) => `Nv ${from} → ${from + 1}`,
    key: (n: number) => `[${n}]`,
  },
  weapons: {
    curriculum: { name: 'Lanzador de currículums', desc: 'Lanza currículums al enemigo más cercano.' },
    escudo: { name: 'Escudo Ley de Vivienda', desc: 'Protege… en teoría. Depende de tu comunidad autónoma.' },
    grito: { name: 'Grito "¡Eso es un trastero!"', desc: 'Onda expansiva que daña y empuja a los que te rodean.' },
    sindicato: { name: 'Sindicato de inquilinos', desc: 'Puños en órbita. La unión hace la fuerza.' },
  },
  passives: {
    aval: { name: 'Aval de tus padres', desc: 'Tus padres avalan con su casa. Sin presión.' },
    piso: { name: 'Piso compartido', desc: '5 personas, 1 baño. Eficiencia máxima.' },
    bono: { name: 'Bono Alquiler Joven', desc: 'Llega tarde, pero llega.' },
    trabajo: { name: 'Segundo trabajo', desc: 'Riders de día, camarero de noche.' },
  },
  cana: { name: 'Caña con los colegas', desc: 'Lo único asequible' },
  grito: {
    shout: '¡ESO ES UN TRASTERO!',
  },
  gameOver: {
    defeatTitle: 'Has vuelto a casa de tus padres.',
    defeatSubtitle: 'Tu habitación sigue igual que a los 15.',
    retry: 'Reintentar',
    level: (n: number) => `Nivel: ${n}`,
    kills: (n: number) => `Enemigos derrotados: ${n}`,
    brokenPromises: (n: number) => `Promesas incumplidas: ${n}`,
    timeSurvived: (t: string) => `Tiempo sobrevivido: ${t}`,
  },
} as const;
