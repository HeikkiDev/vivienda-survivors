import Phaser from 'phaser';
import {
  CANA_HEAL,
  CHEST,
  EVOLUTION_IDS,
  EVOLUTIONS,
  LEVEL_UP_OPTIONS,
  MAX_UPGRADE_LEVEL,
  PASSIVE_IDS,
  PASSIVES,
  WEAPON_IDS,
} from '../config';
import type { Player } from '../entities/Player';
import { TEXTS } from '../texts';
import type { EvolutionId, IconId, PassiveId, WeaponId } from '../types';
import type { Modifiers } from './Modifiers';

/** `currentLevel` = 0 si aún no se tiene (opción "¡NUEVO!"). */
export type UpgradeOption =
  | { kind: 'weapon'; id: WeaponId; currentLevel: number }
  | { kind: 'passive'; id: PassiveId; currentLevel: number }
  | { kind: 'evolution'; id: EvolutionId }
  | { kind: 'cana' };

/** Estado de un arma que necesita el menú de mejoras. */
export interface OwnedWeapon {
  id: WeaponId;
  level: number;
  evolved: boolean;
}

/** Evolución de un arma (null si no tiene pasiva emparejada). */
export function evolutionOf(weapon: WeaponId): EvolutionId | null {
  return EVOLUTION_IDS.find((e) => EVOLUTIONS[e].weapon === weapon) ?? null;
}

/** Evoluciones disponibles: arma a nivel máximo sin evolucionar + su pasiva a cualquier nivel. */
export function availableEvolutions(
  weapons: readonly OwnedWeapon[],
  modifiers: Pick<Modifiers, 'passiveLevels'>,
): EvolutionId[] {
  const out: EvolutionId[] = [];
  for (const w of weapons) {
    if (w.evolved || w.level < MAX_UPGRADE_LEVEL) continue;
    const evo = evolutionOf(w.id);
    if (evo && modifiers.passiveLevels[EVOLUTIONS[evo].passive] > 0) out.push(evo);
  }
  return out;
}

/**
 * Las evoluciones disponibles salen siempre (hasta 3); el resto, opciones aleatorias distintas entre armas
 * y pasivas no máximas (las armas evolucionadas ya no suben). Si faltan, "Caña con los colegas".
 */
export function generateUpgradeOptions(weapons: readonly OwnedWeapon[], modifiers: Modifiers): UpgradeOption[] {
  const evolutions: UpgradeOption[] = Phaser.Utils.Array.Shuffle(availableEvolutions(weapons, modifiers))
    .slice(0, LEVEL_UP_OPTIONS)
    .map((id) => ({ kind: 'evolution', id }));
  const pool = upgradePool(weapons, modifiers);
  const rest = Phaser.Utils.Array.Shuffle(pool).slice(0, LEVEL_UP_OPTIONS - evolutions.length);
  const options = Phaser.Utils.Array.Shuffle([...evolutions, ...rest]);
  if (options.length < LEVEL_UP_OPTIONS) options.push({ kind: 'cana' });
  return options;
}

/** Armas (no evolucionadas) y pasivas por debajo del nivel máximo. */
function upgradePool(weapons: readonly OwnedWeapon[], modifiers: Pick<Modifiers, 'passiveLevels'>): UpgradeOption[] {
  const pool: UpgradeOption[] = [];
  for (const id of WEAPON_IDS) {
    const w = weapons.find((o) => o.id === id);
    const lvl = w?.level ?? 0;
    if (!w?.evolved && lvl < MAX_UPGRADE_LEVEL) pool.push({ kind: 'weapon', id, currentLevel: lvl });
  }
  for (const id of PASSIVE_IDS) {
    const lvl = modifiers.passiveLevels[id];
    if (lvl < MAX_UPGRADE_LEVEL) pool.push({ kind: 'passive', id, currentLevel: lvl });
  }
  return pool;
}

/** Todo al máximo o evolucionado: la única opción posible de level-up sería la caña. */
export function isFullyUpgraded(weapons: readonly OwnedWeapon[], modifiers: Pick<Modifiers, 'passiveLevels'>): boolean {
  return availableEvolutions(weapons, modifiers).length === 0 && upgradePool(weapons, modifiers).length === 0;
}

/** Mejora concedida por un cofre; `euros` = XP de un nivel completo cuando ya no queda nada que mejorar. */
export type ChestReward = Exclude<UpgradeOption, { kind: 'cana' }> | { kind: 'euros' };

