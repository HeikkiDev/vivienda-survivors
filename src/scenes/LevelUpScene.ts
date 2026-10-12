import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI } from '../config';
import { type UpgradeOption, upgradeIcon, upgradeTexts } from '../systems/Upgrades';
import { TEXTS } from '../texts';
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

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, L.overlayColor, L.overlayAlpha).setOrigin(0).setInteractive();
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
    const card = this.add
      .rectangle(cx, L.cardY, L.cardWidth, L.cardHeight, L.cardColor)
      .setStrokeStyle(L.cardStrokeWidth, L.cardStrokeColor)
      .setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setFillStyle(L.cardHoverColor));
    card.on('pointerout', () => card.setFillStyle(L.cardColor));
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

    const { name, desc } = upgradeTexts(opt);
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

    const isNew = opt.kind !== 'cana' && opt.currentLevel === 0;
    const levelLabel = opt.kind === 'cana' ? '' : isNew ? TEXTS.levelUp.newItem : TEXTS.levelUp.levelChange(opt.currentLevel);
    this.add
      .text(cx, top + L.levelY, levelLabel, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.levelSize}px`,
        fontStyle: 'bold',
        color: isNew ? L.newColor : L.levelColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, top + L.descY, desc, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.descSize}px`,
        fontStyle: 'italic',
        color: L.descColor,
        align: 'center',
        wordWrap: { width: textWidth },
      })
      .setOrigin(0.5, 0);
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
