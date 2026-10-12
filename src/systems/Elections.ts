import Phaser from 'phaser';
import { PROMESA, PROMISE_IDS, PROMISES, SECONDS_PER_MINUTE, WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { PromesaPickup } from '../entities/PromesaPickup';
import type { PromiseId } from '../types';
import { randomPointInRing } from '../utils/math';
import type { Modifiers } from './Modifiers';

export type PromisePhase = 'buff' | 'debuff' | 'fulfilled';

export interface PromiseStatus {
  phase: PromisePhase;
  id: PromiseId;
  /** Segundos restantes de la fase. */
  remaining: number;
}

/** Sección 10: temporización de la promesa electoral, tirada 50% y buff/debuff en `Modifiers`. */
export class Elections {
  readonly pickup: PromesaPickup;
  /** Instantes (s) de aparición aún pendientes. */
  private schedule: number[];
  private status: PromiseStatus | null = null;
  private readonly point = { x: 0, y: 0 };

  constructor(
    scene: Phaser.Scene,
    private readonly modifiers: Modifiers,
    startElapsed: number,
    private readonly onBroken: () => void,
  ) {
    this.pickup = new PromesaPickup(scene);
    // Con `?min=N` se omiten las apariciones anteriores; la del minuto N sale al instante.
    this.schedule = PROMESA.spawnMinutes.map((m) => m * SECONDS_PER_MINUTE).filter((t) => t >= startElapsed);
  }

  get current(): PromiseStatus | null {
    return this.status;
  }

  update(dt: number, elapsed: number, px: number, py: number, playerRadius: number): void {
    if (this.schedule.length > 0 && elapsed >= this.schedule[0]) {
      this.schedule.shift();
      randomPointInRing(px, py, PROMESA.spawnMinDistance, PROMESA.spawnMaxDistance, WORLD_WIDTH, WORLD_HEIGHT, this.point);
      this.pickup.spawn(this.point.x, this.point.y);
    }

    if (this.pickup.tick(dt) && this.pickup.overlaps(px, py, playerRadius)) {
      this.pickup.despawn();
      this.start(PROMISE_IDS[Math.floor(Math.random() * PROMISE_IDS.length)]);
    }

    if (!this.status) return;
    this.status.remaining -= dt;
    if (this.status.remaining > 0) return;
    if (this.status.phase === 'buff') this.resolve();
    else this.end();
  }

  private start(id: PromiseId): void {
    this.status = { phase: 'buff', id, remaining: PROMESA.buffSeconds };
    this.modifiers.promiseEffect = PROMISES[id].buff;
  }

  private resolve(): void {
    const id = this.status!.id;
    if (Math.random() < PROMESA.fulfilledChance) {
      this.status = { phase: 'fulfilled', id, remaining: PROMESA.fulfilledBannerSeconds };
      this.modifiers.promiseEffect = null;
    } else {
      this.status = { phase: 'debuff', id, remaining: PROMESA.debuffSeconds };
      this.modifiers.promiseEffect = PROMISES[id].debuff;
      this.onBroken();
    }
  }

  private end(): void {
    this.status = null;
    this.modifiers.promiseEffect = null;
  }
}