/** Número de mejoras del cofre según las probabilidades de CHEST.rewards. */
export function rollChestUpgradeCount(): number {
  const total = CHEST.rewards.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of CHEST.rewards) {
    if (roll < r.weight) return r.upgrades;
    roll -= r.weight;
  }
  return CHEST.rewards[0].upgrades;
}

/**
 * Mejoras automáticas del cofre, en orden de aplicación. En cada hueco: evolución disponible; si no, el arma
 * propia de mayor nivel por debajo del máximo; si no, una pasiva propia; si no, un arma o pasiva nueva;
 * si no, euros. Se simula sobre una copia, así que nunca pasa del nivel máximo.
 */
export function generateChestRewards(
  weapons: readonly OwnedWeapon[],
  modifiers: Pick<Modifiers, 'passiveLevels'>,
  count: number,
): ChestReward[] {
  const simWeapons: OwnedWeapon[] = weapons.map((w) => ({ ...w }));
  const sim = { passiveLevels: { ...modifiers.passiveLevels } };
  const levels = sim.passiveLevels;
  const rewards: ChestReward[] = [];
  for (let i = 0; i < count; i++) {
    const evo = availableEvolutions(simWeapons, sim)[0];
    if (evo) {
      simWeapons.find((w) => w.id === EVOLUTIONS[evo].weapon)!.evolved = true;
      rewards.push({ kind: 'evolution', id: evo });
      continue;
    }
    const upgradable = simWeapons.filter((w) => !w.evolved && w.level < MAX_UPGRADE_LEVEL);
    if (upgradable.length > 0) {
      const top = Math.max(...upgradable.map((w) => w.level));
      const w = Phaser.Utils.Array.GetRandom(upgradable.filter((o) => o.level === top));
      rewards.push({ kind: 'weapon', id: w.id, currentLevel: w.level });
      w.level++;
      continue;
    }
    const ownedPassives = PASSIVE_IDS.filter((id) => levels[id] > 0 && levels[id] < MAX_UPGRADE_LEVEL);
    if (ownedPassives.length > 0) {
      const id = Phaser.Utils.Array.GetRandom([...ownedPassives]);
      rewards.push({ kind: 'passive', id, currentLevel: levels[id] });
      levels[id]++;
      continue;
    }
    const fresh: Array<{ kind: 'weapon'; id: WeaponId } | { kind: 'passive'; id: PassiveId }> = [
      ...WEAPON_IDS.filter((id) => !simWeapons.some((w) => w.id === id)).map((id) => ({ kind: 'weapon' as const, id })),
      ...PASSIVE_IDS.filter((id) => levels[id] === 0).map((id) => ({ kind: 'passive' as const, id })),
    ];
    if (fresh.length === 0) {
      rewards.push({ kind: 'euros' });
      continue;
    }
    const pick = Phaser.Utils.Array.GetRandom(fresh);
    if (pick.kind === 'weapon') {
      simWeapons.push({ id: pick.id, level: 1, evolved: false });
      rewards.push({ kind: 'weapon', id: pick.id, currentLevel: 0 });
    } else {
      levels[pick.id] = 1;
      rewards.push({ kind: 'passive', id: pick.id, currentLevel: 0 });
    }
  }
  return rewards;
}

/** Aplica pasivas y la caña. Las armas y evoluciones las gestiona GameScene. */
export function applyNonWeaponUpgrade(option: UpgradeOption, player: Player, modifiers: Modifiers): void {
  if (option.kind === 'cana') {
    player.heal(CANA_HEAL);
    return;
  }
  if (option.kind !== 'passive') return;
  modifiers.levelPassive(option.id);
  if (option.id === 'aval') {
    player.increaseMaxHp(PASSIVES.aval.maxHpPerLevel);
    player.heal(PASSIVES.aval.healPerLevel);
  }
}

export function upgradeIcon(option: UpgradeOption): IconId {
  return option.kind === 'cana' ? 'icon_cana' : `icon_${option.id}`;
}

export function upgradeTexts(option: UpgradeOption): { name: string; desc: string; effect: string } {
  if (option.kind === 'cana') return TEXTS.cana;
  if (option.kind === 'evolution') return TEXTS.evolutions[option.id];
  return option.kind === 'weapon' ? TEXTS.weapons[option.id] : TEXTS.passives[option.id];
}
