import { SaveData, Upgrades, CosmeticsState } from '../types';

const SAVE_KEY = 'adventure_void_save_v1';

export const DEFAULT_SAVE: SaveData = {
  gold: 0,
  lives: 3,
  upgrades: {
    maxHp: false,
    sharpSword: false,
    tripleJump: false,
    downStrike: false
  },
  cosmetics: {
    ownedSkins: ['default'],
    ownedHats: ['none'],
    currentSkin: 'default',
    currentHat: 'none'
  }
};

export const saveGame = (data: SaveData) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save game", e);
  }
};

export const loadGame = (): SaveData => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SAVE;
    
    const parsed = JSON.parse(raw);
    
    // Merge with default to handle potential schema updates in future
    return {
      gold: parsed.gold ?? DEFAULT_SAVE.gold,
      lives: parsed.lives ?? DEFAULT_SAVE.lives,
      upgrades: { ...DEFAULT_SAVE.upgrades, ...parsed.upgrades },
      cosmetics: { ...DEFAULT_SAVE.cosmetics, ...parsed.cosmetics },
    };
  } catch (e) {
    console.error("Failed to load save", e);
    return DEFAULT_SAVE;
  }
};