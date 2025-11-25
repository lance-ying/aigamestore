// globals.js - Global constants and game state
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
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_Z = 90;
export const KEY_R = 82;

// Memory types and stages
export const MEMORY_TYPES = {
  CHILDHOOD: 'childhood',
  FIRST_LOVE: 'first_love',
  ARTISTIC: 'artistic',
  REGRET: 'regret',
  PEACE: 'peace'
};

// Game state - centralized state management
export const gameState = {
  player: null,
  entities: [],
  fragments: [],
  currentMemory: null,
  memoryIndex: 0,
  score: 0,
  fragmentsCollected: 0,
  timeRemaining: 180, // 3 minutes in seconds
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  blinkCooldown: 0,
  memories: [],
  transitionAlpha: 0,
  isTransitioning: false,
  reflectionMode: false,
  totalFragmentsNeeded: 15
};

// Window accessor for game state (required for testing)
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}