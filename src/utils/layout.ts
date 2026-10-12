import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, VIEW_MAX_HEIGHT, VIEW_MAX_WIDTH } from '../config';

/** Llama a `fn` cada vez que cambia el tamaño del juego (Scale.EXPAND), hasta que la escena se apaga. */
export function onGameResize(scene: Phaser.Scene, fn: () => void): void {
  scene.scale.on(Phaser.Scale.Events.RESIZE, fn);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, fn));
}

/**
 * Para pantallas maquetadas en coordenadas base (GAME_WIDTH×GAME_HEIGHT): centra la cámara en esa zona,
 * de modo que el contenido queda centrado aunque la vista sea más ancha o más alta.
 */
export function centerOnBaseArea(scene: Phaser.Scene): void {
  const center = (): void => {
    scene.cameras.main.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  };
  center();
  onGameResize(scene, center);
}

/** Velo a pantalla completa para escenas centradas con `centerOnBaseArea` (cubre la vista máxima). */
export function addBaseOverlay(scene: Phaser.Scene, color: number, alpha: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, VIEW_MAX_WIDTH, VIEW_MAX_HEIGHT, color, alpha);
}
