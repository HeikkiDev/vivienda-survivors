# NOTES — decisiones del agente

## H1 — Esqueleto
- El proyecto vive en la raíz del repositorio (no en una subcarpeta `vivienda-survivors/`).
- Phaser fijado a `3.90.0` (última 3.x; la última de npm es 4.x y el GDD exige Phaser 3).
- Tamaños no especificados en el GDD (en `visuals.ts`): `bossBullet` 💸 20 px, `promesa` 🗳️ 32 px,
  `curriculum` 📄 20 px, `escudo` 🛡️ / `grito` 📢 / `sindicato` ✊ 24 px, iconos `icon_*` 24 px.
- Euro por defecto: emoji `💶` 14 px (el GDD permite círculo o emoji; el emoji encaja con `createVisual`).
- `VISUALS` = `{ background, ...FALLBACK_EMOJI }`: los valores por defecto son los mismos que los de fallback.
- `BootScene` recorre `VISUALS` mediante `getVisualAssets()` (en `visuals.ts`); no contiene rutas.
- Si un asset no se puede decodificar, Phaser hace `console.error`. En `BootScene` se sustituye
  `onProcessError` de cada archivo por una versión equivalente que usa `console.warn`.
  El 404 de red que pueda mostrar el navegador no es controlable desde el juego.
- `flashVisual(scene, visual, durationMs)` recibe la duración como parámetro (el valor irá en `config.ts`).
- Los textos de UI (menú) usan `this.add.text`; la regla de `createVisual` aplica solo a entidades.
- `GameScene` en H1 solo muestra fondo + jugador estático para validar `createBackground`/`createVisual`.
- Récord del menú: se lee `localStorage['viviendaSurvivors.best']` como segundos; si no existe, `--:--`.

## H2 — Jugador y mapa
- `?debug=1` en la URL activa `physics.arcade.debug` (o `PHYSICS_DEBUG` en `config.ts`).
- El jugador es una `Zone` con cuerpo Arcade circular (r de `PLAYER.hitboxRadius`); el visual se
  reposiciona en `POST_UPDATE` (tras el paso de física) y la cámara sigue a la `Zone`.
- La tabla completa del jugador (sección 4) ya está en `config.ts`; en H2 solo se usan hitbox y velocidad.
- Joystick: analógico (desplazamiento/radio, máx. 1). Se dibuja con `Graphics` en `Input.ts` porque es
  UI de control, no una entidad. Cualquier puntero (táctil o ratón) en la mitad inferior lo crea;
  mientras está activo, tiene prioridad sobre el teclado.
- El joystick vive en `GameScene` (con `setScrollFactor(0)`) hasta que exista `UIScene`.

## H3 — Enemigos y spawner
- Un `Arcade.Group` (pool, `maxSize` 300) por tipo de enemigo: cada `Enemy` crea su visual una sola vez y
  se reutiliza con `getFirstDead()`; el tope global de 300 vivos se cuenta en `Spawner`.
- El spawner acumula `dt` (no usa timers de Phaser) para que la pausa futura lo congele sin más.
- El minuto de la tabla de spawn y del escalado de HP es `floor(tiempo / 60)`, limitado a 0–9.
- Daño por contacto: invulnerabilidad global del jugador de 0,5 s; durante ella ningún enemigo hace daño.
- "Parpadeo alpha 0.5": el visual del jugador se queda a alpha 0,5 mientras dura la invulnerabilidad.
- La barra de vida bajo el jugador (sección 12) se adelanta a H3 para poder ver el daño; es `Graphics`
  en `Player.ts` (HUD, no entidad).
- `GameOverScene` ya existe con la variante de derrota; el récord (mejor tiempo, en segundos) se guarda al
  terminar la partida, excepto si se empezó con `?min=N` (debug).
- Rendimiento: Chrome headless limita rAF a ~31 FPS incluso con la escena vacía; con 300 enemigos el coste
  medido por frame es ~0,4 ms de update + ~0,25 ms de render (muy por debajo de 16,6 ms).

