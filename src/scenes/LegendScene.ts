import Phaser from 'phaser';
import { EVOLUTION_IDS, EVOLUTIONS, MAX_UPGRADE_LEVEL, PASSIVE_IDS, UI, WEAPON_IDS } from '../config';
import { TEXTS } from '../texts';
import type { EvolutionId, IconId } from '../types';
import { addBaseOverlay, centerOnBaseArea } from '../utils/layout';
import { createVisual } from '../visuals';
import type { UIScene } from './UIScene';

type LegendTab = 'weapons' | 'passives' | 'evolutions';
const TABS: readonly LegendTab[] = ['weapons', 'passives', 'evolutions'];

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

/**
 * Leyenda "?" con pestañas (armas, pasivas, evoluciones). GameScene está en pausa mientras está abierta;
 * la abre y la cierra UIScene (botón "?", H, Esc/P). Se cierra también con su botón o tocando fuera del panel.
 */
export class LegendScene extends Phaser.Scene {
  private tab: LegendTab = 'weapons';
  private tabButtons: Array<{ id: LegendTab; button: Phaser.GameObjects.Text }> = [];
  private content!: Phaser.GameObjects.Container;
  private scrollbar!: Phaser.GameObjects.Graphics;
  private contentHeight = 0;
  private scroll = 0;
  private dragStartY: number | null = null;
  private dragStartScroll = 0;
  private dragged = false;
  /** Los `pointerup` solo cuentan tras un `pointerdown` en esta escena (no el del toque que la abrió). */
  private armed = false;

  constructor() {
    super('LegendScene');
  }

