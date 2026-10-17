import Phaser from 'phaser';
import { DEPTH, ELITE, ENEMIES, type EnemyStats } from '../config';
import type { EnemyId } from '../types';
import { createVisual, styleEliteVisual } from '../visuals';
import { Enemy } from './Enemy';

/** Stats de la versión "premium" de un enemigo (misma velocidad y XP). */
export function eliteStats(id: EnemyId): EnemyStats {
  const base = ENEMIES[id];
  return {
    ...base,
    hp: base.hp * ELITE.hpMultiplier,
    damage: base.damage * ELITE.damageMultiplier,
    hitboxRadius: base.hitboxRadius * ELITE.sizeMultiplier,
  };
}

/** Enemigo élite: más grande, dorado y con corona. Al morir suelta un cofre en lugar de euros. */
export class Elite extends Enemy {
  readonly elite = true;
  private readonly crown: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, readonly enemyId: EnemyId) {
    super(scene, enemyId, eliteStats(enemyId));
    styleEliteVisual(this.visual);
    this.crown = createVisual(scene, 'eliteCrown', 0, 0).setDepth(DEPTH.enemies).setVisible(false);
  }

  spawn(x: number, y: number, hpMultiplier: number): void {
    super.spawn(x, y, hpMultiplier);
    this.crown.setVisible(true);
    this.syncVisual();
  }

  deactivate(): void {
    super.deactivate();
    this.crown.setVisible(false);
  }

  syncVisual(): void {
    super.syncVisual();
    const top = this.y - this.stats.hitboxRadius - ELITE.crownGap;
    this.crown.setPosition(this.x, top - this.crown.displayHeight / 2).setAlpha(this.visual.alpha);
  }

  relocate(x: number, y: number): void {
    super.relocate(x, y);
    this.syncVisual();
  }
}
