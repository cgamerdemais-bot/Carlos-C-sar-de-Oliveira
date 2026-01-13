export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 600;

export const PHYSICS = {
  GRAVITY: 0.6,
  FRICTION: 0.85,
  MOVE_SPEED: 1.0,
  MAX_SPEED: 7,
  JUMP_FORCE: -14,
  DOUBLE_JUMP_FORCE: -12,
  MAX_JUMPS: 2,
  ATTACK_DURATION: 18,
  MOVING_PLATFORM_RANGE: 100,
  MOVING_PLATFORM_SPEED: 2.5,
  
  // Combat
  PLAYER_MAX_HP: 5,
  ENEMY_HP: 2,
  BOSS_HP: 20,
  RAT_BOSS_HP: 40,
  INVULNERABILITY_MS: 1000,
  KNOCKBACK_FORCE_X: 10,
  KNOCKBACK_FORCE_Y: -8,
  
  // Loot & Upgrades
  YELLOW_COIN_BOUNCE: 0.6,
  YELLOW_COIN_GRAVITY: 0.4,
  YELLOW_COIN_LIFETIME: 600, // 10 seconds approx at 60fps
  POGO_BOUNCE_FORCE: -15,
  
  // Enemy Speeds
  SPEED_PATROLLER: 2,
  SPEED_CHASER: 0.9, // Reduced by ~40% (was 1.5)
  SPEED_BOSS: 3.5,
  SPEED_RAT: 5.5,
};

export const PRICES = {
  MAX_HP: 10,
  SHARP_SWORD: 20,
  TRIPLE_JUMP: 30,
  DOWN_STRIKE: 40,
  COSMETIC: 5,
  EXTRA_LIFE: 10,
  LEGEND_SKIN: 7
};

export const COLORS = {
  PLAYER: '#22c55e', // green-500 (Default)
  PLATFORM: '#475569', // slate-600
  PLATFORM_MOVING: '#8b5cf6', // violet-500
  PLATFORM_TOP: '#94a3b8', // slate-400
  COIN: '#ef4444', // red-500
  YELLOW_COIN: '#facc15', // yellow-400
  DOOR_LOCKED: '#6b7280', // gray-500
  DOOR_UNLOCKED: '#fbbf24', // amber-400
  BACKGROUND: '#0f172a', // slate-900 (Default)
  
  // Enemies
  ENEMY_VERTICAL: '#dc2626', // red-600
  ENEMY_PATROLLER: '#9333ea', // purple-600
  ENEMY_CHASER: '#eab308', // yellow-500
  BOSS: '#7f1d1d', // red-900
  
  SWORD: '#ffffff',
  HP_BAR_BG: '#1e293b',
  HP_BAR_FILL_PLAYER: '#22c55e',
  HP_BAR_FILL_ENEMY: '#ef4444',
};

export const BIOME_COLORS = [
  '#0f172a', // Default Slate
  '#2e1065', // Dark Purple
  '#064e3b', // Dark Green
  '#450a0a', // Dark Red/Maroon
  '#1c1917', // Dark Stone
  '#0c4a6e', // Dark Ocean
  '#312e81'  // Dark Indigo
];

export const SKIN_COLORS = {
  default: '#22c55e', // Green
  midnight: '#1e3a8a', // Dark Blue
  crimson: '#991b1b', // Red
  golden: '#fbbf24', // Gold
  legend: '#000000', // Black (Fallback, usually custom drawn)
};

export const ENTITY_SIZE = {
  PLAYER: 32,
  COIN: 20,
  YELLOW_COIN: 14,
  DOOR_W: 40,
  DOOR_H: 60,
  PLATFORM_HEIGHT: 20,
  ENEMY: 32,
  BOSS: 96,
  SWORD_REACH: 50,
  SWORD_HEIGHT: 40,
};