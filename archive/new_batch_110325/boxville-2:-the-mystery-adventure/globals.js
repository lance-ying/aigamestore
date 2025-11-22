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
  interactables: [],
  inventory: [],
  selectedInventoryIndex: -1,
  currentScene: 0,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  highlightedObject: null,
  thoughtBubble: null,
  thoughtBubbleTimer: 0,
  puzzleStates: {},
  completedPuzzles: new Set(),
  sceneTransition: false,
  transitionTimer: 0
};

// Expose gameState globally
window.getGameState = () => gameState;