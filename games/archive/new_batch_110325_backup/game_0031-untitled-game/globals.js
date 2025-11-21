// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CARD_COLORS = [
  { name: "RED", color: [220, 50, 50] },
  { name: "BLUE", color: [50, 100, 220] },
  { name: "GREEN", color: [50, 180, 80] },
  { name: "YELLOW", color: [240, 200, 50] },
  { name: "ORANGE", color: [255, 140, 50] },
  { name: "PURPLE", color: [180, 80, 200] }
];

export const INITIAL_TRAIN_PIECES = 15;
export const GAME_END_THRESHOLD = 3;
export const INITIAL_HAND_SIZE = 4;
export const INITIAL_DESTINATIONS = 2;
export const VISIBLE_CARD_COUNT = 5;

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Players
  players: [],
  currentPlayerIndex: 0,
  
  // Game board
  cities: [],
  routes: [],
  
  // Cards
  trainCardDeck: [],
  trainCardDiscard: [],
  visibleCards: [],
  destinationDeck: [],
  
  // Current turn state
  turnPhase: "CHOOSE_ACTION", // CHOOSE_ACTION, DRAWING_CARDS, CLAIMING_ROUTE, CHOOSING_DESTINATIONS
  selectedAction: null,
  selectedRouteIndex: -1,
  selectedCardIndices: [],
  cardsDrawnThisTurn: 0,
  tempDestinations: [],
  
  // UI state
  menuSelection: 0,
  showingDestinations: false,
  
  // Game end
  finalRound: false,
  finalRoundStartPlayer: -1,
  
  // Scoring
  longestRoutePlayer: -1,
  longestRouteLength: 0
};

// Expose game state getter
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;