# Vivienda Survivors — Documento de Diseño (GDD)

> Clon minimalista de *Vampire Survivors*: sátira sobre la crisis de la vivienda en España (2026) y las elecciones generales de noviembre de 2026.
> **Destinatario:** un agente de código (GitHub Copilot + Claude). Todo lo que no esté aquí **no se implementa**. Si algo es ambiguo, elige la opción más simple y anótala en `NOTES.md`.

---

## 0. Reglas para el agente
1. Stack fijo: **Phaser 3 (v3.80+) + TypeScript + Vite**. Sin backend, sin base de datos, sin librerías extra.
2. Arte: por defecto **emoji en `Text`** y una rejilla dibujada con `Graphics`. Audio: ninguno en el MVP.
3. **Visuales centralizados (obligatorio):** todo lo que se ve (jugador, enemigos, boss, euros, proyectiles, armas, pickups y el fondo/mapa) se dibuja **solo** a partir de una definición en **`src/visuals.ts`**, mediante la función única `createVisual()`. Ningún otro archivo puede llamar a `this.add.text`/`this.add.sprite`/`this.add.image` para entidades ni contener emoji o rutas de imagen. Ver sección 3.1.
4. Todos los números del juego viven en **`src/config.ts`**. Prohibido "números mágicos" en otros archivos.
5. Todos los textos visibles viven en **`src/texts.ts`**, en español (por defecto) e inglés; el idioma se elige en el menú.
6. Resolución lógica **960×540**, `Phaser.Scale.FIT`, centrado. Física **Arcade**.
7. No nombrar partidos ni políticos reales. La sátira es genérica ("el Candidato", "el Gobierno de turno").
8. Cada hito termina con `npm run build` sin errores y el juego jugable en `npm run dev`.

---

## 1. Concepto
Eres un **Joven de 30 años buscando piso**. Te persiguen oleadas de problemas inmobiliarios. Te mueves; las armas disparan solas. Recoges **euros** (XP), subes de nivel y eliges 1 de 3 mejoras. Cada 2 minutos aparece una **Promesa electoral**. Si aguantas **10 minutos**: *"Has firmado la hipoteca… a 40 años."*

---

## 2. Controles
| Plataforma | Movimiento | Pausa |
|---|---|---|
| Teclado | WASD y flechas (diagonal normalizada) | `Esc` / `P` |
| Móvil/táctil | Joystick virtual: tocar en cualquier punto de la mitad inferior crea el joystick ahí; radio 60 px | Botón ⏸ arriba a la derecha |

No hay botón de ataque. Elección de mejora: clic/tap, o teclas `1`, `2`, `3`.

---

## 3. Mapa y cámara
- Mundo **3000×3000 px**, fondo color `#2b2b2b` con rejilla de líneas cada 100 px (`#3a3a3a`) para notar el movimiento ("el solar").
- El jugador empieza en el centro. La cámara le sigue (`startFollow`, lerp 0.1). Límites del mundo = límites del jugador.
- Enemigos aparecen en un anillo **fuera de pantalla**: a distancia aleatoria entre **600 y 700 px** del jugador, ángulo aleatorio, recortado a los límites del mundo.
- Enemigos a más de **1200 px** del jugador se reposicionan en el anillo de spawn (no se destruyen).

### 3.1 Sistema de visuales (`src/visuals.ts`)
Tipos (en `src/types.ts`):
```ts
type EntityVisual =
  | { kind: 'emoji'; char: string; size: number }
  | { kind: 'sprite'; key: string; path: string; frameWidth?: number; frameHeight?: number;
      scale: number; anim?: { frames: number[]; frameRate: number; repeat: number } };
type BackgroundVisual =
  | { kind: 'grid'; colors: { bg: string; line: string }; cell: number }
  | { kind: 'image' | 'tileSprite'; key: string; path: string };
```
`src/visuals.ts` exporta un único objeto `VISUALS` con una entrada por cada ID:
`background, player, ipc, casero, agencia, fondo, boss, bossBullet, euro, promesa, curriculum, escudo, grito, sindicato` (y los iconos del HUD/level-up: `icon_<idArma|idPasiva>`, por defecto el mismo emoji).
Valores por defecto = los emoji/tamaños indicados en este GDD (p.ej. `player: {kind:'emoji', char:'🧑', size:32}`, `background: {kind:'grid', colors:{bg:'#2b2b2b', line:'#3a3a3a'}, cell:100}`). El aura del escudo y el círculo del grito pueden ser `emoji` o `sprite`; si son emoji se dibuja además el círculo con `Graphics` según su radio (eso es lógica de juego, no visual).

