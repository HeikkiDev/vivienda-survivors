import Phaser from 'phaser';
import { BEST_TIME_STORAGE_KEY, GAME_HEIGHT, GAME_WIDTH, INFO_PAGES, LANGUAGES, UI } from '../config';
import { enterFullscreenLandscape, shouldShowIOSInstallHint } from '../mobile';
import { Ads } from '../systems/ads';
import { AudioManager } from '../systems/AudioManager';
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
    this.createFooterLinks(cx);

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

  /** Guía, Privacidad, Acerca de y, si hay CMP (anuncios configurados), Preferencias de privacidad. */
  private createFooterLinks(cx: number): void {
    const m = UI.menu;
    const y = GAME_HEIGHT - m.linksMarginBottom;
    const links: Array<[string, () => void]> = [
      [TEXTS.menu.guide, () => MenuScene.openPage(INFO_PAGES.guide)],
      [TEXTS.menu.privacy, () => MenuScene.openPage(INFO_PAGES.privacy)],
      [TEXTS.menu.about, () => MenuScene.openPage(INFO_PAGES.about)],
    ];
    if (Ads.hasConsentManager) links.push([TEXTS.menu.privacySettings, () => Ads.showPrivacyOptions()]);

    const items = links.map(([label, onClick]) => {
      const link = this.add
        .text(0, y, label, { fontFamily: UI.fontFamily, fontSize: `${m.linksSize}px`, color: m.linksColor })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      link.on('pointerover', () => link.setColor(m.linksHoverColor));
      link.on('pointerout', () => link.setColor(m.linksColor));
      link.on('pointerup', onClick);
      return link;
    });
    const totalWidth = items.reduce((sum, t) => sum + t.width, 0) + m.linksGap * (items.length - 1);
    let x = cx - totalWidth / 2;
    for (const item of items) {
      item.setX(x);
      x += item.width + m.linksGap;
    }
  }

  /** Abre una página de `public/` en otra pestaña, en la sección del idioma activo (o en esta si se bloquea). */
  private static openPage(page: string): void {
    const url = new URL(`${page}#${getLanguage()}`, document.baseURI).href;
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.assign(url);
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
    // La guía estática está bajo el juego: se vuelve arriba para jugar con la pantalla entera.
    window.scrollTo(0, 0);
    void enterFullscreenLandscape();
    // Dentro del gesto del usuario: necesario para que iOS permita el audio.
    AudioManager.startMusic();
    this.scene.start('GameScene');
  }
}
