// globals.js - Game constants and global state management

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

// Game state object
export const gameState = {
  // Core game state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Characters
  player: null, // Currently controlled character
  brother: null,
  sister: null,
  activeCharacter: 'brother', // 'brother' or 'sister'
  
  // Game entities
  entities: [],
  creatures: [],
  collectibles: [],
  puzzleElements: [],
  platforms: [],
  particles: [],
  
  // Score and progress
  score: 0,
  artifactsCollected: 0,
  totalArtifacts: 6,
  puzzlesSolved: 0,
  
  // Physics
  gravity: 0.5,
  friction: 0.85,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  worldWidth: 1200,
  worldHeight: 400,
  
  // Inventory
  inventory: [],
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Level state
  currentLevel: 1,
  doorsOpen: {},
  switchesActive: {},
  
  // Tutorial/hints
  showHints: true,
  currentHint: null
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Color palette for the game
export const COLORS = {
  // Sky and background
  skyTop: [135, 206, 235],
  skyBottom: [255, 228, 181],
  grass: [76, 175, 80],
  groundDark: [101, 67, 33],
  
  // Characters
  brotherMain: [255, 140, 0],
  brotherDark: [204, 102, 0],
  sisterMain: [255, 105, 180],
  sisterDark: [219, 39, 119],
  
  // UI
  uiBackground: [30, 30, 40],
  uiText: [255, 255, 255],
  uiAccent: [100, 200, 255],
  
  // Puzzles
  crystalBlue: [100, 200, 255],
  crystalPurple: [200, 100, 255],
  crystalGreen: [100, 255, 200],
  
  // Creatures
  creatureFriendly: [255, 220, 100],
  creatureMagical: [200, 150, 255]
};

// Level configuration
export const LEVEL_CONFIG = {
  1: {
    name: "Enchanted Forest Entrance",
    artifacts: 3,
    creatures: 2,
    puzzles: 2
  }
};