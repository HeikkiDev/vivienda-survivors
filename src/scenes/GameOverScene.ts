import Phaser from 'phaser';
import { BEST_TIME_STORAGE_KEY, GAME_WIDTH, SHARE_CARD, SHARE_URL, UI } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { TEXTS } from '../texts';
import { addBaseOverlay, centerOnBaseArea } from '../utils/layout';
import { formatTime } from '../utils/math';
import { shareResult } from '../utils/share';
import { createShareCard } from '../utils/shareCard';

export interface GameOverData {
  victory: boolean;
  timeSeconds: number;
  level: number;
  kills: number;
  brokenPromises: number;
  evolutions: number;
  chestsOpened: number;
  /** false si la partida empezó con `?min=N` (no cuenta para el récord). */
  recordable: boolean;
  /** Captura del final de la partida (null si no se pudo tomar). */
  snapshot: HTMLImageElement | null;
}

export class GameOverScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    this.leaving = false;
    const g = UI.gameOver;
    const cx = GAME_WIDTH / 2;
    if (data.recordable) GameOverScene.saveBest(data.timeSeconds);

    centerOnBaseArea(this);
    addBaseOverlay(this, g.overlayColor, g.overlayAlpha);

    this.add
      .text(cx, g.titleY, data.victory ? TEXTS.gameOver.victoryTitle : TEXTS.gameOver.defeatTitle, {
        fontFamily: UI.fontFamily,
        fontSize: `${g.titleSize}px`,
        fontStyle: 'bold',
        color: g.titleColor,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, g.subtitleY, data.victory ? TEXTS.gameOver.victorySubtitle : TEXTS.gameOver.defeatSubtitle, {
        fontFamily: UI.fontFamily,
        fontSize: `${g.subtitleSize}px`,
        fontStyle: 'italic',
        color: g.subtitleColor,
      })
      .setOrigin(0.5);

    const stats = [
      TEXTS.gameOver.level(data.level),
      TEXTS.gameOver.kills(data.kills),
      TEXTS.gameOver.brokenPromises(data.brokenPromises),
      TEXTS.gameOver.evolutions(data.evolutions),
      TEXTS.gameOver.chests(data.chestsOpened),
    ];
    if (!data.victory) stats.push(TEXTS.gameOver.timeSurvived(formatTime(data.timeSeconds)));
    this.add
      .text(cx, g.statsY, stats.join('\n'), {
        fontFamily: UI.fontFamily,
        fontSize: `${g.statsSize}px`,
        color: g.statsColor,
        align: 'center',
        lineSpacing: g.statsLineSpacing,
      })
      .setOrigin(0.5, 0);

    const button = this.add
      .text(cx, g.buttonY, data.victory ? TEXTS.gameOver.victoryButton : TEXTS.gameOver.retry, {
        fontFamily: UI.fontFamily,
        fontSize: `${g.buttonSize}px`,
        fontStyle: 'bold',
        color: g.buttonColor,
        backgroundColor: g.buttonBg,
        padding: { x: g.buttonPadX, y: g.buttonPadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(g.buttonBgHover));
    button.on('pointerout', () => button.setBackgroundColor(g.buttonBg));
    button.on('pointerup', () => this.restart());
    this.input.keyboard?.once('keydown-ENTER', () => this.restart());

    this.createShareButton(cx, data);
  }

  private createShareButton(cx: number, data: GameOverData): void {
    const g = UI.gameOver;
    const stats = {
      time: formatTime(data.timeSeconds),
      level: data.level,
      kills: data.kills,
      brokenPromises: data.brokenPromises,
      url: SHARE_URL,
    };
    const text = data.victory ? TEXTS.gameOver.shareVictory(stats) : TEXTS.gameOver.shareDefeat(stats);
    // Se genera ya para que esté lista al pulsar (el portapapeles exige seguir dentro del gesto).
    const image = data.snapshot
      ? createShareCard(data.snapshot, {
          title: data.victory ? TEXTS.gameOver.victoryTitle : TEXTS.gameOver.defeatTitle,
          stats: TEXTS.gameOver.cardStats(stats),
          footer: TEXTS.gameOver.cardFooter(SHARE_URL),
        })
      : null;
    const feedback: Partial<Record<Awaited<ReturnType<typeof shareResult>>, string>> = {
      copied: TEXTS.gameOver.copied,
      imageCopied: TEXTS.gameOver.imageCopied,
      imageDownloaded: TEXTS.gameOver.imageDownloaded,
    };
    const button = this.add
      .text(cx, g.shareY, TEXTS.gameOver.share, {
        fontFamily: UI.fontFamily,
        fontSize: `${g.shareSize}px`,
        fontStyle: 'bold',
        color: g.shareColor,
        backgroundColor: g.shareBg,
        padding: { x: g.sharePadX, y: g.sharePadY },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(g.shareBgHover));
    button.on('pointerout', () => button.setBackgroundColor(g.shareBg));
    let resetTimer: Phaser.Time.TimerEvent | null = null;
    // pointerup sigue siendo un gesto del usuario: navigator.share y el portapapeles lo exigen.
    button.on('pointerup', async () => {
      const result = await shareResult({ text, image, fileName: SHARE_CARD.fileName, mimeType: SHARE_CARD.mimeType });
      if (!this.scene.isActive()) return;
      if (result === 'manual') {
        window.prompt(TEXTS.gameOver.manualCopy, text);
        return;
      }
      const label = feedback[result];
      if (!label) return;
      button.setText(label);
      resetTimer?.remove();
      resetTimer = this.time.delayedCall(g.copiedMs, () => button.setText(TEXTS.gameOver.share));
    });
  }

  private static saveBest(timeSeconds: number): void {
    try {
      const prev = Number(localStorage.getItem(BEST_TIME_STORAGE_KEY));
      if (!Number.isFinite(prev) || timeSeconds > prev) {
        localStorage.setItem(BEST_TIME_STORAGE_KEY, String(Math.floor(timeSeconds)));
      }
    } catch {
      // localStorage no disponible (modo privado, iframe…): se ignora el récord.
    }
  }

  private restart(): void {
    if (this.leaving) return;
    this.leaving = true;
    AudioManager.startMusic();
    this.scene.start('GameScene');
  }
}
