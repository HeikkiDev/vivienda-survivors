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
import { InputSystem } from '../systems/Input';
import { Spawner } from '../systems/Spawner';
import { xpToNext } from '../utils/math';
import { createBackground, flashVisual } from '../visuals';
import { Curriculums } from '../weapons/Curriculums';
import type { Weapon, WeaponContext } from '../weapons/Weapon';
import type { GameOverData } from './GameOverScene';

export interface HudState {
  elapsed: number;
  level: number;
  xp: number;
  xpToNext: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private spawner!: Spawner;
  private gems!: XpGemPool;
  private weapons: Weapon[] = [];
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
    return { elapsed: this.elapsed, level: this.level, xp: this.xp, xpToNext: xpToNext(this.level) };
  }

  create(): void {
    const startMinute = GameScene.debugStartMinute();
    this.debugStart = startMinute > 0;
    this.elapsed = startMinute * SECONDS_PER_MINUTE;
    this.kills = 0;
    this.level = 1;
    this.xp = 0;
    this.pendingLevelUps = 0;
    this.brokenPromises = 0;
    this.ended = false;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.inputSystem = new InputSystem(this);
    this.spawner = new Spawner(this);
    this.gems = new XpGemPool(this);

    const ctx: WeaponContext = {
      scene: this,
      player: this.player,
      enemyGroups: this.spawner.groupList,
      findNearestEnemy: (x, y) => this.spawner.findNearest(x, y),
      damageEnemy: (e, amount) => this.damageEnemy(e, amount),
    };
    this.weapons = [new Curriculums(ctx)];

    this.physics.add.overlap(this.player, this.spawner.groupList, (_p, e) => this.onEnemyContact(e as Enemy));

    this.scene.launch('UIScene');

    // POST_UPDATE se emite después de que Arcade aplique las posiciones del paso de física.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
      this.scene.stop('UIScene');
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
    this.player.move(this.inputSystem.getDirection());
    this.spawner.update(dt, this.elapsed, this.player.x, this.player.y);
    this.spawner.updateEnemies(this.player.x, this.player.y, 1);
    for (const w of this.weapons) w.update(dt);

    const collected = this.gems.update(
      this.player.x,
      this.player.y,
      PLAYER.pickupRadius,
      PLAYER.euroAttractSpeed,
      PLAYER.hitboxRadius + EURO.hitboxRadius,
    );
    if (collected > 0) this.addXp(collected);
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
      // H4: el menú de mejoras llega en H5; de momento solo se registra.
      console.log(`[level-up] Nivel ${this.level} (pendientes: ${this.pendingLevelUps})`);
    }
  }

  private onEnemyContact(enemy: Enemy): void {
    if (this.ended || !enemy.active) return;
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