Reglas:
1. **`createVisual(scene, id, x, y): GameObject`** es la única fábrica. `emoji` → `Text` centrado (origin 0.5); `sprite` → `Sprite` con `scale` y, si hay `anim`, crea (una vez) y reproduce la animación `${key}_anim`. **`createBackground(scene, worldW, worldH)`** hace lo mismo para el fondo (`grid` → Graphics; `image` → Image estirada al mundo; `tileSprite` → TileSprite del tamaño del mundo).
2. **Precarga automática:** `BootScene.preload()` recorre `VISUALS` y carga toda entrada `sprite` (`load.spritesheet` si tiene `frameWidth`, si no `load.image`) y `image`/`tileSprite` (`load.image`). Rutas relativas a `public/`, p.ej. `assets/player.png`.
3. **Fallback:** si un archivo falla al cargar (`load.on('loaderror')` o `!textures.exists(key)`), `createVisual` usa el emoji por defecto de `FALLBACK_EMOJI[id]` (en `visuals.ts`) y `createBackground` usa la rejilla. Se registra un `console.warn`, nunca un error.
4. **Hitboxes independientes:** el radio de colisión viene de `config.ts` (`hitboxRadius`) y se aplica al cuerpo físico con `body.setCircle(r)` centrado, sin depender del tamaño del visual. Cambiar `size`/`scale` no cambia la jugabilidad.
5. **Cambiar arte = editar solo `visuals.ts` + poner un archivo en `public/assets/`.** Ningún otro archivo debe necesitar cambios.
6. Las entidades se implementan como un cuerpo físico (Arcade, invisible o contenedor) + el visual devuelto por `createVisual` siguiéndolo; los destellos de daño usan `setTint` en sprites y `setAlpha`/color en emoji (función `flashVisual()` en `visuals.ts`).

---

## 4. Jugador
| Stat | Valor |
|---|---|
| Representación | Emoji `🧑` tamaño 32 px, hitbox círculo r=14 |
| HP máximo | 100 |
| Velocidad | 200 px/s |
| Invulnerabilidad tras daño | 0.5 s (parpadeo alpha 0.5) |
| Radio de recogida (imán) | 60 px |
| Velocidad de atracción de euros | 400 px/s |
| Regeneración base | 0 HP/s |
| Arma inicial | Lanzador de currículums (nivel 1) |

Daño por contacto: cada enemigo en contacto aplica su daño como máximo una vez por ventana de invulnerabilidad.

---

## 5. Armas (máx. nivel 5)
Todas disparan automáticamente. "Nivel" sube al escogerla de nuevo en el level-up. Máximo **4 armas** a la vez (son todas las que existen).

### 5.1 📄 Lanzador de currículums (inicial)
Lanza un currículum hacia el enemigo **más cercano**. El proyectil desaparece al impactar (o al atravesar N enemigos) o a los 1.5 s.

| Nivel | Daño | Cooldown (s) | Proyectiles | Perforación | Vel. (px/s) |
|---|---|---|---|---|---|
| 1 | 10 | 1.0 | 1 | 1 | 450 |
| 2 | 12 | 0.9 | 1 | 1 | 450 |
| 3 | 14 | 0.9 | 2 | 1 | 450 |
| 4 | 16 | 0.8 | 2 | 2 | 500 |
| 5 | 20 | 0.7 | 3 | 2 | 500 |
Varios proyectiles: abanico de ±10° alrededor del objetivo.

