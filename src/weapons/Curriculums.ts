import Phaser from 'phaser';
import { CURRICULUM, DEPTH, EVOLUTIONS } from '../config';
import type { Enemy } from '../entities/Enemy';
import { AudioManager } from '../systems/AudioManager';
import type { EntityVisualId, WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

class CurriculumProjectile extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  readonly hitEnemies = new Set<Enemy>();
  damage = 0;
  pierceLeft = 0;
  lifeLeft = 0;

  constructor(scene: Phaser.Scene, visualId: EntityVisualId) {
    const diameter = CURRICULUM.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, visualId, 0, 0).setDepth(DEPTH.projectiles).setVisible(false);
    this.setActive(false);
  }

  /** Cambia el visual (al evolucionar el arma); conserva posición y visibilidad. */
  setVisualId(visualId: EntityVisualId): void {
    const old = this.visual;
    this.visual = createVisual(this.scene, visualId, old.x, old.y).setDepth(DEPTH.projectiles).setVisible(old.visible);
    old.destroy();
  }

  initBody(): void {
    this.body.setCircle(CURRICULUM.hitboxRadius);
    this.body.enable = false;
  }

  fire(x: number, y: number, angle: number, speed: number, damage: number, pierce: number): void {
    this.damage = damage;
    this.pierceLeft = pierce;
    this.lifeLeft = CURRICULUM.lifetime;
    this.hitEnemies.clear();
    this.setActive(true);
    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.visual.setVisible(true).setPosition(x, y);
  }

  deactivate(): void {
    this.setActive(false);
    this.body.stop();
    this.body.enable = false;
    this.visual.setVisible(false);
    this.hitEnemies.clear();
  }
}

/** 5.1 Lanzador de currículums: dispara al enemigo más cercano. */
export class Curriculums extends Weapon {
  readonly id: WeaponId = 'curriculum';
  private readonly pool: Phaser.Physics.Arcade.Group;
  private visualId: EntityVisualId = 'curriculum';

  constructor(ctx: WeaponContext) {
    super(ctx);
    this.pool = ctx.scene.physics.add.group({ maxSize: CURRICULUM.poolSize });
    ctx.scene.physics.add.overlap(this.pool, ctx.enemyGroups, (p, e) =>
      this.onHit(p as CurriculumProjectile, e as Enemy),
    );
  }

  private get stats() {
    return CURRICULUM.levels[this.level - 1];
  }

  update(dt: number): void {
    const children = this.pool.getChildren() as CurriculumProjectile[];
    for (const p of children) {
      if (!p.active) continue;
      p.lifeLeft -= dt;
      if (p.lifeLeft <= 0) p.deactivate();
    }

    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;
    const { player } = this.ctx;
    const target = this.ctx.findNearestEnemy(player.x, player.y);
    if (!target) return;

    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    if (this.evolved) {
      // LinkedIn Premium: un proyectil en cada dirección, empezando por la del objetivo.
      const e = EVOLUTIONS.linkedin;
      const damage = this.scaledDamage(e.damage);
      for (let i = 0; i < e.directions; i++) {
        this.spawnProjectile(player.x, player.y, baseAngle + (Math.PI * 2 * i) / e.directions, e.speed, damage, e.pierce);
      }
      AudioManager.playSfx('shoot');
      this.cooldownTimer = this.scaledCooldown(e.cooldown);
      return;
    }
    const s = this.stats;
    const spread = Phaser.Math.DegToRad(CURRICULUM.spreadDegrees);
    for (let i = 0; i < s.projectiles; i++) {
      const offset = s.projectiles === 1 ? 0 : -spread + (2 * spread * i) / (s.projectiles - 1);
      this.spawnProjectile(player.x, player.y, baseAngle + offset, s.speed, this.scaledDamage(s.damage), s.pierce);
    }
    AudioManager.playSfx('shoot');
    this.cooldownTimer = this.scaledCooldown(s.cooldown);
  }

  protected onEvolved(): void {
    this.visualId = 'linkedin';
    for (const p of this.pool.getChildren() as CurriculumProjectile[]) p.setVisualId(this.visualId);
  }

  syncVisuals(): void {
    const children = this.pool.getChildren() as CurriculumProjectile[];
    for (const p of children) if (p.active) p.visual.setPosition(p.x, p.y);
  }

  private spawnProjectile(x: number, y: number, angle: number, speed: number, damage: number, pierce: number): void {
    let p = this.pool.getFirstDead(false) as CurriculumProjectile | null;
    if (!p) {
      if (this.pool.isFull()) return;
      p = new CurriculumProjectile(this.ctx.scene, this.visualId);
      this.pool.add(p);
      p.initBody();
    }
    p.fire(x, y, angle, speed, damage, pierce);
  }

  private onHit(p: CurriculumProjectile, enemy: Enemy): void {
    if (!p.active || !enemy.active || p.hitEnemies.has(enemy)) return;
    p.hitEnemies.add(enemy);
    this.ctx.damageEnemy(enemy, p.damage);
    p.pierceLeft--;
    if (p.pierceLeft <= 0) p.deactivate();
  }
}
