// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

export const gameState = {
  gamePhase: "START",
  controlMode: "HUMAN",
  player: null, // Will store player cursor state
  entities: [], // All game entities
  score: 0,
  moves: 0,
  startTime: null,
  elapsedTime: 0,
  level: 1,
  drawMode: 1, // 1 or 3
  deck: [],
  stock: [],
  waste: [],
  tableau: [[], [], [], [], [], [], []],
  foundations: [[], [], [], []],
  selectedPile: null, // { type: 'tableau'|'waste'|'stock'|'foundation', index: number }
  selectedCardIndex: null,
  pickedUpCards: null, // { cards: [], sourcePile: {...}, sourceIndex: number }
  undoStack: [],
  levelWins: 0,
  levelStartTime: null,
  levelTimeLimit: null,
  gameWonTime: null,
  autoCompleting: false,
  levelProgress: {
    1: { wins: 0, totalScore: 0 },
    2: { wins: 0, totalScore: 0 },
    3: { wins: 0, totalScore: 0, totalTime: 0 },
    4: { wins: 0, totalScore: 0 },
    5: { wins: 0, totalScore: 0 }
  }
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}