### 5.2 🛡️ Escudo Ley de Vivienda
Aura circular permanente alrededor del jugador (círculo azul alpha 0.25). Daña a todo enemigo dentro cada *tick*.

| Nivel | Daño/tick | Tick (s) | Radio (px) |
|---|---|---|---|
| 1 | 4 | 0.5 | 70 |
| 2 | 5 | 0.5 | 80 |
| 3 | 6 | 0.45 | 90 |
| 4 | 8 | 0.4 | 100 |
| 5 | 10 | 0.35 | 115 |
Chiste (descripción): *"Protege… en teoría. Depende de tu comunidad autónoma."*

### 5.3 📢 Grito "¡Eso es un trastero!"
Explosión en área centrada en el jugador cada X s. Círculo blanco que crece de 0 al radio en 0.2 s y se desvanece. Texto flotante "¡ESO ES UN TRASTERO!" 0.6 s. Empuja (knockback 150 px/s durante 0.15 s).

| Nivel | Daño | Cooldown (s) | Radio (px) |
|---|---|---|---|
| 1 | 25 | 4.0 | 140 |
| 2 | 30 | 3.6 | 150 |
| 3 | 38 | 3.3 | 165 |
| 4 | 46 | 3.0 | 180 |
| 5 | 60 | 2.5 | 200 |

### 5.4 ✊ Sindicato de inquilinos
N círculos (emoji `✊`) orbitan al jugador. Dañan al tocar; cada enemigo solo puede recibir daño de una órbita cada 0.5 s.

| Nivel | Daño | Nº órbitas | Radio órbita (px) | Vel. angular (rad/s) |
|---|---|---|---|---|
| 1 | 8 | 2 | 90 | 3.0 |
| 2 | 10 | 2 | 95 | 3.3 |
| 3 | 12 | 3 | 100 | 3.6 |
| 4 | 14 | 4 | 105 | 3.9 |
| 5 | 18 | 5 | 110 | 4.2 |

---

## 6. Pasivas (máx. nivel 5)
| Pasiva | Emoji | Efecto por nivel | Descripción (chiste) |
|---|---|---|---|
| Aval de tus padres | 👴 | +20 HP máx (y cura 20) | "Tus padres avalan con su casa. Sin presión." |
| Piso compartido | 🛏️ | −8% cooldown de todas las armas | "5 personas, 1 baño. Eficiencia máxima." |
| Bono Alquiler Joven | 🎫 | +15% radio de recogida y +5% velocidad | "Llega tarde, pero llega." |
| Segundo trabajo | 💼 | +10% daño de todas las armas | "Riders de día, camarero de noche." |

Multiplicadores se acumulan aditivamente (nivel 5 Piso compartido = −40% cooldown).

---

## 7. Enemigos
Todos: se mueven en línea recta hacia el jugador; sin colisión entre enemigos (desactivada por rendimiento; pueden solaparse). Al morir sueltan 1 euro con el valor de XP indicado. Destello blanco 80 ms al recibir daño. Número flotante de daño opcional (desactivado por defecto).

| ID | Nombre | Emoji / forma | HP | Vel. (px/s) | Daño contacto | XP (€) | Hitbox r |
|---|---|---|---|---|---|---|---|
| `ipc` | Subida del IPC | `📈` 24 px | 10 | 90 | 5 | 1 | 11 |
| `casero` | Casero de contrato de 11 meses | `🤑` 28 px | 30 | 70 | 10 | 3 | 13 |
| `agencia` | Agencia con honorarios | `🏢` 30 px | 20 | 130 | 8 | 2 | 14 |
| `fondo` | Fondo buitre | `🦅` 40 px | 120 | 55 | 20 | 10 | 20 |

**Escalado:** HP de enemigos ×(1 + 0.10 × minuto actual). Velocidad no escala.

