import Phaser from 'phaser';
import {
  CAMERA_LERP,
  DEBUG_START_MINUTE_PARAM,
  DEPTH,
  ENEMY_FLASH_MS,
  EURO,
  MS_PER_SECOND,
  PLAYER,
  SECONDS_PER_MINUTE,
  SPAWN_TABLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { XpGemPool } from '../entities/XpGem';
import { Elections, type PromiseStatus } from '../systems/Elections';
import { InputSystem } from '../systems/Input';
import { Modifiers } from '../systems/Modifiers';
import { Spawner } from '../systems/Spawner';
import { applyNonWeaponUpgrade, generateUpgradeOptions, type UpgradeOption } from '../systems/Upgrades';
import type { IconId, WeaponId } from '../types';
import { xpToNext } from '../utils/math';
import { createBackground, flashVisual } from '../visuals';
import { Curriculums } from '../weapons/Curriculums';
import { EscudoLey } from '../weapons/EscudoLey';
import { GritoTrastero } from '../weapons/GritoTrastero';
import { Sindicato } from '../weapons/Sindicato';
import type { Weapon, WeaponContext } from '../weapons/Weapon';
import type { GameOverData } from './GameOverScene';
import type { LevelUpData } from './LevelUpScene';

export interface HudState {
  elapsed: number;
  level: number;
  xp: number;
  xpToNext: number;
  inventory: Array<{ icon: IconId; level: number }>;
  promise: PromiseStatus | null;
  /** Posición en pantalla del pickup de promesa, si existe. */
  promisePickup: { x: number; y: number } | null;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private spawner!: Spawner;
  private gems!: XpGemPool;
  private weapons: Weapon[] = [];
  private weaponCtx!: WeaponContext;
  private modifiers!: Modifiers;
  private elections!: Elections;
  private levelUpOpen = false;
  private elapsed = 0;
  private kills = 0;
  private level = 1;
  private xp = 0;
  private pendingLevelUps = 0;
  private brokenPromises = 0;
  private ended = false;
  private debugStart = false;

  constructor() {
    super('GameScene');
  }

  get hud(): HudState {
    const inventory: HudState['inventory'] = this.weapons.map((w) => ({ icon: `icon_${w.id}` as IconId, level: w.level }));
    for (const [id, level] of Object.entries(this.modifiers.passiveLevels)) {
      if (level > 0) inventory.push({ icon: `icon_${id}` as IconId, level });
    }
    const pickup = this.elections.pickup;
    const cam = this.cameras.main;
    return {
      elapsed: this.elapsed,
      level: this.level,
      xp: this.xp,
      xpToNext: xpToNext(this.level),
      inventory,
      promise: this.elections.current,
      promisePickup: pickup.active ? { x: pickup.x - cam.scrollX, y: pickup.y - cam.scrollY } : null,
    };
  }

  create(): void {
    const startMinute = GameScene.debugStartMinute();
    this.debugStart = startMinute > 0;
    this.elapsed = startMinute * SECONDS_PER_MINUTE;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.pendingLevelUps = 0;
    this.levelUpOpen = false;
    this.brokenPromises = 0;
    this.ended = false;
    this.modifiers = new Modifiers();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.inputSystem = new InputSystem(this);
    this.spawner = new Spawner(this);
    this.gems = new XpGemPool(this);
    this.elections = new Elections(this, this.modifiers, this.elapsed, () => this.brokenPromises++);

    this.weaponCtx = {
      scene: this,
      player: this.player,
      modifiers: this.modifiers,
      enemyGroups: this.spawner.groupList,
      findNearestEnemy: (x, y) => this.spawner.findNearest(x, y),
      forEachEnemy: (cb) => this.spawner.forEachActive(cb),
      damageEnemy: (e, amount) => this.damageEnemy(e, amount),
    };
    this.weapons = [this.createWeapon('curriculum')];

    this.physics.add.overlap(this.player, this.spawner.groupList, (_p, e) => this.onEnemyContact(e as Enemy));

    this.scene.launch('UIScene');

    // POST_UPDATE se emite después de que Arcade aplique las posiciones del paso de física.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.scene.stop('UIScene');
      this.scene.stop('LevelUpScene');
    });
  }

  /** `?min=N` (0–9) arranca el reloj en ese minuto. */
  private static debugStartMinute(): number {
    const raw = new URLSearchParams(window.location.search).get(DEBUG_START_MINUTE_PARAM);
    const n = raw === null ? 0 : Math.floor(Number(raw));
    return Number.isFinite(n) ? Math.min(SPAWN_TABLE.length - 1, Math.max(0, n)) : 0;
  }

  update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = deltaMs / MS_PER_SECOND;
    this.elapsed += dt;

    this.player.tick(dt);
    this.player.move(this.inputSystem.getDirection(), this.modifiers.playerSpeed);
    this.spawner.update(dt, this.elapsed, this.player.x, this.player.y);
    this.spawner.updateEnemies(this.player.x, this.player.y, this.modifiers.enemySpeed, dt);
    for (const w of this.weapons) w.update(dt);
    this.elections.update(dt, this.elapsed, this.player.x, this.player.y, PLAYER.hitboxRadius);

    const collected = this.gems.update(
      this.player.x,
      this.player.y,
      PLAYER.pickupRadius * this.modifiers.pickupRadius,
      PLAYER.euroAttractSpeed,
      PLAYER.hitboxRadius + EURO.hitboxRadius,
    );
    if (collected > 0) this.addXp(collected * this.modifiers.xpGain);
    if (this.pendingLevelUps > 0 && !this.levelUpOpen) this.openLevelUp();
  }

  private createWeapon(id: WeaponId): Weapon {
    switch (id) {
      case 'curriculum':
        return new Curriculums(this.weaponCtx);
      case 'escudo':
        return new EscudoLey(this.weaponCtx);
      case 'grito':
        return new GritoTrastero(this.weaponCtx);
      case 'sindicato':
        return new Sindicato(this.weaponCtx);
    }
  }

  private weaponLevels(): Partial<Record<WeaponId, number>> {
    const levels: Partial<Record<WeaponId, number>> = {};
    for (const w of this.weapons) levels[w.id] = w.level;
    return levels;
  }

  private openLevelUp(): void {
    this.levelUpOpen = true;
    const data: LevelUpData = { options: generateUpgradeOptions(this.weaponLevels(), this.modifiers) };
    // scene.pause detiene update, física (physics.pause) y reloj/timers de la escena.
    this.scene.pause();
    this.scene.launch('LevelUpScene', data);
  }

  applyUpgrade(option: UpgradeOption): void {
    if (option.kind === 'weapon') {
      const owned = this.weapons.find((w) => w.id === option.id);
      if (owned) owned.levelUp();
      else this.weapons.push(this.createWeapon(option.id));
      return;
    }
    applyNonWeaponUpgrade(option, this.player, this.modifiers);
  }

  /** Cierra un menú de nivel; devuelve las opciones del siguiente si hay más encolados. */
  finishLevelUp(): UpgradeOption[] | null {
    this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
    if (this.pendingLevelUps > 0) return generateUpgradeOptions(this.weaponLevels(), this.modifiers);
    this.levelUpOpen = false;
    this.scene.resume();
    return null;
  }

  private lateUpdate(): void {
    this.player.syncVisual();
    this.spawner.syncVisuals();
    this.gems.syncVisuals();
    for (const w of this.weapons) w.syncVisuals();
  }

  private damageEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.active) return;
    flashVisual(this, enemy.visual, ENEMY_FLASH_MS);
    if (!enemy.takeDamage(amount)) return;
    const { x, y } = enemy;
    const value = enemy.stats.xp;
    this.spawner.kill(enemy);
    this.kills++;
    this.gems.drop(x, y, value);
  }

  private addXp(amount: number): void {
    this.xp += amount;
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      this.pendingLevelUps++;
    }
  }

  private onEnemyContact(enemy: Enemy): void {
    if (this.ended || !enemy.active || this.modifiers.invulnerable) return;
    if (this.player.takeHit(enemy.stats.damage) && this.player.isDead) this.endGame(false);
  }

  private endGame(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    const data: GameOverData = {
      victory,
      timeSeconds: this.elapsed,
      level: this.level,
      kills: this.kills,
      brokenPromises: this.brokenPromises,
      recordable: !this.debugStart,
    };
    this.scene.start('GameOverScene', data);
  }
}
