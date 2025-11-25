// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const ROOMS = {
  MAIN: "MAIN",
  BEDROOM: "BEDROOM",
  STORAGE: "STORAGE",
  BASEMENT: "BASEMENT"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentRoom: ROOMS.MAIN,
  timeRemaining: 180, // 3 minutes in seconds
  inventory: [],
  selectedInventoryIndex: -1,
  inventoryOpen: false,
  interactables: {},
  securedPoints: {
    mainDoor: false,
    window1: false,
    window2: false,
    basementDoor: false
  },
  usedSedative: false,
  framesSinceLastSecond: 0
};

// Expose gameState globally
window.getGameState = () => gameState;