import Phaser from 'phaser';
import { DEFEAT_ANIM, type FallingPiecesConfig, PROMISES, UI, VICTORY_ANIM } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { TEXTS } from '../texts';
import { onGameResize } from '../utils/layout';
import { formatTime } from '../utils/math';
import { createVisual } from '../visuals';
import type { EnemyId } from '../types';
import type { EndingKind, GameScene, HudState } from './GameScene';

type HudButton = ReturnType<typeof createVisual>;

/** HUD en escena paralela (no se mueve con la cámara). */
export class UIScene extends Phaser.Scene {
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private inventoryObjects: Phaser.GameObjects.GameObject[] = [];
  private inventoryKey = '';
  private promiseBanner!: Phaser.GameObjects.Text;
  private promiseArrow!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;
  private announcementText!: Phaser.GameObjects.Text;
  private enemyIntroCard: Phaser.GameObjects.Container | null = null;
  private enemyIntroId: EnemyId | null = null;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseVeil!: Phaser.GameObjects.Rectangle;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pauseHint!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.GameObject &
    Phaser.GameObjects.Components.Transform &
    Phaser.GameObjects.Components.Visible;
  private muteOnButton!: HudButton;
  private muteOffButton!: HudButton;
  private pausedByUser = false;
  private endingShown = false;

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
    this.timerText = this.add.text(0, h.xpBarHeight + h.textY, '', style).setOrigin(0.5);
    this.inventoryObjects = [];
    this.inventoryKey = '';

