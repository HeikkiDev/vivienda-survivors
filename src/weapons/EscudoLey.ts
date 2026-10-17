import Phaser from 'phaser';
import { DEPTH, ESCUDO, type EscudoLevel, EVOLUTIONS } from '../config';
import type { WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

/** 5.2 Escudo Ley de Vivienda: aura permanente que daña cada tick. Evoluciona a Escudo Antidesahucios. */
export class EscudoLey extends Weapon {
  readonly id: WeaponId = 'escudo';
  private visual!: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  /** Solo si el visual es emoji: el círculo del aura se dibuja con Graphics. */
  private aura: Phaser.GameObjects.Graphics | null = null;
  /** Vida que aún puede curar la evolución (se recarga a maxHealPerSecond por segundo). */
  private healBudget: number = EVOLUTIONS.antidesahucios.maxHealPerSecond;

  constructor(ctx: WeaponContext) {
    super(ctx);
    this.createVisuals();
  }

  private createVisuals(): void {
    const { scene, player } = this.ctx;
    this.visual?.destroy();
    this.aura?.destroy();
    this.visual = createVisual(scene, this.evolved ? 'antidesahucios' : 'escudo', player.x, player.y);
    if (this.visual instanceof Phaser.GameObjects.Sprite) {
      this.aura = null;
      this.visual.setDepth(DEPTH.aura).setAlpha(ESCUDO.spriteAlpha);
    } else {
      this.aura = scene.add.graphics().setDepth(DEPTH.aura);
      this.visual.setDepth(DEPTH.effects);
    }
    this.redraw();
  }

  private get stats(): EscudoLevel {
    return this.evolved ? EVOLUTIONS.antidesahucios : ESCUDO.levels[this.level - 1];
  }

  protected onLevelChanged(): void {
    this.redraw();
  }

  protected onEvolved(): void {
    this.createVisuals();
    this.syncVisuals();
  }

  update(dt: number): void {
    const evo = EVOLUTIONS.antidesahucios;
    if (this.evolved) this.healBudget = Math.min(evo.maxHealPerSecond, this.healBudget + evo.maxHealPerSecond * dt);
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;
    const s = this.stats;
    const { player } = this.ctx;
    const damage = this.scaledDamage(s.damage);
    let kills = 0;
    this.ctx.forEachEnemy((e) => {
      const reach = s.radius + e.stats.hitboxRadius;
      if ((e.x - player.x) ** 2 + (e.y - player.y) ** 2 <= reach * reach && this.ctx.damageEnemy(e, damage)) kills++;
    });
    if (this.evolved && kills > 0) {
      const heal = Math.min(this.healBudget, kills * evo.healPerKill);
      this.healBudget -= heal;
      player.heal(heal);
    }
    this.cooldownTimer = this.scaledCooldown(s.tick);
  }

  syncVisuals(): void {
    const { x, y } = this.ctx.player;
    if (this.aura) {
      this.aura.setPosition(x, y);
      this.visual.setPosition(x, y - this.stats.radius);
    } else {
      this.visual.setPosition(x, y);
    }
  }

  private redraw(): void {
    const r = this.stats.radius;
    if (this.aura) {
      const color = this.evolved ? EVOLUTIONS.antidesahucios.auraColor : ESCUDO.auraColor;
      const alpha = this.evolved ? EVOLUTIONS.antidesahucios.auraAlpha : ESCUDO.auraAlpha;
      this.aura.clear().fillStyle(color, alpha).fillCircle(0, 0, r);
    } else {
      this.visual.setDisplaySize(r * 2, r * 2);
    }
  }
}
