// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;
export const WORLD_WIDTH = 200; // tiles
export const WORLD_HEIGHT = 100; // tiles
export const GRAVITY = 0.5;
export const MAX_FALL_SPEED = 15;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const BLOCK_TYPES = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  IRON_ORE: 3,
  GOLD_ORE: 4,
  DIAMOND_ORE: 5,
  MYTHRIL_ORE: 6,
  GRASS: 7,
  BEDROCK: 8
};

export const ITEM_TYPES = {
  DIRT: 'dirt',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  DIAMOND: 'diamond',
  MYTHRIL: 'mythril',
  WOOD_PICKAXE: 'wood_pickaxe',
  STONE_PICKAXE: 'stone_pickaxe',
  IRON_PICKAXE: 'iron_pickaxe',
  GOLD_PICKAXE: 'gold_pickaxe',
  DIAMOND_PICKAXE: 'diamond_pickaxe',
  MYTHRIL_PICKAXE: 'mythril_pickaxe',
  WOOD_SWORD: 'wood_sword',
  STONE_SWORD: 'stone_sword',
  IRON_SWORD: 'iron_sword',
  GOLD_SWORD: 'gold_sword',
  DIAMOND_SWORD: 'diamond_sword',
  MYTHRIL_SWORD: 'mythril_sword'
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  world: null,
  camera: { x: 0, y: 0 },
  time: 0, // game time in frames
  dayLength: 1800, // 30 seconds at 60fps
  score: 0,
  craftingOpen: false,
  defeatedBosses: [],
  spawnedBosses: [],
  messageQueue: [],
  particleEffects: []
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}