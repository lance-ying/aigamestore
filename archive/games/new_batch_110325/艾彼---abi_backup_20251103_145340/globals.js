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
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Character types
export const CHAR_ABI = "ABI";
export const CHAR_DD = "DD";

// Interaction types
export const INTERACT_SWITCH = "SWITCH";
export const INTERACT_CRATE = "CRATE";
export const INTERACT_DOOR = "DOOR";
export const INTERACT_TERMINAL = "TERMINAL";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Characters
  abi: null,
  dd: null,
  activeCharacter: CHAR_ABI,
  
  // Current chapter and progress
  currentChapter: 0,
  chaptersCompleted: 0,
  totalChapters: 5,
  
  // Puzzle state
  switches: [],
  crates: [],
  doors: [],
  terminals: [],
  walls: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // World dimensions (larger than canvas for scrolling)
  worldWidth: 1200,
  worldHeight: 800,
  
  // Story progression
  storyUnlocked: [],
  finalTruthRevealed: false,
  
  // Movement
  lastMoveTime: 0,
  sprintActive: false
};

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};