**Presentación:** la primera vez que aparece cada tipo de enemigo en la partida se muestra durante 4 s una tarjeta abajo al centro con su icono, nombre y una mini descripción (textos en `texts.ts`). Si coinciden varios, salen en cola, uno tras otro.

### 7.1 Boss: 🫧 Burbuja 2.0
- Aparece en el **minuto 8:00** (aviso en pantalla 3 s antes: *"⚠️ ¡Se está inflando la BURBUJA 2.0!"*).
- HP **3000**, velocidad **60 px/s**, daño contacto **30**, emoji 96 px, hitbox r=45, inmune a knockback.
- Barra de vida arriba en pantalla.
- Cada **5 s** dispara 8 proyectiles `💸` en anillo (daño 10, vel. 200 px/s, vida 3 s).
- Al morir: suelta 50 € de XP y texto *"La burbuja ha pinchado… de momento."* Si no muere, sigue viva hasta el final (no impide ganar).

---

## 8. Curva de aparición (spawn)
Un temporizador genera enemigos cada `intervalo` segundos, `cantidad` por tanda, eligiendo tipo según pesos. **Tope global de enemigos vivos: 300** (si se alcanza, no se genera).

| Minuto | Intervalo (s) | Cantidad/tanda | Pesos ipc / casero / agencia / fondo |
|---|---|---|---|
| 0–1 | 1.0 | 2 | 100 / 0 / 0 / 0 |
| 1–2 | 0.9 | 3 | 70 / 30 / 0 / 0 |
| 2–3 | 0.8 | 3 | 50 / 30 / 20 / 0 |
| 3–4 | 0.7 | 4 | 45 / 30 / 25 / 0 |
| 4–5 | 0.6 | 4 | 40 / 30 / 25 / 5 |
| 5–6 | 0.55 | 5 | 35 / 30 / 28 / 7 |
| 6–7 | 0.5 | 5 | 30 / 30 / 30 / 10 |
| 7–8 | 0.45 | 6 | 30 / 25 / 32 / 13 |
| 8–9 | 0.5 | 5 | 30 / 25 / 30 / 15 (+boss) |
| 9–10 | 0.35 | 8 | 25 / 25 / 30 / 20 |

**Oleada especial "Temporada turística":** en 5:00 aparece un anillo de 40 `agencia` a 650 px rodeando al jugador.

---

## 9. Experiencia (euros) y nivel
- Euro = círculo amarillo r=5 (o emoji `💶` 14 px). Valor según enemigo. No desaparecen. Si hay >400 euros en el suelo, el nuevo se suma al más cercano existente.
- XP necesaria para pasar del nivel *n* al *n+1*: **`xpToNext(n) = 5 + (n − 1) × 6`** (nivel 1→2: 5; 2→3: 11; 3→4: 17; …).
- Barra de XP en la parte superior. Si en una recogida se sube varios niveles, se encolan los menús.

### 9.1 Menú de subida de nivel
- Pausa el juego (`physics.pause()` + timers pausados).
- Muestra **3 opciones aleatorias distintas** del conjunto: armas no máximas (las no poseídas también) + pasivas no máximas.
- Cada tarjeta: emoji, nombre, "Nv X → X+1" o "¡NUEVO!", descripción corta.
- Si quedan <3 opciones válidas, rellena con **"Caña con los colegas"** (cura 30 HP, *"Lo único asequible"*).
- Título del menú: *"¡Ascenso! (de sueldo no)"*.

---

## 10. Mecánica electoral: Promesa electoral 🗳️
- Aparece en los minutos **2:00, 4:00, 6:00 y 8:00** (4 veces), en un punto aleatorio a 250–400 px del jugador. Flecha indicadora en el borde de pantalla si está fuera de vista. Desaparece a los 30 s si no se coge.
- Al cogerla: se elige una promesa al azar de la tabla. Buff **20 s**. Banner arriba con el texto y cuenta atrás.
- Al terminar el buff: **50%** → *"✅ ¡Promesa cumplida! (milagro)"*: no pasa nada más. **50%** → *"❌ PROMESA INCUMPLIDA"*: aplica el debuff **15 s**.

