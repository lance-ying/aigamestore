// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  currentScene: "cafe",
  inventory: [],
  selectedInventoryIndex: -1,
  inventoryOpen: false,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Puzzle state tracking
  puzzleFlags: {
    talkedToWaiter: false,
    examinedNewspaper: false,
    foundKey: false,
    unlockedDoor: false,
    solvedPaintingPuzzle: false,
    combinedClues: false,
    finalPuzzleSolved: false
  },
  
  // Scene unlock tracking
  unlockedScenes: ["cafe"],
  
  // Achievements
  achievements: [],
  
  // Interaction state
  currentHotspot: null,
  dialogueActive: false,
  dialogueText: "",
  dialogueTimer: 0,
  
  // Scene transition
  transitioning: false,
  transitionTimer: 0,
  nextScene: null
};

// Make gameState accessible globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.inventory = [];
  gameState.selectedInventoryIndex = -1;
  gameState.inventoryOpen = false;
  gameState.score = 0;
  gameState.currentScene = "cafe";
  gameState.puzzleFlags = {
    talkedToWaiter: false,
    examinedNewspaper: false,
    foundKey: false,
    unlockedDoor: false,
    solvedPaintingPuzzle: false,
    combinedClues: false,
    finalPuzzleSolved: false
  };
  gameState.unlockedScenes = ["cafe"];
  gameState.achievements = [];
  gameState.currentHotspot = null;
  gameState.dialogueActive = false;
  gameState.dialogueText = "";
  gameState.dialogueTimer = 0;
  gameState.transitioning = false;
  gameState.transitionTimer = 0;
  gameState.nextScene = null;
}