    const p = UI.promise;
    this.promiseBanner = this.add
      .text(0, p.bannerY, '', {
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
    this.bossBar = this.add.graphics();

    const a = UI.announcement;
    this.announcementText = this.add
      .text(0, a.y, '', {
        fontFamily: UI.fontFamily,
        fontSize: `${a.size}px`,
        fontStyle: 'bold',
        align: 'center',
        stroke: h.textStroke,
        strokeThickness: h.textStrokeThickness,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.enemyIntroCard = null;
    this.enemyIntroId = null;
    this.endingShown = false;

    this.createPauseControls();
    this.layout();
    onGameResize(this, () => this.layout());
  }

  /** Coloca lo anclado al centro o a los bordes según el tamaño actual de la vista (Scale.EXPAND). */
  private layout(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const p = UI.pause;
    this.timerText.setX(cx);
    this.promiseBanner.setX(cx);
    this.announcementText.setX(cx);
    this.pauseButton.setX(width - p.buttonMarginX);
    this.muteOnButton.setX(width - p.buttonMarginX - p.muteOffsetX);
    this.muteOffButton.setX(width - p.buttonMarginX - p.muteOffsetX);
    this.pauseVeil.setSize(width, height);
    this.pauseTitle.setX(cx);
    this.pauseHint.setX(cx);
    this.enemyIntroCard?.setPosition(cx, height - UI.enemyIntro.marginBottom);
    // Fuerza a rehacer el inventario en su nueva posición.
    this.inventoryKey = '';
  }

  private createPauseControls(): void {
    const p = UI.pause;
    this.pausedByUser = false;
    const button = this.createHudButton('icon_pause', () => this.togglePause());
    this.pauseButton = button;
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.muteOnButton = this.createHudButton('icon_sound_on', () => this.toggleMute());
    this.muteOffButton = this.createHudButton('icon_sound_off', () => this.toggleMute());
    this.input.keyboard?.on('keydown-M', () => this.toggleMute());
    this.refreshMuteButton();

    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, p.overlayColor, p.overlayAlpha).setOrigin(0);
    this.pauseVeil = overlay;
    const title = this.add
      .text(0, p.titleY, TEXTS.pause.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${p.titleSize}px`,
        fontStyle: 'bold',
        color: p.titleColor,
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(0, p.hintY, TEXTS.pause.hint, {
        fontFamily: UI.fontFamily,
        fontSize: `${p.hintSize}px`,
        color: p.hintColor,
      })
      .setOrigin(0.5);
    this.pauseTitle = title;
    this.pauseHint = hint;
    this.pauseOverlay = this.add.container(0, 0, [overlay, title, hint]).setVisible(false);
    // Los botones quedan por encima del velo para poder reanudar con un toque.
    this.children.bringToTop(button);
    this.children.bringToTop(this.muteOnButton);
    this.children.bringToTop(this.muteOffButton);
  }

  private createHudButton(id: 'icon_pause' | 'icon_sound_on' | 'icon_sound_off', onPress: () => void): HudButton {
    const p = UI.pause;
    const button = createVisual(this, id, 0, p.buttonY);
    const hit = new Phaser.Geom.Rectangle(
      -p.buttonHitPadding,
      -p.buttonHitPadding,
      button.width + p.buttonHitPadding * 2,
      button.height + p.buttonHitPadding * 2,
    );
    button.setInteractive({ hitArea: hit, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    button.on('pointerdown', onPress);
    return button;
  }

  private toggleMute(): void {
    AudioManager.toggleMute();
    this.refreshMuteButton();
  }

  private refreshMuteButton(): void {
    const muted = AudioManager.muted;
    this.muteOnButton.setVisible(!muted);
    this.muteOffButton.setVisible(muted);
  }

  private togglePause(): void {
    const game = this.scene.get('GameScene') as GameScene;
    if (this.pausedByUser) {
      this.pausedByUser = false;
      this.pauseOverlay.setVisible(false);
      AudioManager.setMusicDucked(false);
      this.scene.resume('GameScene');
      return;
    }
    if (!game.canPause) return;
    this.pausedByUser = true;
    this.pauseOverlay.setVisible(true);
    AudioManager.setMusicDucked(true);
    this.scene.pause('GameScene');
  }

  update(): void {
    const game = this.scene.get('GameScene') as GameScene;
    const s = game.hud;
    const h = UI.hud;
    const ratio = s.xpToNext > 0 ? Math.min(1, s.xp / s.xpToNext) : 0;
    this.xpBar
      .clear()
      .fillStyle(h.xpBarBg, h.xpBarBgAlpha)
      .fillRect(0, 0, this.scale.width, h.xpBarHeight)
      .fillStyle(h.xpBarFg, 1)
      .fillRect(0, 0, this.scale.width * ratio, h.xpBarHeight);
    this.levelText.setText(TEXTS.hud.level(s.level));
    this.timerText.setText(formatTime(s.elapsed));
    this.updateInventory(s.inventory);
    this.updatePromiseBanner(s.promise);
    this.promiseArrow.clear();
    if (s.promisePickup) this.drawArrow(s.promisePickup);
    for (const elite of s.elites) this.drawArrow(elite);
    this.updateBossBar(s.boss);
    this.updateAnnouncement(s.announcement);
    this.updateEnemyIntro(s.enemyIntro);
    if (s.ending) this.showEnding(s.ending);
  }

  private showEnding(kind: EndingKind): void {
    if (this.endingShown) return;
    this.endingShown = true;
    this.pauseButton.setVisible(false).disableInteractive();
    if (kind === 'victory') this.showVictory();
    else this.showDefeat();
  }

  private addEndingText(y: number, text: string, size: number, color: string, strokeThickness: number): Phaser.GameObjects.Text {
    return this.add
      .text(this.scale.width / 2, y, text, {
        fontFamily: UI.fontFamily,
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        stroke: UI.hud.textStroke,
        strokeThickness,
      })
      .setOrigin(0.5);
  }

  /** Celebración de victoria: confeti, título que aparece de golpe y late, subtítulo y fundido. */
  private showVictory(): void {
    const v = UI.victory;
    const { width, height } = this.scale;

    this.spawnFalling(width, height, v.confetti);

    const titleY = height * v.titleYRatio;
    const title = this.addEndingText(titleY, TEXTS.victory.title, v.titleSize, v.titleColor, v.titleStrokeThickness).setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: v.popMs, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: title,
      scale: v.pulseScale,
      duration: v.pulseMs,
      delay: v.popMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.addEndingText(
      titleY + v.subtitleGap,
      TEXTS.victory.subtitle,
      v.subtitleSize,
      v.subtitleColor,
      UI.hud.textStrokeThickness,
    ).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: v.subtitleFadeMs, delay: v.subtitleDelayMs });

    this.time.delayedCall(VICTORY_ANIM.durationMs, () => this.cameras.main.fadeOut(VICTORY_ANIM.fadeOutMs));
  }

  /** Derrota: velo rojo oscuro, título que cae rebotando, subtítulo y fundido. */
  private showDefeat(): void {
    const d = UI.defeat;
    const { width, height } = this.scale;

    const veil = this.add.rectangle(0, 0, width, height, d.veilColor, 1).setOrigin(0).setAlpha(0);
    this.tweens.add({ targets: veil, alpha: d.veilAlpha, duration: d.veilMs });

    const titleY = height * d.titleYRatio;
    const title = this.addEndingText(-d.titleSize, TEXTS.defeat.title, d.titleSize, d.titleColor, d.titleStrokeThickness);
    this.tweens.add({ targets: title, y: titleY, duration: d.titleDropMs, delay: d.titleDropDelayMs, ease: 'Bounce.easeOut' });

    const subtitle = this.addEndingText(
      titleY + d.subtitleGap,
      TEXTS.defeat.subtitle,
      d.subtitleSize,
      d.subtitleColor,
      UI.hud.textStrokeThickness,
    ).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: d.subtitleFadeMs, delay: d.subtitleDelayMs });

    this.time.delayedCall(DEFEAT_ANIM.durationMs, () => this.cameras.main.fadeOut(DEFEAT_ANIM.fadeOutMs));
  }

  /** Confeti: rectángulos que caen de arriba abajo escalonados. */
  private spawnFalling(width: number, height: number, p: FallingPiecesConfig): void {
    for (let i = 0; i < p.count; i++) {
      const w = Phaser.Math.Between(p.minW, p.maxW);
      const h = Phaser.Math.Between(p.minH, p.maxH);
      const x = Phaser.Math.Between(0, width);
      const color = Phaser.Utils.Array.GetRandom(p.colors as number[]);
      const piece = this.add
        .rectangle(x, -h, w, h, color, p.alpha)
        .setAngle(Phaser.Math.Between(-p.angleJitter, p.angleJitter));
      this.tweens.add({
        targets: piece,
        y: height + h,
        x: x + Phaser.Math.Between(-p.driftX, p.driftX),
        angle: piece.angle + Phaser.Math.Between(-p.spinDeg, p.spinDeg),
        duration: Phaser.Math.Between(p.fallMinMs, p.fallMaxMs),
        delay: Phaser.Math.Between(0, p.spawnSpreadMs),
        ease: 'Sine.easeIn',
        onComplete: () => piece.destroy(),
      });
    }
  }

  /** Tarjeta (icono + nombre + descripción) del enemigo nuevo; se rehace solo al cambiar de enemigo. */
  private updateEnemyIntro(intro: HudState['enemyIntro']): void {
    const e = UI.enemyIntro;
    if (!intro) {
      this.enemyIntroCard?.destroy();
      this.enemyIntroCard = null;
      this.enemyIntroId = null;
      return;
    }
    if (intro.id !== this.enemyIntroId) {
      this.enemyIntroCard?.destroy();
      this.enemyIntroCard = this.buildEnemyIntroCard(intro.id);
      this.enemyIntroId = intro.id;
    }
    const shown = e.seconds - intro.remaining;
    this.enemyIntroCard!.setAlpha(Math.min(1, shown / e.fadeSeconds, intro.remaining / e.fadeSeconds));
  }

  private buildEnemyIntroCard(id: EnemyId): Phaser.GameObjects.Container {
    const e = UI.enemyIntro;
    const h = UI.hud;
    const info = TEXTS.enemies[id];
    const icon = createVisual(this, id, 0, 0);
    const name = this.add
      .text(0, 0, info.name, {
        fontFamily: UI.fontFamily,
        fontSize: `${e.nameSize}px`,
        fontStyle: 'bold',
        color: e.nameColor,
        stroke: h.textStroke,
        strokeThickness: h.textStrokeThickness,
      })
      .setOrigin(0, 1);
    const desc = this.add
      .text(0, 0, info.desc, { fontFamily: UI.fontFamily, fontSize: `${e.descSize}px`, color: e.descColor })
      .setOrigin(0, 0);
    const textW = Math.max(name.width, desc.width);
    const contentH = Math.max(icon.displayHeight, name.height + e.lineGap + desc.height);
    const width = e.padX * 2 + icon.displayWidth + e.iconGap + textW;
    const height = e.padY * 2 + contentH;
    const left = -width / 2;
    icon.setPosition(left + e.padX + icon.displayWidth / 2, 0);
    const textX = left + e.padX + icon.displayWidth + e.iconGap;
    const textTop = -(name.height + e.lineGap + desc.height) / 2;
    name.setPosition(textX, textTop + name.height);
    desc.setPosition(textX, textTop + name.height + e.lineGap);
    const bg = this.add
      .graphics()
      .fillStyle(e.bg, e.bgAlpha)
      .fillRoundedRect(left, -height / 2, width, height, e.radius)
      .lineStyle(e.strokeWidth, e.stroke, 1)
      .strokeRoundedRect(left, -height / 2, width, height, e.radius);
    return this.add.container(this.scale.width / 2, this.scale.height - e.marginBottom, [bg, icon, name, desc]);
  }

  private updateBossBar(boss: HudState['boss']): void {
    this.bossBar.clear();
    if (!boss) return;
    const b = UI.boss;
    const x = (this.scale.width - b.barWidth) / 2;
    const ratio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
    this.bossBar
      .fillStyle(b.barBg, b.barBgAlpha)
      .fillRect(x, b.barY, b.barWidth, b.barHeight)
      .fillStyle(b.barFg, 1)
      .fillRect(x, b.barY, b.barWidth * ratio, b.barHeight)
      .lineStyle(b.barStrokeWidth, b.barStroke, 1)
      .strokeRect(x, b.barY, b.barWidth, b.barHeight);
  }

  private updateAnnouncement(announcement: HudState['announcement']): void {
    if (!announcement) {
      this.announcementText.setVisible(false);
      return;
    }
    const a = UI.announcement;
    const color = announcement.kind === 'warning' ? a.warningColor : a.infoColor;
    this.announcementText.setText(announcement.text).setColor(color).setVisible(true);
  }

  private updatePromiseBanner(status: HudState['promise']): void {
    // Si se cumple basta con el aviso central "¡Promesa cumplida!".
    if (!status || status.phase === 'fulfilled') {
      this.promiseBanner.setVisible(false);
      return;
    }
    const p = UI.promise;
    const seconds = Math.ceil(status.remaining);
    const promise = PROMISES[status.id];
    let text: string;
    let color: string;
    if (status.phase === 'buff') {
      const t = TEXTS.promise;
      text = [
        t.title(TEXTS.promises[status.id]),
        t.buffLine(t.effect(promise.buff), t.effect(promise.debuff)),
        t.question(seconds),
      ].join('\n');
      color = p.buffColor;
    } else {
      text = `${TEXTS.promise.brokenTitle(TEXTS.promises[status.id])}\n${TEXTS.promise.brokenDetail(TEXTS.promise.effect(promise.debuff), seconds)}`;
      color = p.brokenColor;
    }
    this.promiseBanner.setText(text).setColor(color).setVisible(true);
  }

  /** Flecha en el borde de la pantalla apuntando al objetivo (urna o élite) si está fuera de vista. */
  private drawArrow(target: { x: number; y: number }): void {
    const { width, height } = this.scale;
    const onScreen = target.x >= 0 && target.x <= width && target.y >= 0 && target.y <= height;
    if (onScreen) return;
    const p = UI.promise;
    const cx = width / 2;
    const cy = height / 2;
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
    const key = inventory.map((i) => `${i.icon}:${i.level}:${i.evolved}`).join('|');
    if (key === this.inventoryKey) return;
    this.inventoryKey = key;
    for (const o of this.inventoryObjects) o.destroy();
    this.inventoryObjects = [];
    const c = UI.hudIcons;
    const h = UI.hud;
    const y = this.scale.height - c.marginBottom;
    inventory.forEach((item, i) => {
      const x = c.marginX + c.spacing / 2 + i * c.spacing;
      this.inventoryObjects.push(createVisual(this, item.icon, x, y));
      // Las armas evolucionadas ya no tienen nivel: llevan una estrella.
      if (item.evolved) {
        this.inventoryObjects.push(createVisual(this, 'icon_evolved', x + c.levelOffsetX, y + c.levelOffsetY));
        return;
      }
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