| Promesa (texto) | Buff 20 s | Debuff si incumplida 15 s |
|---|---|---|
| "¡Un millón de viviendas públicas!" | Daño ×2 | Daño ×0.6 |
| "¡Bajaremos el alquiler por decreto!" | Enemigos velocidad ×0.5 | Enemigos velocidad ×1.3 |
| "¡Ayudas directas a la juventud!" | Imán ×4 (recoge casi todo) y XP ×2 | XP ×0.5 |
| "¡Acabaremos con la especulación!" | Cooldowns ×0.5 | Cooldowns ×1.5 |
| "¡Vivienda digna para todos!" | Invulnerable | Velocidad del jugador ×0.6 |

Los efectos se aplican como multiplicadores temporales en un objeto `modifiers` consultado por armas/enemigos.

---

## 11. Fin de partida
- **Victoria:** al llegar a **10:00**. Se pausa todo, fondo oscuro, texto grande: **"🏠 Has firmado la hipoteca… a 40 años."** Subtexto: *"Euribor + 1,5%. Enhorabuena (?)"*. Estadísticas: nivel, enemigos derrotados, promesas incumplidas. Botón "Volver a buscar piso" (reinicia).
- **Derrota:** HP ≤ 0. Texto: **"Has vuelto a casa de tus padres."** Subtexto: *"Tu habitación sigue igual que a los 15."* Mismas estadísticas + tiempo sobrevivido. Botón "Reintentar".
- Récord (mejor tiempo) en `localStorage` clave `viviendaSurvivors.best`.

---

## 12. HUD
- Arriba: barra XP (ancho completo), debajo nivel `Nv 7` a la izquierda y temporizador `MM:SS` centrado.
- Arriba derecha: ⏸.
- Bajo el jugador: barra de vida 40×5 px (verde/rojo).
- Banner promesa (si activa) bajo el temporizador.
- Abajo izquierda: iconos de armas/pasivas con nivel.
- Abajo centro: tarjeta de presentación del enemigo nuevo (ver §7).
- Todo el HUD en una escena `UIScene` paralela (no se mueve con la cámara).

---

## 13. Escenas
1. `BootScene` → pasa directo a `MenuScene`.
2. `MenuScene`: título **"VIVIENDA SURVIVORS"**, subtítulo *"Sobrevive 10 minutos al mercado inmobiliario"*, botón "Buscar piso" (Enter/clic), récord. Pie: *"Parodia. Cualquier parecido con la realidad es pura coincidencia (no)."*
3. `GameScene` + `UIScene` (paralela).
4. `LevelUpScene` (overlay modal).
5. `GameOverScene` (victoria/derrota, recibe datos).

---

## 14. Estructura de archivos
```
vivienda-survivors/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts          # base: './' (necesario para itch.io)
├─ NOTES.md                # decisiones del agente
├─ public/
│  └─ assets/              # PNG/spritesheets opcionales (vacío al inicio, .gitkeep)
├─ src/
│  ├─ main.ts              # config Phaser y registro de escenas
│  ├─ config.ts            # TODOS los números (tablas de este GDD)
│  ├─ texts.ts             # TODOS los textos
│  ├─ visuals.ts           # TODAS las definiciones visuales + createVisual/createBackground/flashVisual
│  ├─ types.ts
│  ├─ scenes/
│  │  ├─ BootScene.ts      # precarga automática desde VISUALS
│  │  ├─ MenuScene.ts
│  │  ├─ GameScene.ts
│  │  ├─ UIScene.ts
│  │  ├─ LevelUpScene.ts
│  │  └─ GameOverScene.ts
│  ├─ entities/
│  │  ├─ Player.ts
│  │  ├─ Enemy.ts          # una clase, configurada por ID
│  │  ├─ Boss.ts
│  │  ├─ XpGem.ts
│  │  └─ PromesaPickup.ts
│  ├─ weapons/
│  │  ├─ Weapon.ts         # clase base: level, cooldown, update(dt)
│  │  ├─ Curriculums.ts
│  │  ├─ EscudoLey.ts
│  │  ├─ GritoTrastero.ts
│  │  └─ Sindicato.ts
│  ├─ systems/
│  │  ├─ Spawner.ts
│  │  ├─ Upgrades.ts       # generación de 3 opciones, aplicar mejora
│  │  ├─ Modifiers.ts      # buffs/debuffs (promesas + pasivas)
│  │  ├─ Elections.ts      # temporización de promesas
│  │  └─ Input.ts          # teclado + joystick virtual
│  └─ utils/
│     └─ math.ts
└─ dist/                   # salida de build (zip para itch.io)
```
Pools: usa `Phaser.Physics.Arcade.Group` con `maxSize` y reutilización (`get()`/`setActive(false)`) para enemigos, proyectiles y euros.

