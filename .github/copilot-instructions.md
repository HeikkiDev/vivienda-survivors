Instrucciones del proyecto: Vivienda Survivors
Este repositorio es "Vivienda Survivors", un clon minimalista de Vampire Survivors. La fuente de verdad es GDD.md en la raíz. Si algo no está en el GDD, no se implementa.
Stack
Phaser 3 (v3.80+), TypeScript y Vite. Sin backend ni dependencias extra.
Resolución lógica 960×540, Phaser.Scale.FIT, física Arcade.
base: './' en Vite para que funcione en itch.io.
Reglas obligatorias
Visuales: todo lo visible (jugador, enemigos, boss, euros, proyectiles, armas, pickups, iconos del HUD y fondo) se define solo en src/visuals.ts y se crea solo con createVisual() / createBackground(). Ningún otro archivo usa this.add.text, this.add.sprite o this.add.image para entidades, ni contiene emoji o rutas de imagen.
Las hitboxes salen de src/config.ts, nunca del tamaño del visual.
Si un sprite o imagen no carga, se usa el emoji o la rejilla de fallback con console.warn, sin errores.
Cambiar el arte debe requerir solo editar visuals.ts y añadir archivos en public/assets/.
Todos los números del juego van en src/config.ts. Nada de números mágicos.
Todos los textos visibles van en src/texts.ts, en español.
Usa pools de Arcade Groups para enemigos, proyectiles y euros.
No nombres partidos ni políticos reales. La sátira es genérica.
No implementes nada de la sección "Fuera de alcance" del GDD.
Forma de trabajar
Trabaja de hito en hito (H1 a H9 del GDD) y solo el hito que te pida.
Al terminar cada hito: npm run build sin errores, comprueba cada criterio de aceptación, haz commit con "H<n>: <título>", resume lo hecho y espera mi confirmación.
Si algo es ambiguo, elige la opción más simple y anótala en NOTES.md.