## H4 — Arma inicial y XP
- Hitbox del currículum (no indicada en el GDD): r = 8 (`CURRICULUM.hitboxRadius`). Pool de 100 proyectiles.
- Abanico: con N proyectiles se reparten uniformemente entre −10° y +10° (2 → ±10°, 3 → −10°/0°/+10°).
- "Perforación N" = número de enemigos que puede golpear antes de desaparecer; nunca golpea dos veces al mismo.
- Si no hay enemigos, el arma espera (no gasta el cooldown) y dispara en cuanto aparece uno.
- El visual del proyectil no se rota hacia su dirección.
- Euros: un euro entra en el imán (radio 60) y desde ese momento persigue al jugador a 400 px/s hasta tocarlo
  (distancia ≤ hitbox jugador + hitbox euro). Hitbox del euro r = 5 (el "r=5" del GDD).
- HUD (`UIScene`) lee el estado de `GameScene` cada frame (`GameScene.hud`); se lanza/para con `GameScene`.
- Subida de nivel en H4: se registra con `console.log` y se acumula en `pendingLevelUps` para el menú de H5.
- El destello de daño (80 ms, `flashVisual`) se aplica ya al herir enemigos (sección 7).

## H5 — Level-up y mejoras
- La pausa usa `scene.pause('GameScene')` (detiene update, física y reloj de partida); al reanudar se sueltan joystick y teclas.
- Niveles encolados: los menús se encadenan uno tras otro, regenerando opciones cada vez.
- Si hay menos de 3 opciones válidas se añade **una sola** carta "Caña con los colegas" (el menú puede mostrar menos de 3 cartas). Icono 🍺 (`icon_cana` en visuals.ts).
- Piso compartido reduce también el tick del escudo; no afecta al cooldown por enemigo del sindicato.
- Escudo y grito golpean si distancia ≤ radio + hitbox del enemigo.
- Grito: círculo crece 0,2 s y se desvanece 0,3 s (el GDD no fija el fade); emoji + texto sobre el jugador 0,6 s. Dispara nada más adquirirse.
- Sindicato: hitbox de cada puño r=12; cooldown de 0,5 s por enemigo guardado en el propio enemigo.
- Descripciones de armas (salvo la del escudo, que da el GDD) inventadas, en texts.ts.
- Post-H5: el casero pasa de 🧔 a 🤑 (a petición del usuario; 🧔 se confundía con el jugador 🧑). GDD actualizado.

## H6 — Promesas electorales
- Con `?min=N` se omiten las apariciones de minutos anteriores; la del minuto N (si es 2/4/6/8) sale al instante.
- Solo hay una urna a la vez (no se pueden solapar con los tiempos del GDD); es una entidad simple sin pool ni cuerpo físico: recogida por distancia ≤ radio urna (16) + hitbox jugador.
- La promesa se elige al azar uniforme entre las 5. Los multiplicadores de la promesa se multiplican sobre los de las pasivas en `Modifiers`.
- "Imán ×4" = radio de recogida ×4; "Cooldowns" afecta a los mismos cooldowns que Piso compartido.
- Invulnerable: se ignora el daño por contacto mientras dura el buff.
- Banner: buff = texto de la promesa + cuenta atrás; incumplida = "❌ PROMESA INCUMPLIDA" + cuenta atrás del debuff (15 s); cumplida = "✅ ¡Promesa cumplida! (milagro)" durante 3 s (duración no fijada en el GDD).
- La flecha indicadora es un triángulo `Graphics` en UIScene (indicador de HUD, no entidad), en el borde de pantalla en la dirección de la urna.
- "Promesas incumplidas" cuenta las tiradas fallidas.

## H7 — Boss, oleada turística, victoria
- `Boss` extiende `Enemy` (constructor generalizado a `visualId + stats`) en su propio Arcade Group; así las 4 armas le afectan sin cambios. Inmune al knockback del grito. HP fijo 3000 (sin escalado por minuto).
- El boss aparece en el anillo de spawn (600–700 px), persigue al jugador, no se reposiciona si se queda lejos y le afecta la promesa de velocidad de enemigos.
- Al morir suelta **un** euro de valor 50 y muestra el texto 3 s (duración no fijada en el GDD).
- Proyectiles 💸: pool propio, hitbox r=8 (no fijada en el GDD), primer anillo 5 s después de aparecer. Desaparecen al tocar al jugador aunque esté en invulnerabilidad.
- Aviso del boss y texto de muerte: rótulo centrado en el HUD. La barra de vida del boss va bajo el temporizador.
- Oleada turística: 40 `agencia` repartidas uniformemente en un círculo de 650 px (recortado al mundo), respetando el tope de 300.
- Con `?min=N` se omiten los eventos anteriores (oleada, aviso, boss); con `?min=8` el boss aparece al instante sin aviso.
- Victoria a 10:00: guarda récord 10:00 (si la partida no empezó con `?min`). La pantalla de victoria no muestra el tiempo (es 10:00).