---

## 15. Hitos (con criterios de aceptación)

**H1 — Esqueleto**
- Vite + TS + Phaser; `npm run dev` abre canvas 960×540 escalado.
- Crear `src/visuals.ts` con tipos, `VISUALS`, `FALLBACK_EMOJI`, `createVisual`, `createBackground`, `flashVisual`, y la precarga automática en BootScene.
- ✅ `npm run build` genera `dist/` que funciona abriendo con un servidor estático. MenuScene → GameScene con un clic.
- ✅ `public/assets/` existe. BootScene no tiene rutas escritas a mano: todo lo que carga sale de `VISUALS`.

**H2 — Jugador y mapa**
- Mundo 3000×3000 con rejilla, jugador emoji, WASD/flechas, joystick táctil, cámara.
- ✅ Jugador y fondo creados solo con `createVisual('player')` y `createBackground()`; cambiar `size` del jugador en visuals.ts no cambia su hitbox (comprobar con `physics.arcade.debug`).
- ✅ Diagonal no más rápida que recta. Jugador no sale del mundo. Funciona en móvil (DevTools touch).

**H3 — Enemigos y spawner**
- Clase `Enemy` con los 4 tipos, tabla de spawn por minuto, tope 300, reposicionamiento a >1200 px, daño por contacto, invulnerabilidad, muerte del jugador → GameOverScene (derrota).
- ✅ Los 4 enemigos se crean con `createVisual(id)`; `grep` de emoji fuera de `visuals.ts` (y `texts.ts`) no da resultados en `src/entities`, `src/weapons`, `src/scenes`.
- ✅ Con una variable de debug `?min=7` en la URL el reloj empieza en ese minuto. 300 enemigos a ≥50 FPS en portátil normal.

**H4 — Arma inicial y XP**
- Currículums, muerte de enemigos, euros, imán, curva XP, barra XP, HUD temporizador y nivel.
- ✅ Matar 5 `ipc` (5 €) sube a nivel 2 (el menú puede ser un log por ahora).

**H5 — Level-up y mejoras**
- LevelUpScene con 3 opciones, las 4 armas y 4 pasivas con sus 5 niveles, "Caña con los colegas", teclas 1/2/3.
- ✅ El juego se pausa durante el menú. Ninguna opción supera nivel 5. Valores coinciden con `config.ts`.

**H6 — Promesas electorales**
- Pickup en 2/4/6/8 min, 5 promesas, buff 20 s, tirada 50%, debuff 15 s, banner y flecha indicadora.
- ✅ Con `?min=2` aparece al instante; tras 20 s se ve el resultado. Los efectos son medibles (p.ej., daño ×2).

**H7 — Boss, oleada turística, victoria**
- Burbuja 2.0 a los 8:00 con aviso, anillo de 💸, barra de vida; oleada de agencias en 5:00; victoria a 10:00.
- ✅ `?min=8` muestra el boss; a 10:00 aparece la pantalla de hipoteca con estadísticas; récord guardado en localStorage.

