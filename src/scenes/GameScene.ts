import Phaser from 'phaser';
import { DEPTH, WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { createBackground, createVisual } from '../visuals';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    createVisual(this, 'player', cx, cy).setDepth(DEPTH.entities);
    this.cameras.main.centerOn(cx, cy);
  }
}
