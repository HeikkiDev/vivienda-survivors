import Phaser from 'phaser';
import { DEPTH, ENEMIES, type EnemyStats } from '../config';
import type { EnemyId } from '../types';
import { createVisual } from '../visuals';

/** Enemigo genérico configurado por ID. Cuerpo físico invisible + visual que lo sigue. */
export class Enemy extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly enemyId: EnemyId;
  readonly stats: EnemyStats;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  hp = 0;
  maxHp = 0;
  /** Momento (reloj del Sindicato) a partir del cual una órbita puede volver a dañarle. */
  orbitHitReadyAt = -Infinity;
  private knockbackLeft = 0;
  private knockbackVx = 0;
  private knockbackVy = 0;

  constructor(scene: Phaser.Scene, enemyId: EnemyId) {
    const stats = ENEMIES[enemyId];
    const diameter = stats.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    this.enemyId = enemyId;
    this.stats = stats;
    scene.add.existing(this);
    this.visual = createVisual(scene, enemyId, 0, 0).setDepth(DEPTH.enemies).setVisible(false);
    this.setActive(false);
  }

  /** Configura el cuerpo; llamar después de añadirlo al grupo de física (el grupo crea el body). */
  initBody(): void {
    this.body.setCircle(this.stats.hitboxRadius);
    this.body.enable = false;
  }

  spawn(x: number, y: number, hpMultiplier: number): void {
    this.maxHp = this.stats.hp * hpMultiplier;
    this.hp = this.maxHp;
    this.orbitHitReadyAt = -Infinity;
    this.knockbackLeft = 0;
    this.setActive(true);
    this.body.enable = true;
    this.body.reset(x, y);
    this.visual.setVisible(true).setPosition(x, y);
  }

  relocate(x: number, y: number): void {
    this.body.reset(x, y);
    this.visual.setPosition(x, y);
  }

  /** Empuja en la dirección (dx, dy) a `speed` px/s durante `seconds`. */
  applyKnockback(dx: number, dy: number, speed: number, seconds: number): void {
    const len = Math.hypot(dx, dy) || 1;
    this.knockbackVx = (dx / len) * speed;
    this.knockbackVy = (dy / len) * speed;
    this.knockbackLeft = seconds;
  }

  chase(tx: number, ty: number, speedMultiplier: number, dt: number): void {
    if (this.knockbackLeft > 0) {
      this.knockbackLeft -= dt;
      this.body.setVelocity(this.knockbackVx, this.knockbackVy);
      return;
    }
    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      this.body.setVelocity(0, 0);
      return;
    }
    const v = (this.stats.speed * speedMultiplier) / len;
    this.body.setVelocity(dx * v, dy * v);
  }

  /** Resta vida; devuelve true si muere. */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    return this.hp <= 0;
  }

  deactivate(): void {
    this.setActive(false);
    this.body.stop();
    this.body.enable = false;
    this.visual.setVisible(false);
  }

  syncVisual(): void {
    this.visual.setPosition(this.x, this.y);
  }
}
