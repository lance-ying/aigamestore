// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Room dimensions
export const ROOM_WIDTH = 1200;
export const ROOM_HEIGHT = 800;
export const TILE_SIZE = 40;

// Player constants
export const PLAYER_SPEED = 3;
export const PLAYER_SPRINT_SPEED = 5;
export const PLAYER_SIZE = 30;
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN = 0.5;
export const STAMINA_REGEN = 0.3;

// Enemy constants
export const ENEMY_SPEED = 1.5;
export const ENEMY_DETECTION_RANGE = 150;
export const ENEMY_DAMAGE = 20;
export const ENEMY_SIZE = 35;

// Gear Boy constants
export const GEARBOY_COOLDOWN = 60; // frames
export const GEARBOY_DURATION = 180; // frames
export const GEARBOY_RANGE = 100;

// Clue types
export const CLUE_TYPES = {
  NOTE: 'note',
  PHOTO: 'photo',
  KEY: 'key',
  EVIDENCE: 'evidence',
  SUPERNATURAL: 'supernatural'
};

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player reference
  player: null,
  
  // Entity arrays
  entities: [],
  enemies: [],
  clues: [],
  doors: [],
  furniture: [],
  particles: [],
  ghosts: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Game progress
  score: 0,
  cluesCollected: 0,
  totalClues: 8,
  evidenceCollected: [],
  unlockedDoors: [],
  
  // Gear Boy state
  gearBoyActive: false,
  gearBoyCooldown: 0,
  gearBoyDuration: 0,
  
  // Room data
  currentRoom: 'hallway',
  rooms: {},
  
  // Frame tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Mystery progress
  mysteryLevel: 0, // 0-3 progression
  finalRevelationTriggered: false
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;