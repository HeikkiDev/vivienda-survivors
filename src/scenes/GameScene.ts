import Phaser from 'phaser';
import { CAMERA_LERP, DEPTH, WORLD_HEIGHT, WORLD_WIDTH } from '../config';
import { Player } from '../entities/Player';
import { InputSystem } from '../systems/Input';
import { createBackground } from '../visuals';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    createBackground(this, WORLD_WIDTH, WORLD_HEIGHT).setDepth(DEPTH.background);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.inputSystem = new InputSystem(this);

    // POST_UPDATE se emite después de que Arcade aplique las posiciones del paso de física.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.lateUpdate, this);
    });
  }

  update(): void {
    this.player.move(this.inputSystem.getDirection());
  }

  private lateUpdate(): void {
    this.player.syncVisual();
  }
}
