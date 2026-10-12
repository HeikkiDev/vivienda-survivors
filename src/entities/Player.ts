import Phaser from 'phaser';
import { DEPTH, PLAYER } from '../config';
import { createVisual } from '../visuals';

/** Cuerpo físico invisible (hitbox de config.ts) + visual de visuals.ts que lo sigue. */
export class Player extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const diameter = PLAYER.hitboxRadius * 2;
    super(scene, x, y, diameter, diameter);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(PLAYER.hitboxRadius);
    this.body.setCollideWorldBounds(true);

    this.visual = createVisual(scene, 'player', x, y).setDepth(DEPTH.player);
  }

  move(direction: Phaser.Math.Vector2): void {
    this.body.setVelocity(direction.x * PLAYER.speed, direction.y * PLAYER.speed);
  }

  /** Llamar después del paso de física para que el visual no vaya un frame por detrás. */
  syncVisual(): void {
    this.visual.setPosition(this.x, this.y);
  }
}
