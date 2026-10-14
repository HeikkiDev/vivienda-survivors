import Phaser from 'phaser';
import { getSoundAssets } from '../sounds';
import { AudioManager } from '../systems/AudioManager';
import { getVisualAssets } from '../visuals';

function failMessage(file: Phaser.Loader.File, what: string): string {
  const fallback = file.type === 'audio' ? 'Se jugará sin ese sonido.' : 'Se usará el fallback.';
  return `[${file.type === 'audio' ? 'audio' : 'visuals'}] No se pudo ${what} "${file.key}" (${String(file.url)}). ${fallback}`;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.ADD, (_key: string, _type: string, _loader: unknown, file: Phaser.Loader.File) => {
      // Phaser registra un console.error si el archivo no se puede decodificar; el GDD pide solo console.warn.
      file.onProcessError = () => {
        console.warn(failMessage(file, 'procesar'));
        file.state = Phaser.Loader.FILE_ERRORED;
        file.multiFile?.onFileFailed(file);
        file.loader.fileProcessComplete(file);
      };
      // Phaser decodifica el audio con console.error y deja una promesa rechazada sin capturar.
      const context = (file.config as { context?: AudioContext } | undefined)?.context;
      if (file.type === 'audio' && context) {
        file.onProcess = () => {
          file.state = Phaser.Loader.FILE_PROCESSING;
          context
            .decodeAudioData(file.xhrLoader!.response as ArrayBuffer)
            .then((buffer) => {
              file.data = buffer;
              file.onProcessComplete();
            })
            .catch(() => file.onProcessError());
        };
      }
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(failMessage(file, 'cargar'));
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

    for (const sound of getSoundAssets()) this.load.audio(sound.key, sound.path);
  }

  create(): void {
    AudioManager.init(this.game);
    this.scene.start('MenuScene');
  }
}