## H8 — Pulido y deploy
- Shake de cámara (100 ms, 0.005) cada vez que el jugador recibe daño real (contacto o 💸).
- La invulnerabilidad ahora parpadea (alterna alpha 0,5/1 cada 0,1 s) en vez de quedarse fija a 0,5.
- Pausa gestionada en UIScene (no hay escena de pausa en la estructura del GDD): Esc, P o botón ⏸ (`icon_pause` en visuals.ts, arriba a la derecha) pausan/reanudan GameScene con velo y texto. No se puede pausar con el menú de nivel abierto.
- Textos finales de victoria/derrota ya completos desde H7.

### Deploy en itch.io
1. `npm run zip` → genera `vivienda-survivors.zip` (contenido de `dist/` con `index.html` en la raíz; rutas relativas por `base: './'`).
2. En itch.io: *Kind of project* = HTML, subir el zip y marcar *This file will be played in the browser*.
3. *Viewport dimensions* 960×540, activar *Mobile friendly* (orientación horizontal) y, opcionalmente, *Fullscreen button*.
- Comprobado sirviendo el zip descomprimido desde una subruta (`/html/12345/index.html`, como hace itch.io): carga sin errores ni 404.

## H9 — Sprites personalizados
- `public/assets/test_player.png` (spritesheet 4 frames de 32×32) y `test_bg.png` (tile 64×64) son PNG de prueba generados con un script de Python sin dependencias; no son arte final. Se borraron una vez sustituidos por el arte definitivo, para no incluirlos en el build.
- El GDD pide `player` como `sprite` con `scale:1`; además se añaden `frameWidth/frameHeight/anim` a esa misma entrada para cubrir el criterio de animación sin tocar otra entrada.
- `git diff --stat` del cambio de arte: solo `src/visuals.ts` + los 2 PNG (este NOTES.md es solo documentación).
- Verificado: hitbox del jugador idéntica (radio 14, centrada) con sprite y con emoji; borrando los PNG el juego arranca con 🧑 y rejilla, solo `console.warn`; `npm run zip` incluye `assets/` y carga desde subruta.
- Para volver al arte por defecto basta con quitar las entradas `background` y `player` de `VISUALS`.
- Post-H9: el arte de prueba queda en `CUSTOM_ART` y se activa con `USE_CUSTOM_ART` (por defecto `false` → emoji + rejilla). Con `false` no se carga ningún PNG.
- Post-H9 (petición del usuario): las tarjetas de level-up muestran, además del chiste del GDD, una línea `effect` con lo que hace cada arma/pasiva. Los números de las pasivas y la Caña se leen de `config.ts` (texts.ts importa PASSIVES y CANA_HEAL) para que nunca se desincronicen.

## Post-H9 — Multi-idioma (petición del usuario)
- El GDD tenía "idiomas" en *Fuera de alcance*; se implementa por petición explícita (GDD actualizado: español por defecto + inglés).
- `texts.ts` contiene un diccionario por idioma (`ES`, `EN: Texts`). `TEXTS` es un `export let` (binding vivo de ES modules) que `setLanguage()` reasigna, así que el resto del código sigue usando `TEXTS.x` sin cambios.
- Idiomas, idioma por defecto (`es`) y clave de localStorage (`viviendaSurvivors.lang`) en `config.ts`. Si localStorage no está disponible, el idioma solo dura la sesión.
- Selector en el menú (fila "Language: English | Español" bajo el récord); al cambiar se reinicia `MenuScene`. Solo se puede cambiar desde el menú.
- `<html lang>` se actualiza al idioma activo. El título "VIVIENDA SURVIVORS" no se traduce (es el nombre del juego).
- Para añadir un idioma: añadir el código a `LANGUAGES` en config.ts, un diccionario `Texts` y su nombre en `LANGUAGE_NAMES`.

