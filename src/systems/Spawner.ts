import Phaser from 'phaser';
import {
  ENEMIES,
  ENEMY_HP_SCALE_PER_MINUTE,
  ENEMY_IDS,
  SECONDS_PER_MINUTE,
  SPAWN,
  SPAWN_TABLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import { Enemy } from '../entities/Enemy';
import type { EnemyId } from '../types';
import { randomPointInRing, weightedPick } from '../utils/math';

/** Pools de enemigos (un Arcade Group por tipo) + curva de aparición por minuto. */
export class Spawner {
  readonly groups: Record<EnemyId, Phaser.Physics.Arcade.Group>;
  readonly groupList: Phaser.Physics.Arcade.Group[];
  private accumulator = 0;
  private alive = 0;
  private readonly point = { x: 0, y: 0 };

  constructor(private readonly scene: Phaser.Scene) {
    const make = () => scene.physics.add.group({ maxSize: SPAWN.maxAlive });
    this.groups = { ipc: make(), casero: make(), agencia: make(), fondo: make() };
    this.groupList = ENEMY_IDS.map((id) => this.groups[id]);
  }

  get aliveCount(): number {
    return this.alive;
  }

  static minuteOf(elapsedSeconds: number): number {
    return Math.min(SPAWN_TABLE.length - 1, Math.max(0, Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)));
  }

  update(dt: number, elapsedSeconds: number, px: number, py: number): void {
    const minute = Spawner.minuteOf(elapsedSeconds);
    const row = SPAWN_TABLE[minute];
    this.accumulator += dt;
    while (this.accumulator >= row.interval) {
      this.accumulator -= row.interval;
      for (let i = 0; i < row.count; i++) {
        if (this.alive >= SPAWN.maxAlive) break;
        this.spawn(weightedPick(row.weights, ENEMY_IDS), minute, px, py);
      }
    }
  }

  spawn(id: EnemyId, minute: number, px: number, py: number): Enemy | null {
    const p = this.ringPoint(px, py);
    return this.spawnAt(id, minute, p.x, p.y);
  }

  /** Genera un enemigo en (x, y), respetando el tope global. */
  spawnAt(id: EnemyId, minute: number, x: number, y: number): Enemy | null {
    if (this.alive >= SPAWN.maxAlive) return null;
    const group = this.groups[id];
    let enemy = group.getFirstDead(false) as Enemy | null;
    if (!enemy) {
      if (group.isFull()) return null;
      enemy = new Enemy(this.scene, id, ENEMIES[id]);
      group.add(enemy);
      enemy.initBody();
    }
    enemy.spawn(x, y, 1 + ENEMY_HP_SCALE_PER_MINUTE * minute);
    this.alive++;
    return enemy;
  }

  /** Persigue al jugador y reposiciona en el anillo a los que se alejan demasiado. */
  updateEnemies(px: number, py: number, speedMultiplier: number, dt: number): void {
    const maxDistSq = SPAWN.repositionDistance * SPAWN.repositionDistance;
    for (const group of this.groupList) {
      const children = group.getChildren() as Enemy[];
      for (const e of children) {
        if (!e.active) continue;
        const dx = e.x - px;
        const dy = e.y - py;
        if (dx * dx + dy * dy > maxDistSq) {
          const p = this.ringPoint(px, py);
          e.relocate(p.x, p.y);
        }
        e.chase(px, py, speedMultiplier, dt);
      }
    }
  }

  forEachActive(cb: (e: Enemy) => void): void {
    for (const group of this.groupList) {
      const children = group.getChildren() as Enemy[];
      for (const e of children) if (e.active) cb(e);
    }
  }

  findNearest(x: number, y: number): Enemy | null {
    let best: Enemy | null = null;
    let bestSq = Infinity;
    for (const group of this.groupList) {
      const children = group.getChildren() as Enemy[];
      for (const e of children) {
        if (!e.active) continue;
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bestSq) {
          bestSq = d;
          best = e;
        }
      }
    }
    return best;
  }

  syncVisuals(): void {
    for (const group of this.groupList) {
      const children = group.getChildren() as Enemy[];
      for (const e of children) if (e.active) e.syncVisual();
    }
  }

  kill(enemy: Enemy): void {
    if (!enemy.active) return;
    enemy.deactivate();
    this.alive--;
  }

  private ringPoint(px: number, py: number): { x: number; y: number } {
    // Con Scale.EXPAND la vista puede ser más ancha que 960×540: el anillo se aleja para seguir fuera de pantalla.
    const halfDiagonal = Math.hypot(this.scene.scale.width, this.scene.scale.height) / 2;
    const minR = Math.max(SPAWN.ringMinDistance, halfDiagonal + SPAWN.offscreenMargin);
    const maxR = minR + (SPAWN.ringMaxDistance - SPAWN.ringMinDistance);
    return randomPointInRing(px, py, minR, maxR, WORLD_WIDTH, WORLD_HEIGHT, this.point);
  }
}
