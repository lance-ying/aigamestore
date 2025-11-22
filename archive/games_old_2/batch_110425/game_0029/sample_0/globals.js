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

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentScene: "beach",
  inventory: [],
  selectedItems: [],
  puzzleStates: {},
  unlockedAreas: [],
  interactionTarget: null,
  availableDirections: [],
  hintSystem: {
    hintsUsed: 0,
    currentHint: null
  },
  progressFlags: {
    hasKey: false,
    doorUnlocked: false,
    codeEntered: false,
    leverPulled: false,
    bridgeFixed: false,
    boatRepaired: false
  }
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.score = 0;
  gameState.currentScene = "beach";
  gameState.inventory = [];
  gameState.selectedItems = [];
  gameState.puzzleStates = {};
  gameState.unlockedAreas = [];
  gameState.interactionTarget = null;
  gameState.availableDirections = [];
  gameState.hintSystem = {
    hintsUsed: 0,
    currentHint: null
  };
  gameState.progressFlags = {
    hasKey: false,
    doorUnlocked: false,
    codeEntered: false,
    leverPulled: false,
    bridgeFixed: false,
    boatRepaired: false
  };
}