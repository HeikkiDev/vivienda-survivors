import Phaser from 'phaser';
import { CHEST, DEPTH } from '../config';
import { createVisual } from '../visuals';

/** Cofre del tesoro en el suelo. No caduca ni le afecta el imán: se coge al tocarlo. */
export class ChestPickup extends Phaser.GameObjects.Zone {
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  private readonly baseScale: number;
  private pulse: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    const diameter = CHEST.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, 'chest', 0, 0).setDepth(DEPTH.euros).setVisible(false);
    this.baseScale = this.visual.scaleX;
    this.setActive(false);
  }

  spawn(x: number, y: number): void {
    this.setPosition(x, y).setActive(true);
    this.visual.setPosition(x, y).setScale(this.baseScale).setVisible(true);
    this.pulse = this.scene.tweens.add({
      targets: this.visual,
      scale: this.baseScale * CHEST.pulseScale,
      duration: CHEST.pulseMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  despawn(): void {
    this.setActive(false);
    this.pulse?.remove();
    this.pulse = null;
    this.visual.setVisible(false);
  }

  overlaps(px: number, py: number, playerRadius: number): boolean {
    const reach = CHEST.hitboxRadius + playerRadius;
    return this.active && (this.x - px) ** 2 + (this.y - py) ** 2 <= reach * reach;
  }
}
