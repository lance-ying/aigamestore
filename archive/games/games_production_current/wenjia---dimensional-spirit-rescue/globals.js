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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Dimensions
export const WORLD_MATERIAL = "MATERIAL";
export const WORLD_ENERGY = "ENERGY";

// Player constants
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 24;
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_FORCE = 8;
export const GRAVITY = 0.4;
export const MAX_FALL_SPEED = 10;

// Level constants
export const PLATFORM_HEIGHT = 20;
export const ENEMY_SIZE = 20;
export const SPIRIT_SIZE = 30;

// Game state
export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  enemies: [],
  spirit: null,
  score: 0,
  currentLevel: 0,
  currentWorld: WORLD_MATERIAL,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  levelComplete: false,
  keys: {
    left: false,
    right: false,
    jump: false,
    shift: false
  }
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}