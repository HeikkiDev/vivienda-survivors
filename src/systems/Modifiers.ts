import { MAX_UPGRADE_LEVEL, PASSIVES } from '../config';
import type { PassiveId } from '../types';

/**
 * Multiplicadores consultados por armas, jugador y enemigos.
 * H5: pasivas (aditivas por nivel). Las promesas electorales se añadirán aquí en H6.
 */
export class Modifiers {
  readonly passiveLevels: Record<PassiveId, number> = { aval: 0, piso: 0, bono: 0, trabajo: 0 };

  canLevelPassive(id: PassiveId): boolean {
    return this.passiveLevels[id] < MAX_UPGRADE_LEVEL;
  }

  levelPassive(id: PassiveId): void {
    if (this.canLevelPassive(id)) this.passiveLevels[id]++;
  }

  get damage(): number {
    return 1 + PASSIVES.trabajo.damagePerLevel * this.passiveLevels.trabajo;
  }

  get cooldown(): number {
    return 1 - PASSIVES.piso.cooldownReductionPerLevel * this.passiveLevels.piso;
  }

  get pickupRadius(): number {
    return 1 + PASSIVES.bono.pickupRadiusPerLevel * this.passiveLevels.bono;
  }

  get playerSpeed(): number {
    return 1 + PASSIVES.bono.speedPerLevel * this.passiveLevels.bono;
  }

  get enemySpeed(): number {
    return 1;
  }

  get xpGain(): number {
    return 1;
  }
}
