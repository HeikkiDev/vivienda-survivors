import { MAX_UPGRADE_LEVEL, PASSIVES, type PromiseEffect } from '../config';
import type { PassiveId } from '../types';

/**
 * Multiplicadores consultados por armas, jugador y enemigos.
 * Pasivas (aditivas por nivel) × efecto temporal de la promesa electoral activa (buff o debuff).
 */
export class Modifiers {
  readonly passiveLevels: Record<PassiveId, number> = { aval: 0, piso: 0, bono: 0, trabajo: 0, teletrabajo: 0 };
  /** Lo fija `Elections` mientras dura un buff o debuff. */
  promiseEffect: PromiseEffect | null = null;

  canLevelPassive(id: PassiveId): boolean {
    return this.passiveLevels[id] < MAX_UPGRADE_LEVEL;
  }

  levelPassive(id: PassiveId): void {
    if (this.canLevelPassive(id)) this.passiveLevels[id]++;
  }

  get damage(): number {
    return (1 + PASSIVES.trabajo.damagePerLevel * this.passiveLevels.trabajo) * (this.promiseEffect?.damage ?? 1);
  }

  get cooldown(): number {
    return (1 - PASSIVES.piso.cooldownReductionPerLevel * this.passiveLevels.piso) * (this.promiseEffect?.cooldown ?? 1);
  }

  get pickupRadius(): number {
    return (1 + PASSIVES.bono.pickupRadiusPerLevel * this.passiveLevels.bono) * (this.promiseEffect?.pickupRadius ?? 1);
  }

  get playerSpeed(): number {
    return (1 + PASSIVES.bono.speedPerLevel * this.passiveLevels.bono) * (this.promiseEffect?.playerSpeed ?? 1);
  }

  get regenPerSecond(): number {
    return PASSIVES.teletrabajo.regenPerLevel * this.passiveLevels.teletrabajo;
  }

  get enemySpeed(): number {
    return this.promiseEffect?.enemySpeed ?? 1;
  }

  get xpGain(): number {
    return this.promiseEffect?.xpGain ?? 1;
  }

  get invulnerable(): boolean {
    return this.promiseEffect?.invulnerable ?? false;
  }
}
