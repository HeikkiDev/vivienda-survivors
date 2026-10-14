import Phaser from 'phaser';
import {
  BOSS,
  CAMERA_LERP,
  CAMERA_SHAKE,
  DEBUG_START_MINUTE_PARAM,
  DEFEAT_ANIM,
  DEPTH,
  ENEMY_FLASH_MS,
  EURO,
  MS_PER_SECOND,
  PLAYER,
  SECONDS_PER_MINUTE,
  SPAWN,
  SPAWN_TABLE,
  TOURIST_WAVE,
  UI,
  VICTORY_ANIM,
  VICTORY_MINUTE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config';
import { Boss, BossBulletPool, type BossBullet } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { XpGemPool } from '../entities/XpGem';
import { Elections, type PromiseStatus } from '../systems/Elections';
import { InputSystem } from '../systems/Input';
import { Modifiers } from '../systems/Modifiers';
import { Spawner } from '../systems/Spawner';
import { applyNonWeaponUpgrade, generateUpgradeOptions, type UpgradeOption } from '../systems/Upgrades';
import { TEXTS } from '../texts';
import type { EnemyId, IconId, WeaponId } from '../types';
import { randomPointInRing, xpToNext } from '../utils/math';
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
  boss: { hp: number; maxHp: number } | null;
  announcement: Announcement | null;
  enemyIntro: EnemyIntro | null;
  /** Secuencia de fin en curso (antes de GameOverScene). */
  ending: EndingKind | null;
}

export type EndingKind = 'victory' | 'defeat';

export interface EnemyIntro {
  id: EnemyId;
  remaining: number;
}

export interface Announcement {
  text: string;
  kind: 'warning' | 'info';
  remaining: number;
}

