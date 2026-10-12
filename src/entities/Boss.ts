import Phaser from 'phaser';
import { BOSS, DEPTH } from '../config';
import { createVisual } from '../visuals';
import { Enemy } from './Enemy';

/** 7.1 Burbuja 2.0: un Enemy con más vida, inmune al empuje y que dispara anillos de billetes. */
export class Boss extends Enemy {
  private shootTimer = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 'boss', BOSS.stats, DEPTH.boss);
  }

  spawn(x: number, y: number, hpMultiplier: number): void {
    super.spawn(x, y, hpMultiplier);
    this.shootTimer = BOSS.shootInterval;
  }

  applyKnockback(): void {
    // Inmune al knockback.
  }

  /** Devuelve true cuando toca disparar un anillo. */
  tickShoot(dt: number): boolean {
    this.shootTimer -= dt;
    if (this.shootTimer > 0) return false;
    this.shootTimer += BOSS.shootInterval;
    return true;
  }
}

export class BossBullet extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  lifeLeft = 0;

  constructor(scene: Phaser.Scene) {
    const diameter = BOSS.bullet.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, 'bossBullet', 0, 0).setDepth(DEPTH.bossBullets).setVisible(false);
    this.setActive(false);
  }

  initBody(): void {
    this.body.setCircle(BOSS.bullet.hitboxRadius);
    this.body.enable = false;
  }

  fire(x: number, y: number, angle: number): void {
    this.lifeLeft = BOSS.bullet.lifetime;
    this.setActive(true);
    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setVelocity(Math.cos(angle) * BOSS.bullet.speed, Math.sin(angle) * BOSS.bullet.speed);
    this.visual.setVisible(true).setPosition(x, y);
  }

  deactivate(): void {
    this.setActive(false);
    this.body.stop();
    this.body.enable = false;
    this.visual.setVisible(false);
  }
}

/** Pool de proyectiles del boss. */
export class BossBulletPool {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group({ maxSize: BOSS.bulletPoolSize });
  }

  fireRing(x: number, y: number): void {
    const step = (Math.PI * 2) / BOSS.bulletCount;
    for (let i = 0; i < BOSS.bulletCount; i++) {
      let b = this.group.getFirstDead(false) as BossBullet | null;
      if (!b) {
        if (this.group.isFull()) return;
        b = new BossBullet(this.scene);
        this.group.add(b);
        b.initBody();
      }
      b.fire(x, y, i * step);
    }
  }

  update(dt: number): void {
    for (const b of this.group.getChildren() as BossBullet[]) {
      if (!b.active) continue;
      b.lifeLeft -= dt;
      if (b.lifeLeft <= 0) b.deactivate();
    }
  }

  syncVisuals(): void {
    for (const b of this.group.getChildren() as BossBullet[]) if (b.active) b.visual.setPosition(b.x, b.y);
  }
}
