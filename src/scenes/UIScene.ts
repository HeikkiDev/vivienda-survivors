import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, UI } from '../config';
import { TEXTS } from '../texts';
import { formatTime } from '../utils/math';
import { createVisual } from '../visuals';
import type { GameScene, HudState } from './GameScene';

/** HUD en escena paralela (no se mueve con la cámara). */
export class UIScene extends Phaser.Scene {
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private inventoryObjects: Phaser.GameObjects.GameObject[] = [];
  private inventoryKey = '';

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
    this.inventoryObjects = [];
    this.inventoryKey = '';
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
    this.updateInventory(s.inventory);
  }

  /** Iconos de armas/pasivas con su nivel (abajo a la izquierda). Solo se rehace si cambia. */
  private updateInventory(inventory: HudState['inventory']): void {
    const key = inventory.map((i) => `${i.icon}:${i.level}`).join('|');
    if (key === this.inventoryKey) return;
    this.inventoryKey = key;
    for (const o of this.inventoryObjects) o.destroy();
    this.inventoryObjects = [];
    const c = UI.hudIcons;
    const h = UI.hud;
    const y = GAME_HEIGHT - c.marginBottom;
    inventory.forEach((item, i) => {
      const x = c.marginX + c.spacing / 2 + i * c.spacing;
      this.inventoryObjects.push(createVisual(this, item.icon, x, y));
      this.inventoryObjects.push(
        this.add
          .text(x + c.levelOffsetX, y + c.levelOffsetY, String(item.level), {
            fontFamily: UI.fontFamily,
            fontSize: `${c.levelSize}px`,
            fontStyle: 'bold',
            color: h.textColor,
            stroke: h.textStroke,
            strokeThickness: h.textStrokeThickness,
          })
          .setOrigin(0.5),
      );
    });
  }
}
