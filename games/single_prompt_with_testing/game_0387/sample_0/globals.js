// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const ARENA_FLOOR_Y = 350;
export const ARENA_LEFT = 50;
export const ARENA_RIGHT = 550;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const ARENA_TIERS = {
  PITS: { name: "The Pits", enemies: 2, tier: 0 },
  ARENA: { name: "The Arena", enemies: 3, tier: 1 },
  STADIUM: { name: "The Stadium", enemies: 4, tier: 2 },
  GRAND_STADIUM: { name: "Grand Stadium", enemies: 1, tier: 3, isFinal: true }
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  particles: [],
  score: 0,
  gold: 0,
  currentTier: 0,
  arenaName: "The Pits",
  defeatedEnemies: 0,
  totalEnemiesInTier: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  framesSinceLastAction: 0,
  positionHistory: []
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}