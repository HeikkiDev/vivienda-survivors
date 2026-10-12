# 🏠 Vivienda Survivors

[![▶ Jugar ahora](https://img.shields.io/badge/%E2%96%B6%20Jugar%20ahora-heikkidev.github.io-ffd447?style=for-the-badge&labelColor=2a2a3a)](https://heikkidev.github.io/vivienda-survivors/)

> Tienes 30 años, buscas piso y te persigue el mercado inmobiliario.
> Aguanta **10 minutos** y conseguirás… firmar una hipoteca a 40 años.

Clon minimalista de *Vampire Survivors* y sátira (genérica) sobre la crisis de la vivienda. Hecho con **Phaser 3 + TypeScript + Vite**, sin backend.

## 🎮 Cómo se juega
- **Moverse:** WASD / flechas, o joystick táctil tocando la mitad inferior de la pantalla.
- **Atacar:** no hace falta, tus armas disparan solas.
- **Subir de nivel:** recoge 💶 y elige 1 de 3 mejoras (clic, tap o `1` `2` `3`).
- **Promesas electorales 🗳️:** cada 2 minutos. ¿Se cumplirá? Spoiler: probablemente no.
- **Pausa:** `Esc` / `P` o el botón ⏸.

## ⚔️ Armas (máx. nivel 5)
| Arma | Qué hace |
|---|---|
| 📄 **Lanzador de currículums** | Arma inicial. Dispara al enemigo más cercano; con nivel lanza más currículums y atraviesan enemigos. |
| 🛡️ **Escudo Ley de Vivienda** | Aura permanente que daña a todo lo que esté cerca de ti. Más radio y daño por nivel. |
| 📢 **¡Eso es un trastero!** | Grito periódico: explosión en área que daña y empuja a los enemigos. |
| ✊ **Sindicato de inquilinos** | Puños que orbitan a tu alrededor y golpean al pasar. Más puños por nivel. |

## 🧩 Mejoras pasivas (máx. nivel 5)
| Pasiva | Efecto por nivel |
|---|---|
| 👴 **Aval de tus padres** | +20 vida máxima (y cura 20) |
| 🛏️ **Piso compartido** | −8% tiempo de recarga de todas las armas |
| 🎫 **Bono Alquiler Joven** | +15% radio para recoger 💶 y +5% velocidad |
| 💼 **Segundo trabajo** | +10% daño de todas las armas |
| 🍺 **Caña con los colegas** | Cura 30. Aparece cuando ya no quedan otras mejoras. |

## 🗳️ Promesas electorales
Aparecen en los minutos 2, 4, 6 y 8 (una flecha indica dónde). Al cogerla tienes un **buff de 20 s**… y luego, al 50%, la promesa se cumple o se incumple y sufres un **debuff de 15 s**.

| Promesa | Buff | Si se incumple |
|---|---|---|
| ¡Un millón de viviendas públicas! | Daño ×2 | Daño ×0,6 |
| ¡Bajaremos el alquiler por decreto! | Enemigos a mitad de velocidad | Enemigos ×1,3 más rápidos |
| ¡Ayudas directas a la juventud! | Imán ×4 y XP ×2 | XP ×0,5 |
| ¡Acabaremos con la especulación! | Recargas ×0,5 | Recargas ×1,5 |
| ¡Vivienda digna para todos! | Invulnerable | Te mueves ×0,6 |

## 👾 Enemigos
| Enemigo | Cómo es |
|---|---|
| 📈 **Subida del IPC** | Débil y numeroso. |
| 🤑 **Casero de contrato de 11 meses** | Lento pero aguanta. |
| 🏢 **Agencia con honorarios** | Rápida. En el minuto 5 llega la *temporada turística*: 40 agencias te rodean. |
| 🦅 **Fondo buitre** | Grande, duro y pega fuerte. |
| 🫧 **Burbuja 2.0** (boss, min. 8) | 3000 de vida; cada 5 s dispara un anillo de 💸. No hace falta matarla para ganar. |

Los enemigos se hacen más resistentes cada minuto. Aguanta hasta el **10:00** para ganar.

## 🛠️ Desarrollo
```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
npm run zip      # zip listo para itch.io
```

Cada push a `main` se publica automáticamente en GitHub Pages.

## 🎨 Cambiar el arte
Todo lo visible está en [`src/visuals.ts`](src/visuals.ts):
1. Pon tus PNG en `public/assets/`.
2. Añádelos a `CUSTOM_ART` (sprite, spritesheet animado o fondo).
3. Pon `USE_CUSTOM_ART = true`.

Con `false` el juego usa emoji. Si una imagen falla, esa entidad vuelve a su emoji.

El diseño completo está en [`GDD.md`](GDD.md).
