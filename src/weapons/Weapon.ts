import type Phaser from 'phaser';
import { MAX_UPGRADE_LEVEL } from '../config';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { WeaponId } from '../types';

/** Lo que una arma necesita del juego. */
export interface WeaponContext {
  scene: Phaser.Scene;
  player: Player;
  enemyGroups: Phaser.Physics.Arcade.Group[];
  findNearestEnemy(x: number, y: number): Enemy | null;
  damageEnemy(enemy: Enemy, amount: number): void;
}

/** Clase base: nivel, cooldown y update(dt). */
export abstract class Weapon {
  abstract readonly id: WeaponId;
  level = 1;
  protected cooldownTimer = 0;

  constructor(protected readonly ctx: WeaponContext) {}

  abstract update(dt: number): void;

  levelUp(): void {
    if (this.level < MAX_UPGRADE_LEVEL) this.level++;
  }

  /** Hook para que cada arma sincronice sus visuales tras la física. */
  syncVisuals(): void {}
}
