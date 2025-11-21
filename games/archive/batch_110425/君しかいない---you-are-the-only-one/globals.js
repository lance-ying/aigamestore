// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game world
  rooms: [],
  currentRoom: 0,
  interactables: [],
  
  // Player inventory
  inventory: [],
  hasRedKeycard: false,
  hasBlueKeycard: false,
  hasGreenKeycard: false,
  
  // Doors and progression
  doors: [],
  redDoorUnlocked: false,
  blueDoorUnlocked: false,
  greenDoorUnlocked: false,
  
  // Journal entries
  journalEntries: [],
  totalJournalEntries: 0,
  
  // Game completion
  endingsFound: [],
  
  // Player state
  stamina: 100,
  maxStamina: 100,
  
  // Interaction state
  nearestInteractable: null,
  showingMessage: false,
  messageText: "",
  messageTimer: 0
};

// Expose gameState globally
window.getGameState = () => gameState;