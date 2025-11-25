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

// Room dimensions
export const ROOM_WIDTH = 560;
export const ROOM_HEIGHT = 340;
export const ROOM_X = 20;
export const ROOM_Y = 40;

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  tears: [],
  enemies: [],
  items: [],
  hearts: [],
  bombs: [],
  projectiles: [],
  
  score: 0,
  currentFloor: 1,
  roomsCleared: 0,
  
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Room state
  currentRoom: null,
  roomCleared: false,
  exitPortal: null,
  
  // Player stats tracking
  playerMaxHealth: 6,
  playerHealth: 6,
  playerDamage: 1,
  playerSpeed: 2.5,
  playerFireRate: 15,
  playerBombCount: 3,
  
  // Frame counters
  lastShotFrame: 0,
  lastBombFrame: 0,
  
  // Room generation
  currentRoomLayout: null,
  
  // Stats for testing
  totalEnemiesKilled: 0,
  itemsCollected: 0,
  damageTaken: 0
};

// Function to get game state (required for automated testing)
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}