import Phaser from 'phaser';
import { GAME_WIDTH, UI } from '../config';
import { type UpgradeOption, upgradeIcon, upgradeTexts } from '../systems/Upgrades';
import { TEXTS } from '../texts';
import { addBaseOverlay, centerOnBaseArea } from '../utils/layout';
import { createVisual } from '../visuals';
import type { GameScene } from './GameScene';

export interface LevelUpData {
  options: UpgradeOption[];
}

const KEY_NAMES = ['ONE', 'TWO', 'THREE'] as const;
const NUMPAD_KEY_NAMES = ['NUMPAD_ONE', 'NUMPAD_TWO', 'NUMPAD_THREE'] as const;

/** Overlay modal de subida de nivel. GameScene está pausada mientras está abierto. */
export class LevelUpScene extends Phaser.Scene {
  private options: UpgradeOption[] = [];
  private chosen = false;

  constructor() {
    super('LevelUpScene');
  }

  create(data: LevelUpData): void {
    this.options = data.options;
    this.chosen = false;
    const L = UI.levelUp;

    centerOnBaseArea(this);
    addBaseOverlay(this, L.overlayColor, L.overlayAlpha).setInteractive();
    this.add
      .text(GAME_WIDTH / 2, L.titleY, TEXTS.levelUp.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.titleSize}px`,
        fontStyle: 'bold',
        color: L.titleColor,
      })
      .setOrigin(0.5);

    const n = this.options.length;
    const totalW = n * L.cardWidth + (n - 1) * L.cardGap;
    const startX = (GAME_WIDTH - totalW) / 2 + L.cardWidth / 2;
    this.options.forEach((opt, i) => this.createCard(opt, i, startX + i * (L.cardWidth + L.cardGap)));

    this.options.forEach((_opt, i) => {
      this.input.keyboard?.on(`keydown-${KEY_NAMES[i]}`, () => this.choose(i));
      this.input.keyboard?.on(`keydown-${NUMPAD_KEY_NAMES[i]}`, () => this.choose(i));
    });
  }

  private createCard(opt: UpgradeOption, index: number, cx: number): void {
    const L = UI.levelUp;
    const top = L.cardY - L.cardHeight / 2;
    const textWidth = L.cardWidth - L.cardPadding * 2;
    const isEvolution = opt.kind === 'evolution';
    const color = isEvolution ? L.evolutionCardColor : L.cardColor;
    const hoverColor = isEvolution ? L.evolutionCardHoverColor : L.cardHoverColor;
    const card = this.add
      .rectangle(cx, L.cardY, L.cardWidth, L.cardHeight, color)
      .setStrokeStyle(
        isEvolution ? L.evolutionStrokeWidth : L.cardStrokeWidth,
        isEvolution ? L.evolutionStrokeColor : L.cardStrokeColor,
      )
      .setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setFillStyle(hoverColor));
    card.on('pointerout', () => card.setFillStyle(color));
    card.on('pointerup', () => this.choose(index));

    this.add
      .text(cx, top + L.keyY, TEXTS.levelUp.key(index + 1), {
        fontFamily: UI.fontFamily,
        fontSize: `${L.keySize}px`,
        color: L.keyColor,
      })
      .setOrigin(0.5);

    const icon = createVisual(this, upgradeIcon(opt), cx, top + L.iconY);
    icon.setScale(icon.scaleX * L.iconScale);

    const { name, desc, effect } = upgradeTexts(opt);
    this.add
      .text(cx, top + L.nameY, name, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.nameSize}px`,
        fontStyle: 'bold',
        color: L.nameColor,
        align: 'center',
        wordWrap: { width: textWidth },
      })
      .setOrigin(0.5);

    const isNew = (opt.kind === 'weapon' || opt.kind === 'passive') && opt.currentLevel === 0;
    let levelLabel = '';
    let levelColor: string = L.levelColor;
    if (isEvolution) {
      levelLabel = TEXTS.levelUp.evolution;
      levelColor = L.evolutionColor;
    } else if (isNew) {
      levelLabel = TEXTS.levelUp.newItem;
      levelColor = L.newColor;
    } else if (opt.kind === 'weapon' || opt.kind === 'passive') {
      levelLabel = TEXTS.levelUp.levelChange(opt.currentLevel);
    }
    this.add
      .text(cx, top + L.levelY, levelLabel, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.levelSize}px`,
        fontStyle: 'bold',
        color: levelColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, top + L.effectY, effect, {
        fontFamily: UI.fontFamily,
        fontSize: `${isEvolution ? L.evolutionEffectSize : L.effectSize}px`,
        color: L.effectColor,
        align: 'center',
        wordWrap: { width: textWidth },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, top + L.cardHeight - L.descBottom, desc, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.descSize}px`,
        fontStyle: 'italic',
        color: L.descColor,
        align: 'center',
        wordWrap: { width: textWidth },
      })
      .setOrigin(0.5, 1);
  }

  private choose(index: number): void {
    if (this.chosen || index >= this.options.length) return;
    this.chosen = true;
    const game = this.scene.get('GameScene') as GameScene;
    game.applyUpgrade(this.options[index]);
    const next = game.finishLevelUp();
    if (next) {
      this.scene.restart({ options: next } satisfies LevelUpData);
    } else {
      this.scene.stop();
    }
  }
}
