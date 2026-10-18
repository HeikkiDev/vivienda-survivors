import Phaser from 'phaser';
import { CHEST, GAME_WIDTH, PASSIVE_IDS, UI, WEAPON_IDS } from '../config';
import { type ChestReward, upgradeIcon, upgradeTexts } from '../systems/Upgrades';
import { TEXTS } from '../texts';
import type { EntityVisualId, IconId } from '../types';
import { addBaseOverlay, centerOnBaseArea } from '../utils/layout';
import { createVisual } from '../visuals';
import type { GameScene } from './GameScene';

export interface ChestData {
  /** Mejoras ya aplicadas por GameScene, en orden. */
  rewards: ChestReward[];
}

const ROULETTE_ICONS: readonly IconId[] = [...WEAPON_IDS, ...PASSIVE_IDS].map((id): IconId => `icon_${id}`);
const CONTINUE_KEYS: readonly string[] = ['Enter', 'NumpadEnter', 'Space'];

type Phase = 'roulette' | 'results' | 'done';

/** Pantalla del cofre: ruleta (saltable) y lista de mejoras. GameScene está en pausa. */
export class ChestScene extends Phaser.Scene {
  private rewards: ChestReward[] = [];
  private phase: Phase = 'roulette';
  private continueReady = false;
  private rouletteObjects: Phaser.GameObjects.GameObject[] = [];
  private rouletteTimers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super('ChestScene');
  }

  create(data: ChestData): void {
    this.rewards = data.rewards;
    this.phase = 'roulette';
    this.continueReady = false;
    this.rouletteObjects = [];
    this.rouletteTimers = [];
    const C = UI.chest;
    const cx = GAME_WIDTH / 2;

    centerOnBaseArea(this);
    addBaseOverlay(this, C.overlayColor, C.overlayAlpha).setInteractive();
    this.add
      .text(cx, C.titleY, TEXTS.chest.title(this.rewards.length), {
        fontFamily: UI.fontFamily,
        fontSize: `${C.titleSize}px`,
        fontStyle: 'bold',
        color: C.titleColor,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, C.subtitleY, TEXTS.chest.subtitle, {
        fontFamily: UI.fontFamily,
        fontSize: `${C.subtitleSize}px`,
        fontStyle: 'italic',
        color: C.subtitleColor,
      })
      .setOrigin(0.5);

    this.startRoulette(cx);

    this.input.on('pointerdown', () => {
      if (this.phase === 'roulette') this.showResults();
    });
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.phase === 'roulette') this.showResults();
      else if (CONTINUE_KEYS.includes(event.code)) this.finish();
    });
  }

  /** El cofre tiembla mientras pasan iconos de mejoras al azar. */
  private startRoulette(cx: number): void {
    const C = UI.chest;
    const chest = createVisual(this, 'chest', cx, C.chestY);
    chest.setScale(chest.scaleX * C.chestScale).setAngle(-C.chestShakeAngle);
    this.tweens.add({
      targets: chest,
      angle: C.chestShakeAngle,
      duration: C.chestShakeMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const icons = ROULETTE_ICONS.map((id) => {
      const icon = createVisual(this, id, cx, C.rouletteIconY).setVisible(false);
      return icon.setScale(icon.scaleX * C.rouletteIconScale);
    });
    let shown = Phaser.Math.Between(0, icons.length - 1);
    icons[shown].setVisible(true);
    const ticker = this.time.addEvent({
      delay: C.rouletteTickMs,
      loop: true,
      callback: () => {
        icons[shown].setVisible(false);
        shown = (shown + Phaser.Math.Between(1, icons.length - 1)) % icons.length;
        icons[shown].setVisible(true);
      },
    });
    const hint = this.add
      .text(cx, C.hintY, TEXTS.chest.skipHint, {
        fontFamily: UI.fontFamily,
        fontSize: `${C.hintSize}px`,
        color: C.hintColor,
      })
      .setOrigin(0.5);
    const done = this.time.delayedCall(C.rouletteMs, () => this.showResults());
    this.rouletteObjects = [chest, ...icons, hint];
    this.rouletteTimers = [ticker, done];
  }

  private showResults(): void {
    if (this.phase !== 'roulette') return;
    this.phase = 'results';
    for (const t of this.rouletteTimers) t.remove();
    for (const o of this.rouletteObjects) o.destroy();
    this.rouletteTimers = [];
    this.rouletteObjects = [];

    const C = UI.chest;
    const cx = GAME_WIDTH / 2;
    this.rewards.forEach((reward, i) => this.createRow(reward, i, cx));
    if (this.rewards.length >= CHEST.jackpotUpgrades) {
      const lastY = C.rowsY + (this.rewards.length - 1) * C.rowHeight;
      this.add
        .text(cx, lastY + C.rowHeight / 2 + C.jackpotGap, TEXTS.chest.jackpot, {
          fontFamily: UI.fontFamily,
          fontSize: `${C.jackpotSize}px`,
          fontStyle: 'bold',
          color: C.jackpotColor,
        })
        .setOrigin(0.5);
    }
    this.createContinueButton(cx);
    this.time.delayedCall(C.continueDelayMs, () => {
      this.continueReady = true;
    });
  }

  private createRow(reward: ChestReward, index: number, cx: number): void {
    const C = UI.chest;
    const L = UI.levelUp;
    const isEvolution = reward.kind === 'evolution';
    const left = -C.rowWidth / 2;
    const bg = this.add
      .rectangle(0, 0, C.rowWidth, C.rowHeight - C.rowGap, isEvolution ? C.rowEvolutionColor : C.rowColor)
      .setStrokeStyle(C.rowStrokeWidth, isEvolution ? L.evolutionStrokeColor : C.rowStrokeColor);
    const iconId: EntityVisualId = reward.kind === 'euros' ? 'euro' : upgradeIcon(reward);
    const icon = createVisual(this, iconId, 0, 0);
    icon.setScale(icon.scaleX * C.rowIconScale).setX(left + C.rowPadding + icon.displayWidth / 2);
    const name = this.add
      .text(left + C.rowPadding + icon.displayWidth + C.rowIconGap, 0, reward.kind === 'euros' ? TEXTS.chest.euros : upgradeTexts(reward).name, {
        fontFamily: UI.fontFamily,
        fontSize: `${C.nameSize}px`,
        fontStyle: 'bold',
        color: C.nameColor,
      })
      .setOrigin(0, 0.5);
    let label = '';
    let color: string = L.levelColor;
    if (isEvolution) {
      label = TEXTS.levelUp.evolution;
      color = L.evolutionColor;
    } else if (reward.kind === 'weapon' || reward.kind === 'passive') {
      label = reward.currentLevel === 0 ? TEXTS.levelUp.newItem : TEXTS.levelUp.levelChange(reward.currentLevel);
      if (reward.currentLevel === 0) color = L.newColor;
    }
    const level = this.add
      .text(-left - C.rowPadding, 0, label, {
        fontFamily: UI.fontFamily,
        fontSize: `${C.levelSize}px`,
        fontStyle: 'bold',
        color,
      })
      .setOrigin(1, 0.5);
    const row = this.add.container(cx, C.rowsY + index * C.rowHeight, [bg, icon, name, level]).setAlpha(0);
    this.tweens.add({ targets: row, alpha: 1, duration: C.rowAppearMs, delay: index * C.rowStaggerMs });
  }

  private createContinueButton(cx: number): void {
    const C = UI.chest;
    const button = this.add
      .text(cx, C.buttonY, TEXTS.chest.continue, {
        fontFamily: UI.fontFamily,
        fontSize: `${C.buttonSize}px`,
        fontStyle: 'bold',
        color: C.buttonColor,
        backgroundColor: C.buttonBg,
        padding: { x: C.buttonPadX, y: C.buttonPadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(C.buttonBgHover));
    button.on('pointerout', () => button.setBackgroundColor(C.buttonBg));
    button.on('pointerup', () => this.finish());
  }

  private finish(): void {
    if (this.phase !== 'results' || !this.continueReady) return;
    this.phase = 'done';
    (this.scene.get('GameScene') as GameScene).finishChest();
    this.scene.stop();
  }
}
