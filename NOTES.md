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
- `public/assets/test_player.png` (spritesheet 4 frames de 32×32) y `test_bg.png` (tile 64×64) son PNG de prueba generados con un script de Python sin dependencias; no son arte final.
- El GDD pide `player` como `sprite` con `scale:1`; además se añaden `frameWidth/frameHeight/anim` a esa misma entrada para cubrir el criterio de animación sin tocar otra entrada.
- `git diff --stat` del cambio de arte: solo `src/visuals.ts` + los 2 PNG (este NOTES.md es solo documentación).
- Verificado: hitbox del jugador idéntica (radio 14, centrada) con sprite y con emoji; borrando los PNG el juego arranca con 🧑 y rejilla, solo `console.warn`; `npm run zip` incluye `assets/` y carga desde subruta.
- Para volver al arte por defecto basta con quitar las entradas `background` y `player` de `VISUALS`.
- Post-H9: el arte de prueba queda en `CUSTOM_ART` y se activa con `USE_CUSTOM_ART` (por defecto `false` → emoji + rejilla). Con `false` no se carga ningún PNG.
