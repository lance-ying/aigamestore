// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;
export const CARD_SPACING = 5;
export const PILE_SPACING = 10;

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  moves: 0,
  gamePhase: "START", // START, PLAYING, GAME_OVER_WIN, GAME_OVER_LOSE, PAUSED
  controlMode: "HUMAN",
  currentLevel: 1,
  timeRemaining: null,
  deck: [],
  stockPile: [],
  wastePile: [],
  foundations: [[], [], [], []],
  tableau: [[], [], [], [], [], [], []],
  selectedCards: null,
  selectedSource: null,
  dragOffset: { x: 0, y: 0 },
  hintActive: false,
  hintCard: null,
  hintTarget: null,
  undoStack: [],
  lastFrameTime: 0,
  wasteRecycled: false,
  levelStartTime: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}