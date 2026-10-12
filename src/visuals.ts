// TODAS las definiciones visuales del juego (sección 3.1 del GDD).
// Cambiar el arte = editar solo este archivo + añadir archivos en public/assets/.
import Phaser from 'phaser';
import type {
  BackgroundVisual,
  EmojiVisual,
  EntityVisual,
  EntityVisualId,
  VisualsTable,
} from './types';

const EMOJI_FONT_FAMILY =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif';
// Margen extra para que los emoji no se recorten en algunos navegadores.
const EMOJI_PADDING_RATIO = 0.25;
const GRID_LINE_WIDTH = 1;
const FLASH_TINT = 0xffffff;
const FLASH_ALPHA = 0.3;

/** Emoji por defecto de cada entidad. También se usa como fallback si un asset no carga. */
export const FALLBACK_EMOJI: Record<EntityVisualId, EmojiVisual> = {
  player: { kind: 'emoji', char: '🧑', size: 32 },
  ipc: { kind: 'emoji', char: '📈', size: 24 },
  casero: { kind: 'emoji', char: '🤑', size: 28 },
  agencia: { kind: 'emoji', char: '🏢', size: 30 },
  fondo: { kind: 'emoji', char: '🦅', size: 40 },
  boss: { kind: 'emoji', char: '🫧', size: 96 },
  bossBullet: { kind: 'emoji', char: '💸', size: 20 },
  euro: { kind: 'emoji', char: '💶', size: 14 },
  promesa: { kind: 'emoji', char: '🗳️', size: 32 },
  curriculum: { kind: 'emoji', char: '📄', size: 20 },
  escudo: { kind: 'emoji', char: '🛡️', size: 24 },
  grito: { kind: 'emoji', char: '📢', size: 24 },
  sindicato: { kind: 'emoji', char: '✊', size: 24 },
  icon_curriculum: { kind: 'emoji', char: '📄', size: 24 },
  icon_escudo: { kind: 'emoji', char: '🛡️', size: 24 },
  icon_grito: { kind: 'emoji', char: '📢', size: 24 },
  icon_sindicato: { kind: 'emoji', char: '✊', size: 24 },
  icon_aval: { kind: 'emoji', char: '👴', size: 24 },
  icon_piso: { kind: 'emoji', char: '🛏️', size: 24 },
  icon_bono: { kind: 'emoji', char: '🎫', size: 24 },
  icon_trabajo: { kind: 'emoji', char: '💼', size: 24 },
  icon_cana: { kind: 'emoji', char: '🍺', size: 24 },
};

export const FALLBACK_BACKGROUND: BackgroundVisual = {
  kind: 'grid',
  colors: { bg: '#2b2b2b', line: '#3a3a3a' },
  cell: 100,
};

/** Definición activa de cada visual. Sustituye una entrada por un `sprite`/`image` para cambiar el arte. */
export const VISUALS: VisualsTable = {
  background: FALLBACK_BACKGROUND,
  ...FALLBACK_EMOJI,
};

const warned = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function createEmoji(scene: Phaser.Scene, def: EmojiVisual, x: number, y: number): Phaser.GameObjects.Text {
  const pad = Math.ceil(def.size * EMOJI_PADDING_RATIO);
  return scene.add
    .text(x, y, def.char, {
      fontFamily: EMOJI_FONT_FAMILY,
      fontSize: `${def.size}px`,
      padding: { x: pad, y: pad },
    })
    .setOrigin(0.5);
}

function createSprite(
  scene: Phaser.Scene,
  def: Extract<EntityVisual, { kind: 'sprite' }>,
  x: number,
  y: number,
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(x, y, def.key).setOrigin(0.5).setScale(def.scale);
  if (def.anim) {
    const animKey = `${def.key}_anim`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(def.key, { frames: def.anim.frames }),
        frameRate: def.anim.frameRate,
        repeat: def.anim.repeat,
      });
    }
    sprite.play(animKey);
  }
  return sprite;
}

/** Única fábrica de visuales de entidades. */
export function createVisual(
  scene: Phaser.Scene,
  id: EntityVisualId,
  x: number,
  y: number,
): Phaser.GameObjects.Text | Phaser.GameObjects.Sprite {
  const def = VISUALS[id];
  if (def.kind === 'sprite') {
    if (scene.textures.exists(def.key)) return createSprite(scene, def, x, y);
    warnOnce(id, `[visuals] Textura "${def.key}" (${def.path}) no disponible para "${id}". Usando emoji de fallback.`);
    return createEmoji(scene, FALLBACK_EMOJI[id], x, y);
  }
  return createEmoji(scene, def, x, y);
}

function createGrid(
  scene: Phaser.Scene,
  def: Extract<BackgroundVisual, { kind: 'grid' }>,
  worldW: number,
  worldH: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(Phaser.Display.Color.HexStringToColor(def.colors.bg).color, 1);
  g.fillRect(0, 0, worldW, worldH);
  g.lineStyle(GRID_LINE_WIDTH, Phaser.Display.Color.HexStringToColor(def.colors.line).color, 1);
  for (let x = 0; x <= worldW; x += def.cell) g.lineBetween(x, 0, x, worldH);
  for (let y = 0; y <= worldH; y += def.cell) g.lineBetween(0, y, worldW, y);
  return g;
}

/** Única fábrica del fondo/mapa. */
export function createBackground(
  scene: Phaser.Scene,
  worldW: number,
  worldH: number,
): Phaser.GameObjects.Graphics | Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite {
  const def = VISUALS.background;
  if (def.kind === 'grid') return createGrid(scene, def, worldW, worldH);
  if (!scene.textures.exists(def.key)) {
    warnOnce('background', `[visuals] Textura de fondo "${def.key}" (${def.path}) no disponible. Usando rejilla de fallback.`);
    if (FALLBACK_BACKGROUND.kind === 'grid') return createGrid(scene, FALLBACK_BACKGROUND, worldW, worldH);
  }
  if (def.kind === 'image') return scene.add.image(0, 0, def.key).setOrigin(0).setDisplaySize(worldW, worldH);
  return scene.add.tileSprite(0, 0, worldW, worldH, def.key).setOrigin(0);
}

/** Destello de daño: tint en sprites, alpha en emoji. */
export function flashVisual(
  scene: Phaser.Scene,
  visual: Phaser.GameObjects.Text | Phaser.GameObjects.Sprite,
  durationMs: number,
): void {
  if (visual instanceof Phaser.GameObjects.Sprite) {
    visual.setTintFill(FLASH_TINT);
    scene.time.delayedCall(durationMs, () => visual.active && visual.clearTint());
  } else {
    visual.setAlpha(FLASH_ALPHA);
    scene.time.delayedCall(durationMs, () => visual.active && visual.setAlpha(1));
  }
}

/** Entradas que necesitan cargar archivos (usado por BootScene). */
export function getVisualAssets(): Array<
  { key: string; path: string; frameWidth?: number; frameHeight?: number }
> {
  const assets: Array<{ key: string; path: string; frameWidth?: number; frameHeight?: number }> = [];
  for (const def of Object.values(VISUALS) as Array<EntityVisual | BackgroundVisual>) {
    if (def.kind === 'sprite') {
      assets.push({ key: def.key, path: def.path, frameWidth: def.frameWidth, frameHeight: def.frameHeight });
    } else if (def.kind === 'image' || def.kind === 'tileSprite') {
      assets.push({ key: def.key, path: def.path });
    }
  }
  return assets;
}
