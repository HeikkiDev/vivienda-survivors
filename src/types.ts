export type EntityVisual =
  | { kind: 'emoji'; char: string; size: number }
  | {
      kind: 'sprite';
      key: string;
      path: string;
      frameWidth?: number;
      frameHeight?: number;
      scale: number;
      anim?: { frames: number[]; frameRate: number; repeat: number };
    };

export type BackgroundVisual =
  | { kind: 'grid'; colors: { bg: string; line: string }; cell: number }
  | { kind: 'image' | 'tileSprite'; key: string; path: string };

export type EmojiVisual = Extract<EntityVisual, { kind: 'emoji' }>;

export type WeaponId = 'curriculum' | 'escudo' | 'grito' | 'sindicato';
export type PassiveId = 'aval' | 'piso' | 'bono' | 'trabajo';
export type EnemyId = 'ipc' | 'casero' | 'agencia' | 'fondo';

export type IconId = `icon_${WeaponId | PassiveId}`;

export type EntityVisualId =
  | 'player'
  | EnemyId
  | 'boss'
  | 'bossBullet'
  | 'euro'
  | 'promesa'
  | WeaponId
  | IconId;

export type VisualId = 'background' | EntityVisualId;

export type VisualsTable = { background: BackgroundVisual } & Record<EntityVisualId, EntityVisual>;
