import type Phaser from 'phaser';
import { DEPTH, EVOLUTIONS, SINDICATO, type SindicatoLevel } from '../config';
import type { WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

const TAU = Math.PI * 2;

/** 5.4 Sindicato de inquilinos: órbitas que dañan al tocar. Evoluciona a Huelga general. */
export class Sindicato extends Weapon {
  readonly id: WeaponId = 'sindicato';
  private orbs: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Sprite> = [];
  private angle = 0;
  private clock = 0;

  constructor(ctx: WeaponContext) {
    super(ctx);
    this.createOrbs();
  }

  private createOrbs(): void {
    for (const orb of this.orbs) orb.destroy();
    this.orbs = [];
    const count = this.evolved ? EVOLUTIONS.huelga.orbs : Math.max(...SINDICATO.levels.map((l) => l.orbs));
    const visualId = this.evolved ? 'huelga' : 'sindicato';
    for (let i = 0; i < count; i++) {
      this.orbs.push(createVisual(this.ctx.scene, visualId, this.ctx.player.x, this.ctx.player.y).setDepth(DEPTH.projectiles));
    }
    this.syncVisuals();
  }

  private get stats(): SindicatoLevel {
    return this.evolved ? EVOLUTIONS.huelga : SINDICATO.levels[this.level - 1];
  }

  protected onEvolved(): void {
    this.createOrbs();
  }

  update(dt: number): void {
    const s = this.stats;
    this.angle = (this.angle + s.angularSpeed * dt) % TAU;
    this.clock += dt;
    const { player } = this.ctx;
    const damage = this.scaledDamage(s.damage);
    const hitboxRadius = this.evolved ? EVOLUTIONS.huelga.hitboxRadius : SINDICATO.hitboxRadius;
    const ox: number[] = [];
    const oy: number[] = [];
    for (let i = 0; i < s.orbs; i++) {
      const a = this.angle + (TAU * i) / s.orbs;
      ox.push(player.x + Math.cos(a) * s.orbitRadius);
      oy.push(player.y + Math.sin(a) * s.orbitRadius);
    }
    this.ctx.forEachEnemy((e) => {
      if (this.clock < e.orbitHitReadyAt) return;
      const reach = hitboxRadius + e.stats.hitboxRadius;
      for (let i = 0; i < s.orbs; i++) {
        if ((e.x - ox[i]) ** 2 + (e.y - oy[i]) ** 2 <= reach * reach) {
          e.orbitHitReadyAt = this.clock + SINDICATO.hitCooldown;
          this.ctx.damageEnemy(e, damage);
          return;
        }
      }
    });
  }

  syncVisuals(): void {
    const s = this.stats;
    const { x, y } = this.ctx.player;
    this.orbs.forEach((orb, i) => {
      if (i >= s.orbs) {
        orb.setVisible(false);
        return;
      }
      const a = this.angle + (TAU * i) / s.orbs;
      orb.setVisible(true).setPosition(x + Math.cos(a) * s.orbitRadius, y + Math.sin(a) * s.orbitRadius);
    });
  }
}
