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

// Panel types
export const PANEL_SAFE = "SAFE";
export const PANEL_SPIKE = "SPIKE";
export const PANEL_ENEMY = "ENEMY";
export const PANEL_GAP = "GAP";
export const PANEL_EXIT = "EXIT";
export const PANEL_START = "START";

// Polo states
export const POLO_IDLE = "IDLE";
export const POLO_WALKING = "WALKING";
export const POLO_DEAD = "DEAD";
export const POLO_SUCCESS = "SUCCESS";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Level management
  currentWorld: 0,
  currentLevel: 0,
  totalWorlds: 3,
  levelsPerWorld: 3,
  
  // Panel management
  panels: [],
  selectedPanels: [], // Array of selected panel indices
  cursorIndex: 1, // Current cursor position (starts at first swappable panel)
  
  // Polo state
  poloState: POLO_IDLE,
  poloPosition: { panelIndex: 0, progress: 0 }, // progress: 0-1 within panel
  poloSpeed: 0.01, // Progress per frame
  
  // UI state
  rewindAvailable: true,
  moveHistory: [],
  
  // Input tracking
  lastActionFrame: 0,
  inputCooldown: 15, // frames between panel selections
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};