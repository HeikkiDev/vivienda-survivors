import Phaser from 'phaser';
import { BEST_TIME_STORAGE_KEY, GAME_HEIGHT, GAME_WIDTH, UI } from '../config';
import { TEXTS } from '../texts';
import { formatTime } from '../utils/math';

export class MenuScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.starting = false;
    const m = UI.menu;
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(m.bgColor);

    this.add
      .text(cx, m.titleY, TEXTS.menu.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${m.titleSize}px`,
        fontStyle: 'bold',
        color: m.titleColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, m.subtitleY, TEXTS.menu.subtitle, {
        fontFamily: UI.fontFamily,
        fontSize: `${m.subtitleSize}px`,
        fontStyle: 'italic',
        color: m.subtitleColor,
      })
      .setOrigin(0.5);

    const button = this.add
      .text(cx, m.buttonY, TEXTS.menu.play, {
        fontFamily: UI.fontFamily,
        fontSize: `${m.buttonSize}px`,
        fontStyle: 'bold',
        color: m.buttonColor,
        backgroundColor: m.buttonBg,
        padding: { x: m.buttonPadX, y: m.buttonPadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(m.buttonBgHover));
    button.on('pointerout', () => button.setBackgroundColor(m.buttonBg));
    button.on('pointerup', () => this.startGame());

    this.add
      .text(cx, m.bestY, this.bestText(), {
        fontFamily: UI.fontFamily,
        fontSize: `${m.bestSize}px`,
        color: m.bestColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - m.footerMarginBottom, TEXTS.menu.footer, {
        fontFamily: UI.fontFamily,
        fontSize: `${m.footerSize}px`,
        color: m.footerColor,
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
  }

  private bestText(): string {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(BEST_TIME_STORAGE_KEY);
    } catch {
      raw = null;
    }
    const best = raw === null ? NaN : Number(raw);
    return Number.isFinite(best) ? TEXTS.menu.best(formatTime(best)) : TEXTS.menu.noBest;
  }

  private startGame(): void {
    if (this.starting) return;
    this.starting = true;
    this.scene.start('GameScene');
  }
}
