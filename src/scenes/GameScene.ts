import Phaser from 'phaser';
import {
  CAMERA_LERP,
  DEBUG_START_MINUTE_PARAM,
  DEPTH,
  MS_PER_SECOND,
  SECONDS_PER_MINUTE,
  SPAWN_TABLE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { InputSystem } from '../systems/Input';
import { Spawner } from '../systems/Spawner';
import { createBackground } from '../visuals';
import type { GameOverData } from './GameOverScene';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private spawner!: Spawner;
  private elapsed = 0;
  private kills = 0;
  private level = 1;
  private brokenPromises = 0;
  private ended = false;
  private debugStart = false;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const startMinute = GameScene.debugStartMinute();
    this.debugStart = startMinute > 0;
    this.elapsed = startMinute * SECONDS_PER_MINUTE;
    this.kills = 0;
    this.level = 1;
    this.brokenPromises = 0;
    this.ended = false;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.inputSystem = new InputSystem(this);
    this.spawner = new Spawner(this);

    this.physics.add.overlap(this.player, this.spawner.groupList, (_p, e) => this.onEnemyContact(e as Enemy));

    // POST_UPDATE se emite después de que Arcade aplique las posiciones del paso de física.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
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
  }

  private lateUpdate(): void {
    this.player.syncVisual();
    this.spawner.syncVisuals();
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
