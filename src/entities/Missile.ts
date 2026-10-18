import Phaser from 'phaser';
import { DEPTH, MISSILE } from '../config';
import { createVisual, setVisualHeading } from '../visuals';

/** Euríbor disparado: cruza la pantalla en línea recta. No es un enemigo (las armas no lo ven): solo se esquiva. */
export class Missile extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  readonly visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite;
  /** Ya ha tocado al jugador (un solo golpe por misil). */
  spent = false;

  constructor(scene: Phaser.Scene) {
    const diameter = MISSILE.hitboxRadius * 2;
    super(scene, 0, 0, diameter, diameter);
    scene.add.existing(this);
    this.visual = createVisual(scene, 'missile', 0, 0).setDepth(DEPTH.missiles).setVisible(false);
    this.setActive(false);
  }

  initBody(): void {
    this.body.setCircle(MISSILE.hitboxRadius);
    this.body.enable = false;
  }

  fire(x: number, y: number, angle: number): void {
    this.spent = false;
    this.setActive(true);
    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setVelocity(Math.cos(angle) * MISSILE.speed, Math.sin(angle) * MISSILE.speed);
    setVisualHeading(this.visual, 'missile', angle);
    this.visual.setVisible(true).setPosition(x, y);
  }

  deactivate(): void {
    this.setActive(false);
    this.body.stop();
    this.body.enable = false;
    this.visual.setVisible(false);
  }
}
