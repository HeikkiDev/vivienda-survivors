import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, JOYSTICK } from '../config';

type MoveKeys = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

/** Teclado (WASD + flechas) y joystick virtual táctil. Devuelve una dirección de longitud ≤ 1. */
export class InputSystem {
  private readonly keys?: MoveKeys;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly direction = new Phaser.Math.Vector2();
  private pointerId: number | null = null;
  private readonly origin = new Phaser.Math.Vector2();
  private readonly knob = new Phaser.Math.Vector2();

  constructor(private readonly scene: Phaser.Scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard?.addKeys({
      up: K.UP,
      down: K.DOWN,
      left: K.LEFT,
      right: K.RIGHT,
      w: K.W,
      a: K.A,
      s: K.S,
      d: K.D,
    }) as MoveKeys | undefined;

    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.joystick).setVisible(false);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.events.on(Phaser.Scenes.Events.RESUME, this.reset, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Dirección de movimiento normalizada (la diagonal nunca supera 1). */
  getDirection(): Phaser.Math.Vector2 {
    if (this.pointerId !== null) {
      this.direction.set(this.knob.x - this.origin.x, this.knob.y - this.origin.y).scale(1 / JOYSTICK.radius);
      if (this.direction.lengthSq() > 1) this.direction.normalize();
      return this.direction;
    }
    const k = this.keys;
    let x = 0;
    let y = 0;
    if (k) {
      if (k.left.isDown || k.a.isDown) x -= 1;
      if (k.right.isDown || k.d.isDown) x += 1;
      if (k.up.isDown || k.w.isDown) y -= 1;
      if (k.down.isDown || k.s.isDown) y += 1;
    }
    return this.direction.set(x, y).normalize();
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return;
    if (pointer.y < GAME_HEIGHT * JOYSTICK.activationYRatio) return;
    this.pointerId = pointer.id;
    this.origin.set(pointer.x, pointer.y);
    this.knob.set(pointer.x, pointer.y);
    this.draw();
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.origin.x;
    const dy = pointer.y - this.origin.y;
    const len = Math.hypot(dx, dy);
    const k = len > JOYSTICK.radius ? JOYSTICK.radius / len : 1;
    this.knob.set(this.origin.x + dx * k, this.origin.y + dy * k);
    this.draw();
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.graphics.clear().setVisible(false);
  }

  private draw(): void {
    const g = this.graphics.clear().setVisible(true);
    g.fillStyle(JOYSTICK.baseColor, JOYSTICK.baseAlpha);
    g.fillCircle(this.origin.x, this.origin.y, JOYSTICK.radius);
    g.lineStyle(JOYSTICK.baseLineWidth, JOYSTICK.baseColor, JOYSTICK.baseLineAlpha);
    g.strokeCircle(this.origin.x, this.origin.y, JOYSTICK.radius);
    g.fillStyle(JOYSTICK.knobColor, JOYSTICK.knobAlpha);
    g.fillCircle(this.knob.x, this.knob.y, JOYSTICK.knobRadius);
  }

  /** Tras una pausa, suelta el joystick y las teclas (los "up" se pierden mientras está pausada). */
  private reset(): void {
    this.pointerId = null;
    this.graphics.clear().setVisible(false);
    this.scene.input.keyboard?.resetKeys();
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.reset, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
  }
}
