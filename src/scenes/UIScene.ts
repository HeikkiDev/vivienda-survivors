import Phaser from 'phaser';
import { GAME_WIDTH, UI } from '../config';
import { TEXTS } from '../texts';
import { formatTime } from '../utils/math';
import type { GameScene } from './GameScene';

/** HUD en escena paralela (no se mueve con la cámara). */
export class UIScene extends Phaser.Scene {
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const h = UI.hud;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UI.fontFamily,
      fontSize: `${h.textSize}px`,
      fontStyle: 'bold',
      color: h.textColor,
      stroke: h.textStroke,
      strokeThickness: h.textStrokeThickness,
    };
    this.xpBar = this.add.graphics();
    this.levelText = this.add.text(h.textMarginX, h.xpBarHeight + h.textY, '', style).setOrigin(0, 0.5);
    this.timerText = this.add.text(GAME_WIDTH / 2, h.xpBarHeight + h.textY, '', style).setOrigin(0.5);
  }

  update(): void {
    const game = this.scene.get('GameScene') as GameScene;
    const s = game.hud;
    const h = UI.hud;
    const ratio = s.xpToNext > 0 ? Math.min(1, s.xp / s.xpToNext) : 0;
    this.xpBar
      .clear()
      .fillStyle(h.xpBarBg, h.xpBarBgAlpha)
      .fillRect(0, 0, GAME_WIDTH, h.xpBarHeight)
      .fillStyle(h.xpBarFg, 1)
      .fillRect(0, 0, GAME_WIDTH * ratio, h.xpBarHeight);
    this.levelText.setText(TEXTS.hud.level(s.level));
    this.timerText.setText(formatTime(s.elapsed));
  }
}
