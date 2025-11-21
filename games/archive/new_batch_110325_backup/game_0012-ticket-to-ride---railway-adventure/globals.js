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

export const COLORS = {
  RED: "RED",
  BLUE: "BLUE",
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  ORANGE: "ORANGE",
  WILD: "WILD"
};

export const COLOR_VALUES = {
  RED: [220, 50, 50],
  BLUE: [50, 120, 220],
  GREEN: [50, 180, 80],
  YELLOW: [240, 200, 50],
  ORANGE: [240, 140, 50],
  WILD: [200, 200, 200]
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  trainCars: 45,
  hand: [], // Array of color strings
  destinationTickets: [], // Array of {from, to, points, completed}
  claimedRoutes: [], // Array of route indices
  deck: [], // Array of color strings
  faceUpCards: [], // Array of 5 color strings
  
  // UI state
  uiMode: "DRAW_CARDS", // "DRAW_CARDS", "CLAIM_ROUTE", "VIEW_TICKETS"
  selectedCardIndex: -1,
  selectedRouteIndex: -1,
  mapOffsetX: 0,
  mapOffsetY: 0,
  
  // Turn state
  cardsDrawnThisTurn: 0,
  turnPhase: "ACTION", // "ACTION", "END_TURN"
  
  // Map data
  cities: [],
  routes: []
};

// Initialize deck
export function initializeDeck() {
  const deck = [];
  // 12 cards of each color (excluding wild for now to simplify)
  for (let color of [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW, COLORS.ORANGE]) {
    for (let i = 0; i < 12; i++) {
      deck.push(color);
    }
  }
  // 14 wild cards
  for (let i = 0; i < 14; i++) {
    deck.push(COLORS.WILD);
  }
  return deck;
}

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};