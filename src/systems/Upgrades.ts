import Phaser from 'phaser';
import {
  CANA_HEAL,
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
export function availableEvolutions(weapons: readonly OwnedWeapon[], modifiers: Modifiers): EvolutionId[] {
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
  const rest = Phaser.Utils.Array.Shuffle(pool).slice(0, LEVEL_UP_OPTIONS - evolutions.length);
  const options = Phaser.Utils.Array.Shuffle([...evolutions, ...rest]);
  if (options.length < LEVEL_UP_OPTIONS) options.push({ kind: 'cana' });
  return options;
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
