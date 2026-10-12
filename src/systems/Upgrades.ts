import Phaser from 'phaser';
import { CANA_HEAL, LEVEL_UP_OPTIONS, MAX_UPGRADE_LEVEL, PASSIVE_IDS, PASSIVES, WEAPON_IDS } from '../config';
import type { Player } from '../entities/Player';
import { TEXTS } from '../texts';
import type { IconId, PassiveId, WeaponId } from '../types';
import type { Modifiers } from './Modifiers';

/** `currentLevel` = 0 si aún no se tiene (opción "¡NUEVO!"). */
export type UpgradeOption =
  | { kind: 'weapon'; id: WeaponId; currentLevel: number }
  | { kind: 'passive'; id: PassiveId; currentLevel: number }
  | { kind: 'cana' };

/** 3 opciones aleatorias distintas entre armas y pasivas no máximas; si faltan, "Caña con los colegas". */
export function generateUpgradeOptions(
  weaponLevels: Partial<Record<WeaponId, number>>,
  modifiers: Modifiers,
): UpgradeOption[] {
  const pool: UpgradeOption[] = [];
  for (const id of WEAPON_IDS) {
    const lvl = weaponLevels[id] ?? 0;
    if (lvl < MAX_UPGRADE_LEVEL) pool.push({ kind: 'weapon', id, currentLevel: lvl });
  }
  for (const id of PASSIVE_IDS) {
    const lvl = modifiers.passiveLevels[id];
    if (lvl < MAX_UPGRADE_LEVEL) pool.push({ kind: 'passive', id, currentLevel: lvl });
  }
  const options = Phaser.Utils.Array.Shuffle(pool).slice(0, LEVEL_UP_OPTIONS);
  if (options.length < LEVEL_UP_OPTIONS) options.push({ kind: 'cana' });
  return options;
}

/** Aplica pasivas y la caña. Las armas las gestiona GameScene (crear o subir nivel). */
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

export function upgradeTexts(option: UpgradeOption): { name: string; desc: string } {
  if (option.kind === 'cana') return TEXTS.cana;
  return option.kind === 'weapon' ? TEXTS.weapons[option.id] : TEXTS.passives[option.id];
}
