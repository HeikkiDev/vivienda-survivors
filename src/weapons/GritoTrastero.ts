import Phaser from 'phaser';
import { DEPTH, EVOLUTIONS, GRITO, type GritoLevel, UI } from '../config';
import { TEXTS } from '../texts';
import type { WeaponId } from '../types';
import { createVisual } from '../visuals';
import { Weapon, type WeaponContext } from './Weapon';

/** 5.3 Grito "¡Eso es un trastero!": explosión en área con empuje. Evoluciona a Manifestación. */
export class GritoTrastero extends Weapon {
  readonly id: WeaponId = 'grito';
  private visual!: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  private isSprite = false;
  /** Solo si el visual es emoji: el círculo se dibuja con Graphics. */
  private circle: Phaser.GameObjects.Graphics | null = null;
  private readonly shout: Phaser.GameObjects.Text;
  /** Segundos desde la última explosión (−1 = sin animación). */
  private effectTime = -1;
  private effectRadius = 0;
  /** Explosiones desde la evolución (cada `giantEvery`, una gigante). */
  private evolvedBlasts = 0;

  constructor(ctx: WeaponContext) {
    super(ctx);
    const { scene, player } = ctx;
    this.createVisuals();
    this.shout = scene.add
      .text(player.x, player.y, TEXTS.grito.shout, {
        fontFamily: UI.fontFamily,
        fontSize: `${GRITO.textSize}px`,
        fontStyle: 'bold',
        color: GRITO.textColor,
        stroke: GRITO.textStroke,
        strokeThickness: GRITO.textStrokeThickness,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.floatingText)
      .setVisible(false);
  }

  private createVisuals(): void {
    const { scene, player } = this.ctx;
    this.visual?.destroy();
    this.circle?.destroy();
    this.visual = createVisual(scene, this.evolved ? 'manifestacion' : 'grito', player.x, player.y).setVisible(false);
    this.isSprite = this.visual instanceof Phaser.GameObjects.Sprite;
    this.visual.setDepth(DEPTH.effects);
    this.circle = this.isSprite ? null : scene.add.graphics().setDepth(DEPTH.effects).setVisible(false);
  }

  private get stats(): GritoLevel {
    return this.evolved ? EVOLUTIONS.manifestacion : GRITO.levels[this.level - 1];
  }

  protected onEvolved(): void {
    this.effectTime = -1;
    this.evolvedBlasts = 0;
    this.createVisuals();
    this.shout.setText(TEXTS.grito.evolvedShout).setVisible(false);
  }

  update(dt: number): void {
    if (this.effectTime >= 0) this.effectTime += dt;
    this.cooldownTimer -= dt;
    if (this.cooldownTimer > 0) return;
    this.blast();
    this.cooldownTimer = this.scaledCooldown(this.stats.cooldown);
  }

  private blast(): void {
    const s = this.stats;
    const evo = EVOLUTIONS.manifestacion;
    const { player } = this.ctx;
    const damage = this.scaledDamage(s.damage);
    let radius = s.radius;
    if (this.evolved) {
      this.evolvedBlasts++;
      if (this.evolvedBlasts % evo.giantEvery === 0) radius = evo.giantRadius;
    }
    const knockbackSpeed = this.evolved ? evo.knockbackSpeed : GRITO.knockbackSpeed;
    const knockbackSeconds = this.evolved ? evo.knockbackSeconds : GRITO.knockbackSeconds;
    this.ctx.forEachEnemy((e) => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const reach = radius + e.stats.hitboxRadius;
      if (dx * dx + dy * dy > reach * reach) return;
      e.applyKnockback(dx, dy, knockbackSpeed, knockbackSeconds);
      this.ctx.damageEnemy(e, damage);
    });
    this.effectTime = 0;
    this.effectRadius = radius;
    const color = this.evolved ? evo.circleColor : GRITO.circleColor;
    this.circle?.clear().fillStyle(color, 1).fillCircle(0, 0, radius);
  }

  syncVisuals(): void {
    const t = this.effectTime;
    const { x, y } = this.ctx.player;
    const circleEnd = GRITO.growSeconds + GRITO.fadeSeconds;
    const end = Math.max(circleEnd, GRITO.floatingTextSeconds);
    if (t < 0 || t > end) {
      this.effectTime = -1;
      this.circle?.setVisible(false);
      this.visual.setVisible(false);
      this.shout.setVisible(false);
      return;
    }

    // Círculo: crece de 0 al radio y se desvanece.
    const grow = Math.min(1, t / GRITO.growSeconds);
    const fade = t <= GRITO.growSeconds ? 1 : Math.max(0, 1 - (t - GRITO.growSeconds) / GRITO.fadeSeconds);
    const circleAlpha = (this.evolved ? EVOLUTIONS.manifestacion.circleAlpha : GRITO.circleAlpha) * fade;
    if (this.circle) {
      this.circle.setVisible(t <= circleEnd).setPosition(x, y).setScale(grow).setAlpha(circleAlpha);
    } else {
      const d = this.effectRadius * 2 * grow;
      this.visual.setVisible(t <= circleEnd).setPosition(x, y).setDisplaySize(d, d).setAlpha(circleAlpha);
    }

    // Texto flotante (y el icono si es emoji).
    const textT = t / GRITO.floatingTextSeconds;
    const textVisible = textT <= 1;
    const textAlpha = 1 - Math.min(1, textT);
    const rise = GRITO.floatingTextRise * Math.min(1, textT);
    this.shout.setVisible(textVisible).setPosition(x, y - GRITO.textOffsetY - rise).setAlpha(textAlpha);
    if (!this.isSprite) {
      this.visual.setVisible(textVisible).setPosition(x, y - GRITO.iconOffsetY - rise).setAlpha(textAlpha);
    }
  }
}
