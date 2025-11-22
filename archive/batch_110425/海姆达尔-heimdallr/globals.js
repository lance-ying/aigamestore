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

// Gameplay modes
export const MODE_PUZZLE = "PUZZLE";
export const MODE_PARKOUR = "PARKOUR";
export const MODE_DIALOGUE = "DIALOGUE";
export const MODE_TRANSITION = "TRANSITION";

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
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Gameplay mode
  currentMode: MODE_PUZZLE,
  
  // Chapter progression
  currentChapter: 0,
  totalChapters: 3,
  segmentComplete: false,
  
  // Puzzle state
  puzzleItems: [],
  selectedItems: [],
  puzzleSolved: false,
  decryptionProgress: 0,
  
  // Parkour state
  platforms: [],
  obstacles: [],
  dataFragments: [],
  collectedFragments: 0,
  totalFragments: 0,
  checkpointX: 0,
  levelComplete: false,
  
  // Story and endings
  storyChoices: [],
  dialogueIndex: 0,
  endingType: "NEUTRAL",
  
  // Animation
  transitionTimer: 0,
  transitionDuration: 120,
  
  // Camera
  cameraX: 0,
  
  // Input tracking
  keys: {},
  lastActionFrame: 0
};

// Expose game state getter
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;