// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// World settings
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;

// Player settings
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4.5;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_MAX_ENERGY = 100;
export const STAMINA_DRAIN_RATE = 0.8;
export const STAMINA_REGEN_RATE = 0.5;
export const ENERGY_DRAIN_RATE = 1.2;
export const ENERGY_REGEN_RATE = 0.3;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  memoryFragments: [],
  npcs: [],
  hostiles: [],
  portal: null,
  camera: { x: 0, y: 0 },
  score: 0,
  memoriesCollected: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  elapsedTime: 0,
  npcInteractions: 0,
  playerPath: "neutral" // "kind", "neutral", "aggressive"
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}