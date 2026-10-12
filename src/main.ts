import Phaser from 'phaser';
import { CANVAS_BG_COLOR, GAME_HEIGHT, GAME_WIDTH, PHYSICS_DEBUG } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: CANVAS_BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: PHYSICS_DEBUG },
  },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, GameScene],
});
