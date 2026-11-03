import Phaser from 'phaser';
import { GAME_WIDTH, UI } from '../config';
import { TEXTS } from '../texts';
import { addBaseOverlay, centerOnBaseArea } from '../utils/layout';

export interface ReviveData {
  /** Reproduce el anuncio con recompensa (hay que llamarlo dentro del gesto del usuario). */
  watch: () => void;
  decline: () => void;
}

/**
 * Overlay modal tras la primera muerte, solo si hay un anuncio con recompensa listo.
 * GameScene está en pausa y decide (revivir o derrota) cuando termina el anuncio.
 */
export class ReviveScene extends Phaser.Scene {
  private chosen = false;

  constructor() {
    super('ReviveScene');
  }

  create(data: ReviveData): void {
    this.chosen = false;
    const r = UI.revive;
    const cx = GAME_WIDTH / 2;

    centerOnBaseArea(this);
    addBaseOverlay(this, r.overlayColor, r.overlayAlpha).setInteractive();

    this.add
      .text(cx, r.titleY, TEXTS.revive.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${r.titleSize}px`,
        fontStyle: 'bold',
        color: r.titleColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, r.subtitleY, TEXTS.revive.subtitle, {
        fontFamily: UI.fontFamily,
        fontSize: `${r.subtitleSize}px`,
        fontStyle: 'italic',
        color: r.subtitleColor,
      })
      .setOrigin(0.5);

    const watch = this.add
      .text(cx, r.buttonY, TEXTS.revive.watch, {
        fontFamily: UI.fontFamily,
        fontSize: `${r.buttonSize}px`,
        fontStyle: 'bold',
        color: r.buttonColor,
        backgroundColor: r.buttonBg,
        padding: { x: r.buttonPadX, y: r.buttonPadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    watch.on('pointerover', () => watch.setBackgroundColor(r.buttonBgHover));
    watch.on('pointerout', () => watch.setBackgroundColor(r.buttonBg));

    const decline = this.add
      .text(cx, r.declineY, TEXTS.revive.decline, {
        fontFamily: UI.fontFamily,
        fontSize: `${r.declineSize}px`,
        color: r.declineColor,
        backgroundColor: r.declineBg,
        padding: { x: r.declinePadX, y: r.declinePadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    decline.on('pointerover', () => decline.setBackgroundColor(r.declineBgHover));
    decline.on('pointerout', () => decline.setBackgroundColor(r.declineBg));

    const status = this.add
      .text(cx, r.statusY, TEXTS.revive.loading, {
        fontFamily: UI.fontFamily,
        fontSize: `${r.statusSize}px`,
        color: r.statusColor,
      })
      .setOrigin(0.5)
      .setVisible(false);

    const choose = (watchAd: boolean): void => {
      if (this.chosen) return;
      this.chosen = true;
      watch.disableInteractive();
      decline.disableInteractive();
      if (watchAd) {
        status.setVisible(true);
        data.watch();
      } else {
        data.decline();
      }
    };
    // pointerup sigue siendo un gesto del usuario: el SDK de anuncios lo exige para reproducir el anuncio.
    watch.on('pointerup', () => choose(true));
    decline.on('pointerup', () => choose(false));
    this.input.keyboard?.once('keydown-ENTER', () => choose(true));
    this.input.keyboard?.once('keydown-ESC', () => choose(false));
  }
}
