import Phaser from 'phaser';
import { BEST_TIME_STORAGE_KEY, GAME_HEIGHT, GAME_WIDTH, UI } from '../config';
import { TEXTS } from '../texts';
import { formatTime } from '../utils/math';

export interface GameOverData {
  victory: boolean;
  timeSeconds: number;
  level: number;
  kills: number;
  brokenPromises: number;
  /** false si la partida empezó con `?min=N` (no cuenta para el récord). */
  recordable: boolean;
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

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, g.overlayColor, g.overlayAlpha).setOrigin(0);

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
    this.scene.start('GameScene');
  }
}
