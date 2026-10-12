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
