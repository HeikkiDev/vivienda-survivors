import Phaser from 'phaser';
import { DEPTH, HEALTH_BAR, PLAYER } from '../config';
import { createVisual } from '../visuals';

/** Cuerpo físico invisible (hitbox de config.ts) + visual de visuals.ts que lo sigue. */
export class Player extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  private readonly healthBar: Phaser.GameObjects.Graphics;
  hp: number = PLAYER.maxHp;
  maxHp: number = PLAYER.maxHp;
  private invulnerableTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const diameter = PLAYER.hitboxRadius * 2;
    super(scene, x, y, diameter, diameter);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(PLAYER.hitboxRadius);
    this.body.setCollideWorldBounds(true);

    this.visual = createVisual(scene, 'player', x, y).setDepth(DEPTH.player);
    this.healthBar = scene.add.graphics().setDepth(DEPTH.healthBar);
    this.drawHealthBar();
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  get isInvulnerable(): boolean {
    return this.invulnerableTime > 0;
  }

  move(direction: Phaser.Math.Vector2): void {
    this.body.setVelocity(direction.x * PLAYER.speed, direction.y * PLAYER.speed);
  }

  tick(dt: number): void {
    if (this.invulnerableTime > 0) {
      this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
      this.visual.setAlpha(this.invulnerableTime > 0 ? PLAYER.invulnerabilityAlpha : 1);
    }
  }

  /** Aplica daño si no está en la ventana de invulnerabilidad. Devuelve true si lo recibió. */
  takeHit(damage: number): boolean {
    if (this.isInvulnerable || this.isDead) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerableTime = PLAYER.invulnerabilitySeconds;
    this.visual.setAlpha(PLAYER.invulnerabilityAlpha);
    this.drawHealthBar();
    return true;
  }

  /** Llamar después del paso de física para que el visual no vaya un frame por detrás. */
  syncVisual(): void {
    this.visual.setPosition(this.x, this.y);
    this.healthBar.setPosition(this.x, this.y + HEALTH_BAR.offsetY);
  }

  private drawHealthBar(): void {
    const w = HEALTH_BAR.width;
    const h = HEALTH_BAR.height;
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
    this.healthBar
      .clear()
      .fillStyle(HEALTH_BAR.bgColor, 1)
      .fillRect(-w / 2, -h / 2, w, h)
      .fillStyle(HEALTH_BAR.fgColor, 1)
      .fillRect(-w / 2, -h / 2, w * ratio, h);
  }
}
