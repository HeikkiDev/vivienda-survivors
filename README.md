# 🏠 Vivienda Survivors

> Tienes 30 años, buscas piso y te persigue el mercado inmobiliario.
> Aguanta **10 minutos** y conseguirás… firmar una hipoteca a 40 años.

Clon minimalista de *Vampire Survivors* y sátira (genérica) sobre la crisis de la vivienda. Hecho con **Phaser 3 + TypeScript + Vite**, sin backend.

## 🎮 Cómo se juega
- **Moverse:** WASD / flechas, o joystick táctil tocando la mitad inferior de la pantalla.
- **Atacar:** no hace falta, tus armas disparan solas.
- **Subir de nivel:** recoge 💶 y elige 1 de 3 mejoras (clic, tap o `1` `2` `3`).
- **Promesas electorales 🗳️:** cada 2 minutos. ¿Se cumplirá? Spoiler: probablemente no.
- **Pausa:** `Esc` / `P` o el botón ⏸.

## 🛠️ Desarrollo
```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
npm run zip      # zip listo para itch.io
```

Cada push a `main` se publica automáticamente en GitHub Pages.

## 🎨 Cambiar el arte
Todo lo visible está en [`src/visuals.ts`](src/visuals.ts): cambia un emoji por un sprite y añade el PNG en `public/assets/`. Si la imagen falla, vuelve al emoji.

El diseño completo está en [`GDD.md`](GDD.md).
