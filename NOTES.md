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
