// globals.js - Game constants and state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 4;
export const MAX_FALL_SPEED = 15;

export const WORLD_NORMAL = 'NORMAL';
export const WORLD_INNER = 'INNER';

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  currentWorld: WORLD_NORMAL,
  currentLevel: 1,
  totalLevels: 5,
  crystalsCollected: 0,
  totalCrystals: 0,
  levelComplete: false,
  movableBlocks: [],
  switches: [],
  doors: [],
  hazards: [],
  platforms: [],
  crystals: [],
  exitPortal: null,
  levelStartTime: 0,
  deathCount: 0
};

// Function to get game state (required for automated testing)
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}