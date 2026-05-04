// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const BOARD_SPACES = 30; // Total spaces to reach finish
export const SPACE_TYPES = {
  NORMAL: "NORMAL",
  SOUVENIR: "SOUVENIR",
  PHOTO: "PHOTO",
  MINIGAME: "MINIGAME",
  BONUS: "BONUS",
  FINISH: "FINISH"
};

export const MINIGAME_TYPES = {
  SCUBA: "SCUBA",
  SANDCASTLE: "SANDCASTLE",
  SURFING: "SURFING"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  memories: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game specific state
  currentSpace: 0,
  wheelSpinning: false,
  wheelValue: 0,
  wheelAngle: 0,
  wheelSpeed: 0,
  moving: false,
  moveProgress: 0,
  targetSpace: 0,
  
  // Event state
  currentEvent: null,
  eventActive: false,
  eventProgress: 0,
  
  // Minigame state
  minigameActive: false,
  minigameType: null,
  minigameScore: 0,
  minigameTimer: 0,
  minigameTargets: [],
  
  // Inventory
  souvenirs: 0,
  photos: 0,
  
  // Board configuration
  boardPath: [],
  spaceTypes: [],
  
  // Animation state
  celebrationTimer: 0,
  messageTimer: 0,
  currentMessage: "",
  
  // Input state
  spacePressed: false,
  zPressed: false,
  arrowPressed: { left: false, right: false, up: false, down: false }
};

// Expose gameState globally
window.getGameState = () => gameState;