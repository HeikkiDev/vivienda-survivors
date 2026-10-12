import type Phaser from 'phaser';
import { MAX_UPGRADE_LEVEL } from '../config';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { Modifiers } from '../systems/Modifiers';
import type { WeaponId } from '../types';

/** Lo que una arma necesita del juego. */
export interface WeaponContext {
  scene: Phaser.Scene;
  player: Player;
  modifiers: Modifiers;
  enemyGroups: Phaser.Physics.Arcade.Group[];
  findNearestEnemy(x: number, y: number): Enemy | null;
  forEachEnemy(cb: (e: Enemy) => void): void;
  damageEnemy(enemy: Enemy, amount: number): void;
}

/** Clase base: nivel, cooldown y update(dt). */
export abstract class Weapon {
  abstract readonly id: WeaponId;
  level = 1;
  protected cooldownTimer = 0;

  constructor(protected readonly ctx: WeaponContext) {}

  abstract update(dt: number): void;

  get isMaxLevel(): boolean {
    return this.level >= MAX_UPGRADE_LEVEL;
  }

  levelUp(): void {
    if (!this.isMaxLevel) this.level++;
    this.onLevelChanged();
  }

  protected onLevelChanged(): void {}

  /** Daño escalado por los modificadores globales. */
  protected scaledDamage(base: number): number {
    return base * this.ctx.modifiers.damage;
  }

  /** Cooldown escalado por los modificadores globales. */
  protected scaledCooldown(base: number): number {
    return base * this.ctx.modifiers.cooldown;
  }

  /** Hook para que cada arma sincronice sus visuales tras la física. */
  syncVisuals(): void {}
}
