import Phaser from 'phaser';
import {
  ELITE,
  ENEMIES,
  ENEMY_HP_SCALE_PER_MINUTE,
  ENEMY_IDS,
  EVOLUTION_DIFFICULTY,
  SECONDS_PER_MINUTE,
  SPAWN,
  SPAWN_TABLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import { Elite } from '../entities/Elite';
import { Enemy } from '../entities/Enemy';
import type { EnemyId } from '../types';
import { randomPointInRing, weightedPick } from '../utils/math';

/** Pools de enemigos (un Arcade Group por tipo, y otro por tipo para los élites) + curva de aparición por minuto. */
export class Spawner {
  readonly groups: Record<EnemyId, Phaser.Physics.Arcade.Group>;
  readonly eliteGroups: Record<EnemyId, Phaser.Physics.Arcade.Group>;
  /** Todos los grupos (normales y élites). */
  readonly groupList: Phaser.Physics.Arcade.Group[];
  /** Evoluciones que tiene el jugador (0–4): suben el HP y el número de enemigos por tanda. */
  evolutions = 0;
  private accumulator = 0;
  /** Parte fraccionaria de enemigos por tanda que se arrastra a la siguiente (escalado por evoluciones). */
  private countCarry = 0;
  private alive = 0;
  private readonly point = { x: 0, y: 0 };
  private readonly seen = new Set<EnemyId>();

  /** `onFirstSpawn` se llama la primera vez que aparece cada tipo de enemigo en la partida. */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onFirstSpawn: (id: EnemyId) => void = () => {},
  ) {
    const make = () => scene.physics.add.group({ maxSize: SPAWN.maxAlive });
    this.groups = { ipc: make(), casero: make(), agencia: make(), fondo: make() };
    this.eliteGroups = { ipc: make(), casero: make(), agencia: make(), fondo: make() };
    this.groupList = [...ENEMY_IDS.map((id) => this.groups[id]), ...ENEMY_IDS.map((id) => this.eliteGroups[id])];
  }

  get aliveCount(): number {
    return this.alive;
  }

  static minuteOf(elapsedSeconds: number): number {
    return Math.min(SPAWN_TABLE.length - 1, Math.max(0, Math.floor(elapsedSeconds / SECONDS_PER_MINUTE)));
  }

  /** Multiplicador de HP por las evoluciones del jugador (se acumula con el escalado por minuto). */
  get evolutionHpMultiplier(): number {
    return 1 + EVOLUTION_DIFFICULTY.enemyHpPerEvolution * this.evolutions;
  }

  private hpMultiplier(minute: number): number {
    return (1 + ENEMY_HP_SCALE_PER_MINUTE * minute) * this.evolutionHpMultiplier;
  }

  update(dt: number, elapsedSeconds: number, px: number, py: number): void {
    const minute = Spawner.minuteOf(elapsedSeconds);
    const row = SPAWN_TABLE[minute];
    this.accumulator += dt;
    while (this.accumulator >= row.interval) {
      this.accumulator -= row.interval;
      this.countCarry += row.count * (1 + EVOLUTION_DIFFICULTY.spawnCountPerEvolution * this.evolutions);
      const count = Math.floor(this.countCarry);
      this.countCarry -= count;
      for (let i = 0; i < count; i++) {
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
    enemy.spawn(x, y, this.hpMultiplier(minute));
    this.alive++;
    if (!this.seen.has(id)) {
      this.seen.add(id);
      this.onFirstSpawn(id);
    }
    return enemy;
  }

  /** Genera un élite de tipo aleatorio (pesos de ELITE) en el anillo. No cuenta para el tope de vivos. */
  spawnElite(minute: number, px: number, py: number): Elite {
    const id = weightedPick(ELITE.weights, ENEMY_IDS);
    const group = this.eliteGroups[id];
    let elite = group.getFirstDead(false) as Elite | null;
    if (!elite) {
      elite = new Elite(this.scene, id);
      group.add(elite);
      elite.initBody();
    }
    const p = this.ringPoint(px, py);
    elite.spawn(p.x, p.y, this.hpMultiplier(minute));
    return elite;
  }

  /** Persigue al jugador y reposiciona en el anillo a los que se alejan demasiado (salvo los élites). */
  updateEnemies(px: number, py: number, speedMultiplier: number, dt: number): void {
    const maxDistSq = SPAWN.repositionDistance * SPAWN.repositionDistance;
    for (const group of this.groupList) {
      const children = group.getChildren() as Enemy[];
      for (const e of children) {
        if (!e.active) continue;
        const dx = e.x - px;
        const dy = e.y - py;
        if (!e.elite && dx * dx + dy * dy > maxDistSq) {
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

  forEachActiveElite(cb: (e: Enemy) => void): void {
    for (const id of ENEMY_IDS) {
      const children = this.eliteGroups[id].getChildren() as Enemy[];
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
    if (!enemy.elite) this.alive--;
  }

  private ringPoint(px: number, py: number): { x: number; y: number } {
    // Con Scale.EXPAND la vista puede ser más ancha que 960×540: el anillo se aleja para seguir fuera de pantalla.
    const halfDiagonal = Math.hypot(this.scene.scale.width, this.scene.scale.height) / 2;
    const minR = Math.max(SPAWN.ringMinDistance, halfDiagonal + SPAWN.offscreenMargin);
    const maxR = minR + (SPAWN.ringMaxDistance - SPAWN.ringMinDistance);
    return randomPointInRing(px, py, minR, maxR, WORLD_WIDTH, WORLD_HEIGHT, this.point);
  }
}
