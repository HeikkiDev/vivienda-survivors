import Phaser from 'phaser';
import {
  CANVAS_BG_COLOR,
  DEBUG_URL_PARAM,
  GAME_HEIGHT,
  GAME_WIDTH,
  PHYSICS_DEBUG,
  VIEW_MAX_HEIGHT,
  VIEW_MAX_WIDTH,
} from './config';
import { setupMobile } from './mobile';
import { BootScene } from './scenes/BootScene';
import { ChestScene } from './scenes/ChestScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { MenuScene } from './scenes/MenuScene';
import { UIScene } from './scenes/UIScene';

const debug = PHYSICS_DEBUG || new URLSearchParams(window.location.search).has(DEBUG_URL_PARAM);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: CANVAS_BG_COLOR,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    max: { width: VIEW_MAX_WIDTH, height: VIEW_MAX_HEIGHT },
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug },
  },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, GameScene, UIScene, LevelUpScene, ChestScene, GameOverScene],
});

setupMobile(game);
