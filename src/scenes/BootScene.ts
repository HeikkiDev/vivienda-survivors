import Phaser from 'phaser';
import { getVisualAssets } from '../visuals';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.ADD, (_key: string, _type: string, _loader: unknown, file: Phaser.Loader.File) => {
      // Phaser registra un console.error si el archivo no se puede decodificar; el GDD pide solo console.warn.
      file.onProcessError = () => {
        console.warn(`[visuals] No se pudo procesar "${file.key}" (${String(file.url)}). Se usará el fallback.`);
        file.state = Phaser.Loader.FILE_ERRORED;
        file.multiFile?.onFileFailed(file);
        file.loader.fileProcessComplete(file);
      };
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[visuals] No se pudo cargar "${file.key}" (${String(file.url)}). Se usará el fallback.`);
    });

    for (const asset of getVisualAssets()) {
      if (asset.frameWidth) {
        this.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight ?? asset.frameWidth,
        });
      } else {
        this.load.image(asset.key, asset.path);
      }
    }
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