  create(): void {
    const L = UI.legend;
    this.tab = 'weapons';
    this.tabButtons = [];
    this.scroll = 0;
    this.dragStartY = null;
    this.dragged = false;
    this.armed = false;

    centerOnBaseArea(this);
    const overlay = addBaseOverlay(this, L.overlayColor, L.overlayAlpha).setInteractive();
    overlay.on('pointerdown', () => this.close());

    const cx = L.panelX + L.panelWidth / 2;
    this.add
      .rectangle(cx, L.panelY + L.panelHeight / 2, L.panelWidth, L.panelHeight)
      .setInteractive();
    this.add
      .graphics()
      .fillStyle(L.panelColor, L.panelAlpha)
      .fillRoundedRect(L.panelX, L.panelY, L.panelWidth, L.panelHeight, L.panelRadius)
      .lineStyle(L.panelStrokeWidth, L.panelStroke, 1)
      .strokeRoundedRect(L.panelX, L.panelY, L.panelWidth, L.panelHeight, L.panelRadius);

    this.add
      .text(cx, L.titleY, TEXTS.legend.title, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.titleSize}px`,
        fontStyle: 'bold',
        color: L.titleColor,
      })
      .setOrigin(0.5);
    this.createCloseButton();
    this.createTabs(cx);

    this.content = this.add.container(0, L.contentTop);
    const maskShape = this.make.graphics({}, false).fillRect(L.panelX, L.contentTop, L.panelWidth, this.viewHeight);
    this.content.setMask(maskShape.createGeometryMask());
    this.scrollbar = this.add.graphics();
    this.buildContent();

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, () => {
      this.dragStartY = null;
    });
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.setScroll(this.scroll + dy * L.wheelFactor);
    });
    this.input.keyboard?.on('keydown-LEFT', () => this.switchTab(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.switchTab(1));
  }

  private get viewHeight(): number {
    const L = UI.legend;
    return L.panelY + L.panelHeight - L.contentBottomMargin - L.contentTop;
  }

  private close(): void {
    (this.scene.get('UIScene') as UIScene).closeLegend();
  }

  private createCloseButton(): void {
    const L = UI.legend;
    const button = this.add
      .text(L.panelX + L.panelWidth - L.closeMarginX, L.titleY, TEXTS.legend.close, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.closeSize}px`,
        fontStyle: 'bold',
        color: L.closeColor,
        backgroundColor: L.closeBg,
        padding: { x: L.closePadX, y: L.closePadY },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor(L.closeBgHover));
    button.on('pointerout', () => button.setBackgroundColor(L.closeBg));
    button.on('pointerup', () => {
      if (this.armed) this.close();
    });
  }

  private createTabs(cx: number): void {
    const L = UI.legend;
    const buttons = TABS.map((id) => {
      const button = this.add
        .text(0, L.tabsY, TEXTS.legend.tabs[id], {
          fontFamily: UI.fontFamily,
          fontSize: `${L.tabSize}px`,
          fontStyle: 'bold',
          padding: { x: L.tabPadX, y: L.tabPadY },
        })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      button.on('pointerover', () => id !== this.tab && button.setBackgroundColor(L.tabBgHover));
      button.on('pointerout', () => this.refreshTabs());
      button.on('pointerup', () => {
        if (this.armed) this.selectTab(id);
      });
      return { id, button };
    });
    const total = buttons.reduce((w, b) => w + b.button.width, 0) + L.tabGap * (buttons.length - 1);
    let x = cx - total / 2;
    for (const { button } of buttons) {
      button.setX(x);
      x += button.width + L.tabGap;
    }
    this.tabButtons = buttons;
    this.refreshTabs();
  }

  private refreshTabs(): void {
    const L = UI.legend;
    for (const { id, button } of this.tabButtons) {
      const active = id === this.tab;
      button.setColor(active ? L.tabActiveColor : L.tabColor).setBackgroundColor(active ? L.tabActiveBg : L.tabBg);
    }
  }

  private switchTab(step: number): void {
    const i = TABS.indexOf(this.tab);
    this.selectTab(TABS[(i + step + TABS.length) % TABS.length]);
  }

  private selectTab(id: LegendTab): void {
    if (id === this.tab) return;
    this.tab = id;
    this.refreshTabs();
    this.buildContent();
  }

  private buildContent(): void {
    this.content.removeAll(true);
    let y = 0;
    if (this.tab === 'weapons') {
      for (const id of WEAPON_IDS) y = this.addSimpleRow(y, `icon_${id}`, TEXTS.weapons[id]);
    } else if (this.tab === 'passives') {
      for (const id of PASSIVE_IDS) y = this.addSimpleRow(y, `icon_${id}`, TEXTS.passives[id]);
    } else {
      for (const id of EVOLUTION_IDS) y = this.addEvolutionRow(y, id);
    }
    this.contentHeight = Math.max(0, y - UI.legend.rowGap);
    this.setScroll(0);
  }

  private textStyles(textWidth: number): { name: TextStyle; recipe: TextStyle; effect: TextStyle } {
    const L = UI.legend;
    const base: TextStyle = { fontFamily: UI.fontFamily, wordWrap: { width: textWidth } };
    return {
      name: { ...base, fontSize: `${L.nameSize}px`, fontStyle: 'bold', color: L.nameColor },
      recipe: { ...base, fontSize: `${L.recipeTextSize}px`, color: L.recipeTextColor },
      effect: { ...base, fontSize: `${L.effectSize}px`, color: L.effectColor },
    };
  }

  /** Fila con icono a la izquierda y, a la derecha, nombre + (receta) + efecto. Devuelve la y de la siguiente fila. */
  private addRow(
    y: number,
    leftWidth: number,
    leftHeight: number,
    texts: { name: string; recipe?: string; effect: string },
    evolution: boolean,
  ): { rowTop: number; rowHeight: number; next: number } {
    const L = UI.legend;
    const rowLeft = L.panelX + L.contentPadX;
    const rowWidth = L.panelWidth - L.contentPadX * 2;
    const textX = rowLeft + leftWidth + L.textGap;
    const styles = this.textStyles(rowLeft + rowWidth - L.textGap - textX);
    const lines = [
      this.add.text(textX, 0, texts.name, styles.name),
      ...(texts.recipe ? [this.add.text(textX, 0, texts.recipe, styles.recipe)] : []),
      this.add.text(textX, 0, texts.effect, styles.effect),
    ];
    const textHeight = lines.reduce((h, t) => h + t.height, 0) + L.lineGap * (lines.length - 1);
    const rowHeight = Math.max(textHeight, leftHeight) + L.rowPadY * 2;
    let ty = y + (rowHeight - textHeight) / 2;
    for (const line of lines) {
      line.setY(ty);
      ty += line.height + L.lineGap;
    }
    const bg = this.add
      .graphics()
      .fillStyle(evolution ? L.rowEvolutionColor : L.rowColor, 1)
      .fillRoundedRect(rowLeft, y, rowWidth, rowHeight, L.rowRadius);
    this.content.add([bg, ...lines]);
    return { rowTop: y, rowHeight, next: y + rowHeight + L.rowGap };
  }

  private addSimpleRow(y: number, iconId: IconId, texts: { name: string; effect: string }): number {
    const L = UI.legend;
    const icon = createVisual(this, iconId, 0, 0);
    icon.setScale(icon.scaleX * L.iconScale);
    const row = this.addRow(y, L.iconX * 2, icon.displayHeight, texts, false);
    icon.setPosition(L.panelX + L.contentPadX + L.iconX, row.rowTop + row.rowHeight / 2);
    this.content.add(icon);
    return row.next;
  }

  /** Receta: icono del arma con "Nv 5" + icono de la pasiva → icono de la evolución. */
  private addEvolutionRow(y: number, id: EvolutionId): number {
    const L = UI.legend;
    const evo = EVOLUTIONS[id];
    const level = TEXTS.hud.level(MAX_UPGRADE_LEVEL);
    const parts: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Sprite> = [];
    const icon = (iconId: IconId): Phaser.GameObjects.Text | Phaser.GameObjects.Sprite => {
      const v = createVisual(this, iconId, 0, 0);
      return v.setScale(v.scaleX * L.recipeIconScale);
    };
    const symbol = (char: string): Phaser.GameObjects.Text =>
      this.add
        .text(0, 0, char, {
          fontFamily: UI.fontFamily,
          fontSize: `${L.recipeSymbolSize}px`,
          fontStyle: 'bold',
          color: L.recipeSymbolColor,
        })
        .setOrigin(0.5);
    parts.push(
      icon(`icon_${evo.weapon}`),
      symbol(TEXTS.legend.plus),
      icon(`icon_${evo.passive}`),
      symbol(TEXTS.legend.arrow),
      icon(`icon_${id}`),
    );
    const levelLabel = this.add
      .text(0, 0, level, {
        fontFamily: UI.fontFamily,
        fontSize: `${L.recipeLevelSize}px`,
        fontStyle: 'bold',
        color: L.recipeTextColor,
      })
      .setOrigin(0.5);
    const leftHeight = parts[0].displayHeight + levelLabel.height;
    const row = this.addRow(
      y,
      L.recipeWidth,
      leftHeight,
      {
        name: TEXTS.evolutions[id].name,
        recipe: TEXTS.legend.recipe(TEXTS.weapons[evo.weapon].name, level, TEXTS.passives[evo.passive].name),
        effect: TEXTS.evolutions[id].effect,
      },
      true,
    );
    const midY = row.rowTop + row.rowHeight / 2;
    const startX = L.panelX + L.contentPadX + L.iconX;
    parts.forEach((p, i) => p.setPosition(startX + i * L.recipeStep, midY));
    levelLabel.setPosition(startX, midY + L.recipeLevelOffsetY);
    this.content.add([...parts, levelLabel]);
    return row.next;
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentHeight - this.viewHeight);
  }

  private setScroll(value: number): void {
    const L = UI.legend;
    this.scroll = Phaser.Math.Clamp(value, 0, this.maxScroll);
    this.content.setY(L.contentTop - this.scroll);
    this.scrollbar.clear();
    if (this.maxScroll <= 0) return;
    const view = this.viewHeight;
    const barH = (view * view) / this.contentHeight;
    const barY = L.contentTop + (this.scroll / this.maxScroll) * (view - barH);
    const barX = L.panelX + L.panelWidth - L.scrollbarMarginX - L.scrollbarWidth;
    this.scrollbar.fillStyle(L.scrollbarColor, L.scrollbarAlpha).fillRect(barX, barY, L.scrollbarWidth, barH);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const L = UI.legend;
    this.armed = true;
    this.dragged = false;
    const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const inContent =
      p.x >= L.panelX && p.x <= L.panelX + L.panelWidth && p.y >= L.contentTop && p.y <= L.contentTop + this.viewHeight;
    this.dragStartY = inContent ? pointer.y : null;
    this.dragStartScroll = this.scroll;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.dragStartY === null || !pointer.isDown) return;
    const dy = pointer.y - this.dragStartY;
    if (!this.dragged && Math.abs(dy) < UI.legend.dragThreshold) return;
    this.dragged = true;
    // pointer.y está en píxeles de la vista; con zoom 1 coincide con las coordenadas del juego.
    this.setScroll(this.dragStartScroll - dy);
  }
}
