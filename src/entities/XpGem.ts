import Phaser from 'phaser';
import { DEPTH, EURO } from '../config';
import { createVisual } from '../visuals';

/** Euro (XP) en el suelo. */
export class XpGem extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  value = 0;
  attracted = false;

  constructor(scene: Phaser.Scene) {
    const diameter = EURO.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, 'euro', 0, 0).setDepth(DEPTH.euros).setVisible(false);
    this.setActive(false);
  }

  initBody(): void {
    this.body.setCircle(EURO.hitboxRadius);
    this.body.enable = false;
  }

  drop(x: number, y: number, value: number): void {
    this.value = value;
    this.attracted = false;
    this.setActive(true);
    this.body.enable = true;
    this.body.reset(x, y);
    this.visual.setVisible(true).setPosition(x, y);
  }

  deactivate(): void {
    this.setActive(false);
    this.body.stop();
    this.body.enable = false;
    this.visual.setVisible(false);
  }

  syncVisual(): void {
    this.visual.setPosition(this.x, this.y);
  }
}

/** Pool de euros: imán, atracción y recogida. */
export class XpGemPool {
  readonly group: Phaser.Physics.Arcade.Group;
  private alive = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.group = scene.physics.add.group({ maxSize: EURO.maxOnGround });
  }

  /** Suelta un euro; si ya hay demasiados, suma el valor al más cercano. */
  drop(x: number, y: number, value: number): void {
    if (this.alive >= EURO.maxOnGround) {
      const nearest = this.nearest(x, y);
      if (nearest) nearest.value += value;
      return;
    }
    let gem = this.group.getFirstDead(false) as XpGem | null;
    if (!gem) {
      gem = new XpGem(this.scene);
      this.group.add(gem);
      gem.initBody();
    }
    gem.drop(x, y, value);
    this.alive++;
  }

  /**
   * Atrae los euros dentro del radio de imán y recoge los que tocan al jugador.
   * Devuelve la XP recogida en este frame.
   */
  update(px: number, py: number, magnetRadius: number, attractSpeed: number, collectRadius: number): number {
    const magnetSq = magnetRadius * magnetRadius;
    const collectSq = collectRadius * collectRadius;
    let collected = 0;
    const children = this.group.getChildren() as XpGem[];
    for (const gem of children) {
      if (!gem.active) continue;
      const dx = px - gem.x;
      const dy = py - gem.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= collectSq) {
        collected += gem.value;
        gem.deactivate();
        this.alive--;
        continue;
      }
      if (!gem.attracted && distSq <= magnetSq) gem.attracted = true;
      if (gem.attracted) {
        const k = attractSpeed / Math.sqrt(distSq);
        gem.body.setVelocity(dx * k, dy * k);
      }
    }
    return collected;
  }

  syncVisuals(): void {
    const children = this.group.getChildren() as XpGem[];
    for (const gem of children) if (gem.active) gem.syncVisual();
  }

  private nearest(x: number, y: number): XpGem | null {
    let best: XpGem | null = null;
    let bestSq = Infinity;
    const children = this.group.getChildren() as XpGem[];
    for (const gem of children) {
      if (!gem.active) continue;
      const d = (gem.x - x) ** 2 + (gem.y - y) ** 2;
      if (d < bestSq) {
        bestSq = d;
        best = gem;
      }
    }
    return best;
  }
}
