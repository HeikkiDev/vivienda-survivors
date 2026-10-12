import Phaser from 'phaser';
import { BEST_TIME_STORAGE_KEY, GAME_HEIGHT, GAME_WIDTH, LANGUAGES, UI } from '../config';
import { enterFullscreenLandscape, shouldShowIOSInstallHint } from '../mobile';
import { getLanguage, LANGUAGE_NAMES, setLanguage, TEXTS } from '../texts';
import { centerOnBaseArea } from '../utils/layout';
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
    centerOnBaseArea(this);

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

    this.createLanguageSelector(cx);

    if (shouldShowIOSInstallHint()) {
      this.add
        .text(cx, m.iosHintY, TEXTS.mobile.iosFullscreen, {
          fontFamily: UI.fontFamily,
          fontSize: `${m.iosHintSize}px`,
          color: m.iosHintColor,
        })
        .setOrigin(0.5);
    }

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
  }

  private createLanguageSelector(cx: number): void {
    const m = UI.menu;
    const current = getLanguage();
    const items: Phaser.GameObjects.Text[] = [
      this.add.text(0, m.langY, TEXTS.menu.language, {
        fontFamily: UI.fontFamily,
        fontSize: `${m.langSize}px`,
        color: m.langLabelColor,
      }),
    ];

    for (const lang of LANGUAGES) {
      const active = lang === current;
      const button = this.add.text(0, m.langY, LANGUAGE_NAMES[lang], {
        fontFamily: UI.fontFamily,
        fontSize: `${m.langSize}px`,
        fontStyle: active ? 'bold' : 'normal',
        color: active ? m.langActiveColor : m.langColor,
        backgroundColor: active ? m.langActiveBg : m.langBg,
        padding: { x: m.langPadX, y: m.langPadY },
      });
      if (!active) {
        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => button.setBackgroundColor(m.langBgHover));
        button.on('pointerout', () => button.setBackgroundColor(m.langBg));
        button.on('pointerup', () => {
          setLanguage(lang);
          this.scene.restart();
        });
      }
      items.push(button);
    }

    const totalWidth = items.reduce((sum, t) => sum + t.width, 0) + m.langGap * (items.length - 1);
    let x = cx - totalWidth / 2;
    for (const item of items) {
      item.setOrigin(0, 0.5).setX(x);
      x += item.width + m.langGap;
    }
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
    void enterFullscreenLandscape();
    this.scene.start('GameScene');
  }
}