**H8 — Pulido y deploy**
- Destellos de daño, shake de cámara leve al recibir daño (100 ms, 0.005), pausa, textos finales, `base: './'`.
- ✅ `dist/` comprimido en zip se sube a itch.io como HTML5 (viewport 960×540, "Mobile friendly" activado) y funciona.

**H9 — Sprites personalizados**
- Probar el sistema de visuales con imágenes reales.
- ✅ Poner `public/assets/test_player.png` y `public/assets/test_bg.png` y cambiar **solo** `visuals.ts` (`player` → `{kind:'sprite', key:'test_player', path:'assets/test_player.png', scale:1}`, `background` → `{kind:'tileSprite', key:'test_bg', path:'assets/test_bg.png'}`): el juego muestra ambas imágenes sin tocar ningún otro archivo (`git diff --stat` solo muestra `visuals.ts` + los PNG).
- ✅ Hitbox del jugador idéntica a la de antes (debug físico).
- ✅ Una entrada `sprite` con `frameWidth/frameHeight/anim` reproduce la animación.
- ✅ Si se borra el PNG (o la ruta es incorrecta), el juego arranca igual usando el emoji de fallback y la rejilla, con un `console.warn` y sin errores.
- ✅ `npm run build` y la versión de itch.io cargan los assets (rutas relativas, `base: './'`).

**H10 — Multi-idioma (inglés y español)**
- `src/texts.ts` tiene un diccionario completo por idioma (inglés y español, mismo tipo `Texts`). `TEXTS` apunta siempre al idioma activo y se cambia con `setLanguage()`.
- Idiomas disponibles, idioma por defecto (`es`) y clave de localStorage en `src/config.ts`.
- Selector "Language: English | Español" en el menú de inicio, bajo el récord; el idioma activo aparece resaltado.
- ✅ Primera visita (sin localStorage): todo el juego sale en inglés.
- ✅ Al pulsar otro idioma en el menú, el menú se redibuja al instante en ese idioma y la partida (HUD, level-up, promesas, boss, pausa, fin de partida) sale en ese idioma.
- ✅ El idioma elegido se guarda en localStorage y se mantiene al recargar; si localStorage no está disponible, se usa inglés sin errores.
- ✅ `<html lang>` refleja el idioma activo. Ningún texto visible fuera de `texts.ts`.

**H11 — Sonido**
- Efectos cortos y una música en bucle, en tono de humor. Sin dependencias nuevas: se usa el sistema de audio de Phaser (Web Audio con fallback a HTML5 Audio).
- Archivos en `public/assets/audio/` (`.ogg` + `.mp3` de fallback). Las claves y rutas se definen **solo** en `src/sounds.ts` (mismo patrón que `visuals.ts`); el resto del código llama a `playSfx(scene, 'clave')`. Volúmenes y límites en `src/config.ts`.
- Efectos mínimos: disparo de currículum, impacto en enemigo, muerte de enemigo, recoger euro, subir de nivel, daño al jugador, recoger caja electoral, promesa cumplida, promesa incumplida, aviso del boss, victoria y derrota.
- Música: un tema del menú y otro de la partida en bucle. Al aparecer el boss puede subir de intensidad (opcional).
- Botón 🔊/🔇 en el menú y en la pausa. La preferencia se guarda en localStorage (`viviendaSurvivors.muted`). La tecla `M` silencia o reactiva el sonido.
- Límite de efectos simultáneos del mismo tipo (p. ej. máx. 4 impactos a la vez) para no saturar con hordas grandes.
- ✅ El audio arranca tras la primera interacción del usuario (política de autoplay), sin errores en consola.
- ✅ Si un archivo de audio falla, el juego sigue sin sonido para esa clave, con `console.warn` y sin errores.
- ✅ Silenciar se mantiene al recargar. Pausa y menú de mejoras pausan los efectos de la partida, no la música.
- ✅ Funciona en móvil (iOS Safari incluido) y en la versión de itch.io (rutas relativas).
- ✅ Todo el audio es libre de derechos (CC0 o creado para el juego); los créditos van en `README.md`.