## Post-H10 — Experiencia móvil (petición del usuario)
- Lógica en `src/mobile.ts` (`setupMobile`, `enterFullscreenLandscape`, `isIOSSafariBrowser`); números en `MOBILE` (config.ts) y textos en `TEXTS.mobile` (texts.ts, ES/EN). El emoji 📱↻ del aviso de girar vive en texts.ts porque es texto de interfaz HTML, no una entidad del juego.
- CSS: el padding `env(safe-area-inset-*)` va en `body` (box-sizing border-box) y `#game` ocupa el 100% de su área de contenido, porque Phaser mide el padre con `getBoundingClientRect()` (incluye padding) y el canvas pisaría los insets si el padding estuviera en `#game`.
- Vertical = `matchMedia('(orientation: portrait)')`, también en escritorio con ventana más alta que ancha (opción más simple). Mientras dura, se pausan todas las escenas en marcha (también las que arranquen después, vía `POST_STEP`) y al volver a horizontal se reanudan solo esas; las pausas propias del juego (menú de pausa, level-up) se respetan.
- Reescalado: además de los listeners de Phaser, `scale.refresh()` en `resize`/`orientationchange`/`visualViewport.resize` y otra vez tras `MOBILE.rescaleDelayMs` (los navegadores móviles dan el tamaño final con retraso).
- Iconos `public/icons/icon-192.png` y `icon-512.png`: PNG sencillos (casa amarilla sobre fondo oscuro) generados con Python sin dependencias.
- Verificado con Chrome en emulación móvil (Pixel 7 vertical/horizontal, iPhone 13): overlay en vertical, juego congelado y reanudado, sin scroll, aviso de iOS solo en iPhone, sin errores de consola.
- **Scale.EXPAND (petición del usuario, tras ver que en iOS con la barra del navegador el juego quedaba pequeño con FIT):** la vista base es 960×540 y crece para llenar la pantalla hasta `VIEW_MAX_WIDTH`×`VIEW_MAX_HEIGHT` (1400×720); más allá, franjas negras. En una pantalla 16:9 no cambia nada.
  - Menú, level-up y game over siguen maquetados en coordenadas base y centran la cámara en esa zona (`centerOnBaseArea` en `src/utils/layout.ts`); sus velos cubren la vista máxima.
  - El HUD (UIScene) se ancla a los bordes reales (`this.scale.width/height`) y se recoloca en cada `RESIZE`. El joystick usa la altura real.
  - Cambio de jugabilidad asumido: en pantallas más anchas se ve más mundo. Para que los enemigos sigan apareciendo fuera de la vista, el anillo de spawn empieza en `max(ringMinDistance, semidiagonal de la vista + offscreenMargin)` y mantiene su grosor (en 960×540 sigue en 600–700).
- El aviso de "Añadir a pantalla de inicio" se muestra en cualquier navegador de iOS no instalado (Chrome iOS también lo permite), no solo en Safari.

## Arte PNG
- Los PNG de `public/assets/` (salvo `test_*`) se generan por código (Pillow) a 2× el tamaño del emoji
  y se usan con `scale: 0.5` (`ART_SCALE` en `visuals.ts`). Los iconos de armas reutilizan el PNG del arma.
- `player.png` es una hoja de 4 frames de 64×64 (caminar). `getVisualAssets()` no repite claves.
- Fondo `bg_acera.png` (acera de baldosas, 128×128, sin costuras) generado por `tools/gen_background.py` (Pillow, semilla fija);
  `tools/preview_bg.png` es el mosaico 3×3 de comprobación.
- A petición del usuario, euro 22 px (GDD: 14) y promesa 44 px (GDD: 32) para que se vean en el mapa.
- `escudo.png` es de 480 px porque sin aura de Graphics se estira al diámetro del aura (hasta 230 px);
  el icono del HUD usa `icon_escudo.png` (48 px).

## Presentación de enemigos
- A petición del usuario (no estaba en el GDD original): la primera vez que aparece cada tipo de enemigo se muestra una tarjeta
  (icono + nombre + descripción) abajo al centro durante `UI.enemyIntro.seconds`. Es un elemento aparte del aviso del boss
  para no pisarse; si llegan varios a la vez, se encolan. El jefe no se presenta (ya tiene su aviso).

## Celebración de victoria
- A petición del usuario (no estaba en el GDD): al llegar a 10:00 la partida no salta directamente a `GameOverScene`.
  `GameScene` congela la física, hace flash blanco y zoom sobre el jugador, desvanece enemigos/boss y el jugador "late";
  `UIScene` muestra "¡VICTORIA!" con confeti (rectángulos de UI, no entidades) y un subtítulo. Tras `VICTORY_ANIM.durationMs`
  hay un fundido y aparece la pantalla de victoria. La derrota sigue siendo inmediata.
