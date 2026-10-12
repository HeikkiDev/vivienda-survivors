import Phaser from 'phaser';
import { DEPTH, PROMESA } from '../config';
import { createVisual } from '../visuals';

/** Urna de la promesa electoral en el suelo. Solo hay una a la vez, así que no usa pool. */
export class PromesaPickup extends Phaser.GameObjects.Zone {
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  private timeLeft = 0;

  constructor(scene: Phaser.Scene) {
    const diameter = PROMESA.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, 'promesa', 0, 0).setDepth(DEPTH.euros).setVisible(false);
    this.setActive(false);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y).setActive(true);
    this.timeLeft = PROMESA.lifetime;
    this.visual.setPosition(x, y).setVisible(true);
  }

  despawn(): void {
    this.setActive(false);
    this.visual.setVisible(false);
  }

  /** Devuelve false cuando caduca. */
  tick(dt: number): boolean {
    if (!this.active) return false;
    this.timeLeft -= dt;
    if (this.timeLeft > 0) return true;
    this.despawn();
    return false;
  }

  overlaps(px: number, py: number, playerRadius: number): boolean {
    const reach = PROMESA.hitboxRadius + playerRadius;
    return this.active && (this.x - px) ** 2 + (this.y - py) ** 2 <= reach * reach;
  }
}
