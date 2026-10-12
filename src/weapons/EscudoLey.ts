import Phaser from 'phaser';
import { DEPTH, ESCUDO } from '../config';
import type { WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

/** 5.2 Escudo Ley de Vivienda: aura permanente que daña cada tick. */
export class EscudoLey extends Weapon {
  readonly id: WeaponId = 'escudo';
  private readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  /** Solo si el visual es emoji: el círculo del aura se dibuja con Graphics. */
  private readonly aura: Phaser.GameObjects.Graphics | null;

  constructor(ctx: WeaponContext) {
    super(ctx);
    const { scene, player } = ctx;
    this.visual = createVisual(scene, 'escudo', player.x, player.y);
    if (this.visual instanceof Phaser.GameObjects.Sprite) {
      this.aura = null;
      this.visual.setDepth(DEPTH.aura);
    } else {
      this.aura = scene.add.graphics().setDepth(DEPTH.aura);
      this.visual.setDepth(DEPTH.effects);
    }
    this.redraw();
  }

  private get stats() {
    return ESCUDO.levels[this.level - 1];
  }

  protected onLevelChanged(): void {
    this.redraw();
  }

  update(dt: number): void {
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;
    const s = this.stats;
    const { player } = this.ctx;
    const damage = this.scaledDamage(s.damage);
    this.ctx.forEachEnemy((e) => {
      const reach = s.radius + e.stats.hitboxRadius;
      if ((e.x - player.x) ** 2 + (e.y - player.y) ** 2 <= reach * reach) this.ctx.damageEnemy(e, damage);
    });
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
      this.aura.clear().fillStyle(ESCUDO.auraColor, ESCUDO.auraAlpha).fillCircle(0, 0, r);
    } else {
      this.visual.setDisplaySize(r * 2, r * 2);
    }
  }
}