- Durante la celebración no se puede pausar, no se recibe daño (física pausada) y el HUD oculta banner de promesa, avisos,
  barra del boss y tarjeta de enemigo. El récord se guarda como 10:00 exactos. Números en `VICTORY_ANIM` y `UI.victory`, textos en `TEXTS.victory`.

## Animación de derrota (petición del usuario, fuera del GDD)
- Al morir: física en pausa, sacudida de cámara, destello rojo y zoom lento sobre el jugador, que cae de lado y se desvanece. Los enemigos se quedan congelados.
- En UIScene: velo rojo oscuro, título "DERROTA" que cae rebotando y subtítulo; tras `DEFEAT_ANIM.durationMs` se funde a negro y aparece GameOverScene.
- Victoria y derrota comparten `HudState.ending`; el confeti de la victoria se configura con `FallingPiecesConfig`.
- Depuración: `?win=1` gana nada más empezar la partida para ver la animación de victoria (no guarda récord).

## Promesas electorales más claras (petición del usuario)
- Al aparecer la urna: anuncio "🗳️ ¡Elecciones! Ha aparecido una urna: cógela" (`PROMESA.spawnAnnounceSeconds`); se quita al cogerla.
- Durante el buff, el banner explica la apuesta en 3 líneas: promesa, "<buff> · Si se incumple: <debuff>" y "¿Se cumplirá? N s".
- Al resolverse: anuncio central "✅ ¡Promesa cumplida! (milagro)" o "❌ PROMESA INCUMPLIDA" (`PROMESA.resolveAnnounceSeconds`), Si se cumple solo queda el aviso (el banner se oculta); si se incumple, el banner muestra la promesa y "<debuff> durante N s".
- Los efectos se describen en `texts.ts` a partir de los multiplicadores de `PROMISES` (config), sin duplicar números.
- El anuncio central baja a y=180 para no pisar el banner de 3 líneas.

## Publicación — meta etiquetas
- `index.html` incluye `description`, Open Graph y Twitter card en español (idioma de la sátira); no son texto del juego, por eso no van en `texts.ts`.
- `og:image` necesita URL absoluta: apunta a GitHub Pages (`public/og-image.jpg`, 1200×630, recorte de `docs/screenshot.png`). En itch.io la vista previa la gestiona la propia página de itch.

## H11 — Sonido
- Los efectos se sacan de los eventos del juego: `shoot` en cada ráfaga de currículums (no en cada proyectil), `hit` en cada daño a enemigo, `coin` por frame en que se recogen euros, `levelup` al abrir el menú de mejoras y en la victoria, `promise` al coger la caja y si la promesa se cumple, `hurt` al recibir daño y `death` en la derrota.
- La música va en `.ogg` y `.mp3`: Phaser elige el primer formato que soporta el navegador (Safari/iOS no siempre reproduce Ogg Vorbis). El vorbis nativo de ffmpeg es experimental y exige estéreo.
- El estado de silencio lo guarda `AudioManager`: en Web Audio, `sound.mute` se lee de un nodo de ganancia que no cambia al instante.
- `BootScene` sustituye la decodificación de audio de Phaser por una con `.catch`: la original hace `console.error` y deja una promesa rechazada sin capturar.
- El volumen de cada entrada vive en `sounds.ts` (como los tamaños en `visuals.ts`); los límites del gestor, en `config.ts`.

## H12 — Compartir resultado
- `navigator.share` solo se usa en dispositivos táctiles (`pointer: coarse`): Chrome y Safari de escritorio también lo tienen, pero el GDD pide portapapeles en escritorio.
- Si el usuario cancela el menú nativo (`AbortError`), no se hace nada. Si `share` falla por otro motivo, se intenta el portapapeles.
- Sin portapapeles (p. ej. iframe de itch.io sin permiso `clipboard-write`), el texto se muestra en un `window.prompt` para copiarlo a mano: es lo más simple y no añade UI.
- La cifra de enemigos usa `toLocaleString`; en español no agrupa los números de 4 cifras ("1234"), que es la norma de la RAE.
- Las partidas con `?min`/`?win` también se pueden compartir (no hay récord en juego).
- Se reubica el botón de reintentar (y 440 → 420) para dejar sitio al de compartir en 960×540.
