// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;
export const CARD_SPACING = 60;
export const CARD_VERTICAL_OFFSET = 20;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  
  deck: [],
  tableauPiles: [[], [], [], [], [], [], []],
  foundationPiles: [[], [], [], []],
  stockpile: [],
  wastePile: [],
  
  selectedCards: null,
  selectedSource: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  
  undoStack: [],
  level: 1,
  timer: 300,
  numStockpileResets: 0,
  maxResets: 3,
  
  moves: 0,
  startTime: 0,
  lastFrameTime: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}