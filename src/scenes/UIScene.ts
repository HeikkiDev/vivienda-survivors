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
  private promiseBanner!: Phaser.GameObjects.Text;
  private promiseArrow!: Phaser.GameObjects.Graphics;

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

    const p = UI.promise;
    this.promiseBanner = this.add
      .text(GAME_WIDTH / 2, p.bannerY, '', {
        fontFamily: UI.fontFamily,
        fontSize: `${p.bannerSize}px`,
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: p.bannerBg,
        padding: { x: p.bannerPadX, y: p.bannerPadY },
        stroke: h.textStroke,
        strokeThickness: h.textStrokeThickness,
        lineSpacing: p.bannerLineSpacing,
      })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.promiseArrow = this.add.graphics();
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
    this.updatePromiseBanner(s.promise);
    this.updatePromiseArrow(s.promisePickup);
  }

  private updatePromiseBanner(status: HudState['promise']): void {
    if (!status) {
      this.promiseBanner.setVisible(false);
      return;
    }
    const p = UI.promise;
    const countdown = TEXTS.promise.countdown(Math.ceil(status.remaining));
    let text: string;
    let color: string;
    if (status.phase === 'buff') {
      text = `${TEXTS.promises[status.id]}\n${countdown}`;
      color = p.buffColor;
    } else if (status.phase === 'debuff') {
      text = `${TEXTS.promise.broken}\n${countdown}`;
      color = p.brokenColor;
    } else {
      text = TEXTS.promise.fulfilled;
      color = p.fulfilledColor;
    }
    this.promiseBanner.setText(text).setColor(color).setVisible(true);
  }

  /** Flecha en el borde de la pantalla apuntando a la urna si está fuera de vista. */
  private updatePromiseArrow(target: HudState['promisePickup']): void {
    this.promiseArrow.clear();
    if (!target) return;
    const onScreen = target.x >= 0 && target.x <= GAME_WIDTH && target.y >= 0 && target.y <= GAME_HEIGHT;
    if (onScreen) return;
    const p = UI.promise;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;
    const t = Math.min((cx - p.arrowMargin) / Math.abs(dx || 1), (cy - p.arrowMargin) / Math.abs(dy || 1));
    const ax = cx + dx * t;
    const ay = cy + dy * t;
    const angle = Math.atan2(dy, dx);
    const s = p.arrowSize;
    const tip = { x: ax + Math.cos(angle) * s, y: ay + Math.sin(angle) * s };
    const left = { x: ax + Math.cos(angle + p.arrowWingAngle) * s, y: ay + Math.sin(angle + p.arrowWingAngle) * s };
    const right = { x: ax + Math.cos(angle - p.arrowWingAngle) * s, y: ay + Math.sin(angle - p.arrowWingAngle) * s };
    this.promiseArrow
      .fillStyle(p.arrowColor, 1)
      .lineStyle(p.arrowStrokeWidth, p.arrowStroke, 1)
      .fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y)
      .strokeTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
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