**H12 — Compartir resultado**
- En la pantalla de fin de partida (victoria y derrota), un botón **"Compartir"** bajo el de reintentar.
- Genera un texto corto y gracioso con el resultado, en el idioma activo, desde `src/texts.ts`. Ejemplos:
  - Victoria: *"🏠 He firmado una hipoteca a 40 años en Vivienda Survivors. Nivel 17 · 1.234 caseros derrotados · 3 promesas incumplidas. ¿Y tú? <url>"*
  - Derrota: *"🛏️ He vuelto a casa de mis padres tras 04:12 buscando piso en Vivienda Survivors. ¿Aguantas más? <url>"*
- La URL del juego se define en `src/config.ts` (`SHARE_URL`).
- Comportamiento: si existe `navigator.share` (móvil), se abre el menú nativo de compartir. Si no, se copia el texto al portapapeles y el botón muestra *"¡Copiado!"* durante 2 s.
- Sin backend ni capturas de pantalla: solo texto + enlace. La vista previa del enlace la aportan las meta etiquetas Open Graph de `index.html`.
- ✅ En escritorio, al pulsar "Compartir" el texto queda en el portapapeles y aparece "¡Copiado!".
- ✅ En móvil se abre el menú nativo; si el usuario cancela, no hay errores.
- ✅ El texto refleja los datos reales de la partida (tiempo, nivel, enemigos, promesas incumplidas) y cambia según victoria o derrota.
- ✅ Si no hay ni `navigator.share` ni portapapeles disponible, el botón muestra el texto para copiarlo a mano, sin errores.

---

## 16. Fuera de alcance (NO hacer)
Personajes extra, varios mapas, evoluciones de armas, tienda/meta-progresión, cofres, guardado de partida, idiomas adicionales, backend, leaderboards. (Crear arte final no es tarea del agente; solo el sistema para cambiarlo.)

---

## 17. Prompt inicial para el agente (copiar y pegar)

```
Eres un desarrollador de videojuegos experto en Phaser 3 y TypeScript.
Vas a implementar "Vivienda Survivors", un clon minimalista de Vampire Survivors,
siguiendo ESTRICTAMENTE el documento GDD.md de la raíz del repositorio.

Reglas:
- Stack: Phaser 3 + TypeScript + Vite. Sin otras dependencias ni backend.
- Arte por defecto con emoji y una rejilla. TODO lo visible (jugador, enemigos,
  boss, euros, proyectiles, armas, pickups y fondo) se define SOLO en
  src/visuals.ts y se crea SOLO con createVisual()/createBackground()
  (sección 3.1). Las hitboxes salen de config.ts, nunca del tamaño del visual.
  BootScene precarga automáticamente los sprites/imágenes listados en VISUALS
  y, si fallan, se usa el emoji/rejilla de fallback. Cambiar el arte debe
  requerir solo editar visuals.ts y añadir archivos en public/assets/.
- Todos los números en src/config.ts y todos los textos en src/texts.ts,
  copiados exactamente de las tablas del GDD.
- Respeta la estructura de archivos de la sección 14.
- Trabaja hito a hito (sección 15, H1 a H12). Empieza por H1. Al terminar cada hito:
  1) ejecuta `npm run build` y corrige todos los errores,
  2) comprueba cada criterio de aceptación,
  3) haz commit con el mensaje "H<n>: <título>",
  4) resume lo hecho y espera mi confirmación antes del siguiente hito.
- Si algo es ambiguo, elige la opción más simple y anótala en NOTES.md.
- No implementes nada de la sección 16 (fuera de alcance).
- Prioriza rendimiento: usa pools de Arcade Groups para enemigos,
  proyectiles y euros.
- No nombres partidos ni políticos reales.

Empieza ahora con el hito H1.
```