/** Eventos únicos de la partida (instante en segundos). */
interface TimedEvent {
  at: number;
  run: () => void;
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
  private boss!: Boss;
  private bossGroup!: Phaser.Physics.Arcade.Group;
  private bossBullets!: BossBulletPool;
  private timedEvents: TimedEvent[] = [];
  private announcement: Announcement | null = null;
  private enemyIntro: EnemyIntro | null = null;
  private enemyIntroQueue: EnemyId[] = [];
  private levelUpOpen = false;
  private elapsed = 0;
  private kills = 0;
  private level = 1;
  private xp = 0;
  private pendingLevelUps = 0;
  private brokenPromises = 0;
  private ended = false;
  private ending: EndingKind | null = null;
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
    const c = this.ending !== null;
    return {
      elapsed: this.elapsed,
      level: this.level,
      xp: this.xp,
      xpToNext: xpToNext(this.level),
      inventory,
      promise: c ? null : this.elections.current,
      promisePickup: !c && pickup.active ? { x: pickup.x - cam.scrollX, y: pickup.y - cam.scrollY } : null,
      boss: !c && this.boss.active ? { hp: Math.max(0, this.boss.hp), maxHp: this.boss.maxHp } : null,
      announcement: c ? null : this.announcement,
      enemyIntro: c ? null : this.enemyIntro,
      ending: this.ending,
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
    this.ending = null;
    this.modifiers = new Modifiers();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.inputSystem = new InputSystem(this);
    this.enemyIntro = null;
    this.enemyIntroQueue = [];
    this.spawner = new Spawner(this, (id) => this.enemyIntroQueue.push(id));
    this.gems = new XpGemPool(this);
    this.elections = new Elections(this, this.modifiers, this.elapsed, () => this.brokenPromises++);

    this.bossGroup = this.physics.add.group({ maxSize: 1 });
    this.boss = new Boss(this);
    this.bossGroup.add(this.boss);
    this.boss.initBody();
    this.bossBullets = new BossBulletPool(this);
    this.announcement = null;
    this.timedEvents = this.buildTimedEvents(this.elapsed);
    const enemyTargets = [...this.spawner.groupList, this.bossGroup];

    this.weaponCtx = {
      scene: this,
      player: this.player,
      modifiers: this.modifiers,
      enemyGroups: enemyTargets,
      findNearestEnemy: (x, y) => this.findNearestEnemy(x, y),
      forEachEnemy: (cb) => {
        this.spawner.forEachActive(cb);
        if (this.boss.active) cb(this.boss);
      },
      damageEnemy: (e, amount) => this.damageEnemy(e, amount),
    };
    this.weapons = [this.createWeapon('curriculum')];

    this.physics.add.overlap(this.player, enemyTargets, (_p, e) => this.onEnemyContact(e as Enemy));
    this.physics.add.overlap(this.player, this.bossBullets.group, (_p, b) => this.onBossBullet(b as BossBullet));

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
    if (this.elapsed >= VICTORY_MINUTE * SECONDS_PER_MINUTE) {
      this.endGame(true);
      return;
    }
    while (this.timedEvents.length > 0 && this.elapsed >= this.timedEvents[0].at) this.timedEvents.shift()!.run();
    if (this.announcement) {
      this.announcement.remaining -= dt;
      if (this.announcement.remaining <= 0) this.announcement = null;
    }
    this.updateEnemyIntro(dt);

    this.player.tick(dt);
    this.applyPlayerRegen(dt);
    this.player.move(this.inputSystem.getDirection(), this.modifiers.playerSpeed);
    this.spawner.update(dt, this.elapsed, this.player.x, this.player.y);
    this.spawner.updateEnemies(this.player.x, this.player.y, this.modifiers.enemySpeed, dt);
    if (this.boss.active) {
      this.boss.chase(this.player.x, this.player.y, this.modifiers.enemySpeed, dt);
      if (this.boss.tickShoot(dt)) this.bossBullets.fireRing(this.boss.x, this.boss.y);
    }
    this.bossBullets.update(dt);
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

  private applyPlayerRegen(dt: number): void {
    const regenPerSecond = this.modifiers.regenPerSecond;
    if (regenPerSecond <= 0 || this.player.isDead || this.player.hp >= this.player.maxHp) return;
    this.player.heal(regenPerSecond * dt);
  }

  /** Oleada turística, aviso del boss y boss. Con `?min=N` se omiten los anteriores a ese minuto. */
  private buildTimedEvents(startElapsed: number): TimedEvent[] {
    const bossAt = BOSS.spawnMinute * SECONDS_PER_MINUTE;
    const all: TimedEvent[] = [
      { at: TOURIST_WAVE.minute * SECONDS_PER_MINUTE, run: () => this.spawnTouristWave() },
      { at: bossAt - BOSS.warningSeconds, run: () => this.announce(TEXTS.boss.warning, 'warning', BOSS.warningSeconds) },
      { at: bossAt, run: () => this.spawnBoss() },
    ];
    return all.filter((e) => e.at >= startElapsed).sort((a, b) => a.at - b.at);
  }

  /** Muestra de uno en uno los enemigos nuevos de la cola. */
  private updateEnemyIntro(dt: number): void {
    if (this.enemyIntro) {
      this.enemyIntro.remaining -= dt;
      if (this.enemyIntro.remaining > 0) return;
      this.enemyIntro = null;
    }
    const next = this.enemyIntroQueue.shift();
    if (next) this.enemyIntro = { id: next, remaining: UI.enemyIntro.seconds };
  }

  private announce(text: string, kind: Announcement['kind'], seconds: number): void {
    this.announcement = { text, kind, remaining: seconds };
  }

  private spawnTouristWave(): void {
    const { x: px, y: py } = this.player;
    const minute = Spawner.minuteOf(this.elapsed);
    for (let i = 0; i < TOURIST_WAVE.count; i++) {
      const angle = (i / TOURIST_WAVE.count) * Math.PI * 2;
      const x = Phaser.Math.Clamp(px + Math.cos(angle) * TOURIST_WAVE.radius, 0, WORLD_WIDTH);
      const y = Phaser.Math.Clamp(py + Math.sin(angle) * TOURIST_WAVE.radius, 0, WORLD_HEIGHT);
      this.spawner.spawnAt(TOURIST_WAVE.enemy, minute, x, y);
    }
  }

  private spawnBoss(): void {
    const p = randomPointInRing(
      this.player.x,
      this.player.y,
      SPAWN.ringMinDistance,
      SPAWN.ringMaxDistance,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      { x: 0, y: 0 },
    );
    this.boss.spawn(p.x, p.y, 1);
  }

  private findNearestEnemy(x: number, y: number): Enemy | null {
    const nearest = this.spawner.findNearest(x, y);
    if (!this.boss.active) return nearest;
    if (!nearest) return this.boss;
    const dBoss = (this.boss.x - x) ** 2 + (this.boss.y - y) ** 2;
    const dNear = (nearest.x - x) ** 2 + (nearest.y - y) ** 2;
    return dBoss < dNear ? this.boss : nearest;
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
    if (this.boss.active) this.boss.syncVisual();
    this.bossBullets.syncVisuals();
    for (const w of this.weapons) w.syncVisuals();
  }

  private damageEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.active) return;
    flashVisual(this, enemy.visual, ENEMY_FLASH_MS);
    if (!enemy.takeDamage(amount)) return;
    const { x, y } = enemy;
    const value = enemy.stats.xp;
    if (enemy === this.boss) {
      this.boss.deactivate();
      this.announce(TEXTS.boss.death, 'info', BOSS.deathTextSeconds);
    } else {
      this.spawner.kill(enemy);
    }
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
    if (this.ended || !enemy.active) return;
    this.hurtPlayer(enemy.stats.damage);
  }

  private onBossBullet(bullet: BossBullet): void {
    if (this.ended || !bullet.active) return;
    bullet.deactivate();
    this.hurtPlayer(BOSS.bullet.damage);
  }

  private hurtPlayer(damage: number): void {
    if (this.modifiers.invulnerable || !this.player.takeHit(damage)) return;
    this.cameras.main.shake(CAMERA_SHAKE.durationMs, CAMERA_SHAKE.intensity);
    if (this.player.isDead) this.endGame(false);
  }

  /** Pausa manual (Esc/P/botón) solo si no hay menú de nivel abierto ni la partida ha terminado. */
  get canPause(): boolean {
    return !this.levelUpOpen && !this.ended;
  }

  private endGame(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.ending = victory ? 'victory' : 'defeat';
    this.physics.pause();
    this.player.move(Phaser.Math.Vector2.ZERO, 0);
    if (victory) this.playVictory();
    else this.playDefeat();
  }

  /** Despeja enemigos y celebra; UIScene pone el título y el confeti. */
  private playVictory(): void {
    const v = VICTORY_ANIM;
    this.elapsed = VICTORY_MINUTE * SECONDS_PER_MINUTE;

    const cam = this.cameras.main;
    cam.flash(v.flashMs, v.flashColor.r, v.flashColor.g, v.flashColor.b);
    cam.zoomTo(v.zoom, v.zoomMs, 'Sine.easeInOut');

    const vanish = (visual: Phaser.GameObjects.Components.Alpha, onComplete: () => void): void => {
      this.tweens.add({ targets: visual, alpha: 0, duration: v.enemyFadeMs, onComplete });
    };
    this.spawner.forEachActive((e) => vanish(e.visual, () => this.spawner.kill(e)));
    if (this.boss.active) vanish(this.boss.visual, () => this.boss.deactivate());
    for (const b of this.bossBullets.group.getChildren() as BossBullet[]) if (b.active) b.deactivate();

    const pv = this.player.visual.setAlpha(1);
    this.tweens.add({
      targets: pv,
      scaleX: pv.scaleX * v.playerPulseScale,
      scaleY: pv.scaleY * v.playerPulseScale,
      duration: v.playerPulseMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fadeToGameOver(v.durationMs, v.fadeOutMs, true);
  }

  /** Los enemigos se quedan quietos rodeándote y el jugador cae; UIScene oscurece y pone el título y la lluvia. */
  private playDefeat(): void {
    const d = DEFEAT_ANIM;
    const cam = this.cameras.main;
    cam.shake(d.shakeMs, d.shakeIntensity, true);
    cam.flash(d.flashMs, d.flashColor.r, d.flashColor.g, d.flashColor.b);
    cam.zoomTo(d.zoom, d.zoomMs, 'Sine.easeOut');
    for (const b of this.bossBullets.group.getChildren() as BossBullet[]) if (b.active) b.deactivate();
    this.tweens.add({
      targets: this.player.visual,
      angle: d.playerFallAngle,
      alpha: d.playerFallAlpha,
      duration: d.playerFallMs,
      ease: 'Quad.easeIn',
    });
    this.fadeToGameOver(d.durationMs, d.fadeOutMs, false);
  }

  private fadeToGameOver(afterMs: number, fadeMs: number, victory: boolean): void {
    const cam = this.cameras.main;
    this.time.delayedCall(afterMs, () => {
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.showGameOver(victory));
      cam.fadeOut(fadeMs);
    });
  }

  private showGameOver(victory: boolean): void {
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
