export interface Vector2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  size: Size;
}

export interface Player extends Entity {
  vel: Vector2;
  isGrounded: boolean;
  jumpCount: number;
  color: string;
  facing: 1 | -1;
  attackTimer: number;
  platformId?: string;
  hp: number;
  maxHp: number;
  invulnerableUntil: number; // Timestamp
  landAnimTimer: number; // Frames for landing squash animation
}

export interface Platform extends Entity {
  type: 'floor' | 'floating';
  moving?: boolean;
  moveType?: 'horizontal' | 'vertical';
  startPos?: Vector2;
  moveOffset?: number;
  moveSpeed?: number;
}

export interface Coin extends Entity {
  collected: boolean;
}

export interface YellowCoin extends Entity {
  vel: Vector2;
  collected: boolean;
  lifetime: number; // Frames remaining
}

export interface Door extends Entity {
  locked: boolean;
}

export type EnemyType = 'vertical' | 'patroller' | 'chaser' | 'boss';

export interface Enemy extends Entity {
  type: EnemyType;
  vel: Vector2;
  isGrounded: boolean;
  color: string;
  dead: boolean;
  hp: number;
  maxHp: number;
  // Vertical specific
  startY?: number;
  offset?: number;
  // Patroller specific
  minX?: number;
  maxX?: number;
  patrolDir?: 1 | -1;
  // Chaser/Boss specific
  speed?: number;
  landAnimTimer?: number; // For boss squash
}

export interface Upgrades {
  maxHp: boolean;
  sharpSword: boolean;
  tripleJump: boolean;
  downStrike: boolean;
}

export type SkinId = 'default' | 'midnight' | 'crimson' | 'golden' | 'legend';
export type HatId = 'none' | 'tophat' | 'crown' | 'halo';

export interface CosmeticsState {
  ownedSkins: SkinId[];
  ownedHats: HatId[];
  currentSkin: SkinId;
  currentHat: HatId;
}

export interface GameState {
  level: number;
  coinsCollected: number;
  totalCoins: number;
  status: 'menu' | 'playing' | 'shop' | 'gameover' | 'transition' | 'victory' | 'paused' | 'secret_boss';
  lives: number;
  gold: number;
  upgrades: Upgrades;
  cosmetics: CosmeticsState;
  muted: boolean;
  secretUnlocked: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  attack: boolean;
}

export interface Particle {
  id: string;
  pos: Vector2;
  vel: Vector2;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface SaveData {
  gold: number;
  lives: number;
  upgrades: Upgrades;
  cosmetics: CosmeticsState;
}