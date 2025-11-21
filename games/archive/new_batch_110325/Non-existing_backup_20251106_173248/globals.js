// globals.js - Game state and constants

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
  
  // Story state
  currentNode: "start",
  dialogueIndex: 0,
  choiceIndex: 0,
  textToDisplay: "",
  textFullyDisplayed: false,
  textRevealSpeed: 2,
  
  // Progression tracking
  visitedNodes: new Set(),
  endingsReached: new Set(),
  playthrough: 0,
  totalEndings: 12,
  
  // Visual effects
  glitchEffect: false,
  fadeAlpha: 255,
  
  // Testing tracking
  lastActionFrame: 0,
  stuckCounter: 0,
  previousNode: null
};

// Make gameState accessible globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.currentNode = "start";
  gameState.dialogueIndex = 0;
  gameState.choiceIndex = 0;
  gameState.textToDisplay = "";
  gameState.textFullyDisplayed = false;
  gameState.glitchEffect = false;
  gameState.fadeAlpha = 255;
  gameState.playthrough++;
  gameState.lastActionFrame = 0;
  gameState.stuckCounter = 0;
  gameState.previousNode = null;
}

export default gameState;