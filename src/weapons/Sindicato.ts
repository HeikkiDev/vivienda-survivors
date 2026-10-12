import type Phaser from 'phaser';
import { DEPTH, SINDICATO } from '../config';
import type { WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

const TAU = Math.PI * 2;

/** 5.4 Sindicato de inquilinos: órbitas que dañan al tocar. */
export class Sindicato extends Weapon {
  readonly id: WeaponId = 'sindicato';
  private readonly orbs: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Sprite> = [];
  private angle = 0;
  private clock = 0;

  constructor(ctx: WeaponContext) {
    super(ctx);
    const maxOrbs = Math.max(...SINDICATO.levels.map((l) => l.orbs));
    for (let i = 0; i < maxOrbs; i++) {
      this.orbs.push(createVisual(ctx.scene, 'sindicato', ctx.player.x, ctx.player.y).setDepth(DEPTH.projectiles));
    }
    this.syncVisuals();
  }

  private get stats() {
    return SINDICATO.levels[this.level - 1];
  }

  update(dt: number): void {
    const s = this.stats;
    this.angle = (this.angle + s.angularSpeed * dt) % TAU;
    this.clock += dt;
    const { player } = this.ctx;
    const damage = this.scaledDamage(s.damage);
    const ox: number[] = [];
    const oy: number[] = [];
    for (let i = 0; i < s.orbs; i++) {
      const a = this.angle + (TAU * i) / s.orbs;
      ox.push(player.x + Math.cos(a) * s.orbitRadius);
      oy.push(player.y + Math.sin(a) * s.orbitRadius);
    }
    this.ctx.forEachEnemy((e) => {
      if (this.clock < e.orbitHitReadyAt) return;
      const reach = SINDICATO.hitboxRadius + e.stats.hitboxRadius;
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
