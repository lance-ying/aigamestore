// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -12;
export const MOVE_SPEED = 4;

export const gameState = {
  player1: null,
  player2: null,
  entities: [],
  platforms: [],
  spikes: [],
  keys: [],
  doors: [],
  exit: null,
  score: 0,
  keysCollected: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  levelComplete: false,
  activePlayer: 1, // For space key switching in single player
  frameCount: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function resetGameState() {
  gameState.entities = [];
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.keys = [];
  gameState.doors = [];
  gameState.exit = null;
  gameState.score = 0;
  gameState.keysCollected = 0;
  gameState.levelComplete = false;
  gameState.player1 = null;
  gameState.player2 = null;
  gameState.activePlayer = 1;
}