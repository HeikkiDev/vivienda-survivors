import Phaser from 'phaser';
import { MISSILE, SECONDS_PER_MINUTE } from '../config';
import { Missile } from '../entities/Missile';

export type ScreenEdge = 'left' | 'right' | 'top' | 'bottom';
const EDGES: readonly ScreenEdge[] = ['left', 'right', 'top', 'bottom'];

/** Misil avisado que aún no ha salido: borde de entrada y posición a lo largo de él (fracción 0–1). */
export interface MissileWarning {
  edge: ScreenEdge;
  along: number;
  remaining: number;
}

/** Tandas del Euríbor disparado (pool de Arcade): aviso "!" en el borde y, `warningSeconds` después, lanzamiento. */
export class Missiles {
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly pending: MissileWarning[] = [];
  private nextWaveAt: number;

  /** Con `debug` (`?missile=1`) la primera tanda sale a los `debugStartSeconds` de empezar. */
  constructor(private readonly scene: Phaser.Scene, startElapsed: number, debug: boolean) {
    this.group = scene.physics.add.group({ maxSize: MISSILE.poolSize });
    const start = MISSILE.startMinute * SECONDS_PER_MINUTE;
    if (debug) this.nextWaveAt = startElapsed + MISSILE.debugStartSeconds;
    else this.nextWaveAt = startElapsed <= start ? start : startElapsed + Missiles.intervalAt(startElapsed);
  }

  get warnings(): readonly MissileWarning[] {
    return this.pending;
  }

  /** 0 en `startMinute`, 1 en `intervalEndMinute` (lineal, recortado). */
  private static progress(elapsed: number): number {
    const m = MISSILE;
    return Phaser.Math.Clamp((elapsed / SECONDS_PER_MINUTE - m.startMinute) / (m.intervalEndMinute - m.startMinute), 0, 1);
  }

  static intervalAt(elapsed: number): number {
    return Phaser.Math.Linear(MISSILE.intervalStart, MISSILE.intervalEnd, Missiles.progress(elapsed));
  }

  static countAt(elapsed: number, evolutions: number): number {
    const base = Math.round(Phaser.Math.Linear(MISSILE.countStart, MISSILE.countEnd, Missiles.progress(elapsed)));
    return base + MISSILE.countPerEvolution * evolutions;
  }

  update(dt: number, elapsed: number, evolutions: number, view: Phaser.Geom.Rectangle, px: number, py: number): void {
    while (elapsed >= this.nextWaveAt) {
      const count = Missiles.countAt(this.nextWaveAt, evolutions);
      for (let i = 0; i < count; i++) {
        this.pending.push({
          edge: Phaser.Utils.Array.GetRandom(EDGES as ScreenEdge[]),
          along: Phaser.Math.FloatBetween(MISSILE.edgeMinFraction, MISSILE.edgeMaxFraction),
          remaining: MISSILE.warningSeconds,
        });
      }
      this.nextWaveAt += Missiles.intervalAt(this.nextWaveAt);
    }
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const w = this.pending[i];
      w.remaining -= dt;
      if (w.remaining > 0) continue;
      this.pending.splice(i, 1);
      this.launch(w, view, px, py);
    }
    this.despawnLeaving(view);
  }

  /** Sale justo fuera del borde avisado hacia la posición actual del jugador. */
  private launch(w: MissileWarning, view: Phaser.Geom.Rectangle, px: number, py: number): void {
    let m = this.group.getFirstDead(false) as Missile | null;
    if (!m) {
      if (this.group.isFull()) return;
      m = new Missile(this.scene);
      this.group.add(m);
      m.initBody();
    }
    const margin = MISSILE.spawnMargin;
    let x = view.x + w.along * view.width;
    let y = view.y + w.along * view.height;
    if (w.edge === 'left') x = view.x - margin;
    else if (w.edge === 'right') x = view.right + margin;
    else if (w.edge === 'top') y = view.y - margin;
    else y = view.bottom + margin;
    m.fire(x, y, Math.atan2(py - y, px - x));
  }

  /** Desaparece al salir de la vista alejándose de ella (por el lado contrario al de entrada). */
  private despawnLeaving(view: Phaser.Geom.Rectangle): void {
    const margin = MISSILE.despawnMargin;
    for (const m of this.group.getChildren() as Missile[]) {
      if (!m.active) continue;
      const outside =
        m.x < view.x - margin || m.x > view.right + margin || m.y < view.y - margin || m.y > view.bottom + margin;
      if (!outside) continue;
      const leaving = (m.x - view.centerX) * m.body.velocity.x + (m.y - view.centerY) * m.body.velocity.y > 0;
      if (leaving) m.deactivate();
    }
  }

  /** Quita los misiles en vuelo y los avisos pendientes (fin de partida). */
  clear(): void {
    this.pending.length = 0;
    for (const m of this.group.getChildren() as Missile[]) if (m.active) m.deactivate();
  }

  syncVisuals(): void {
    for (const m of this.group.getChildren() as Missile[]) if (m.active) m.visual.setPosition(m.x, m.y);
  }
}
