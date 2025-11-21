// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TRAIN_COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'BLACK', 'WHITE', 'ORANGE', 'PURPLE'];
export const WILD_COLOR = 'RAINBOW';

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Player data
  player: null,
  entities: [],
  
  // Game data
  trainCards: [], // deck of train cards
  faceUpCards: [], // 5 face-up cards
  destinationTickets: [], // deck of destination tickets
  
  routes: [], // all routes on the map
  cities: [], // all cities
  
  // Player state
  playerHand: [], // cards in hand
  playerDestinations: [], // destination tickets
  claimedRoutes: [], // routes claimed by player
  trainsRemaining: 45,
  score: 0,
  
  // Turn state
  currentAction: null, // "DRAW_CARDS", "CLAIM_ROUTE", "DRAW_DESTINATIONS"
  selectedCardIndex: -1,
  selectedRouteIndex: -1,
  cardsDrawnThisTurn: 0,
  destinationsDrawn: [],
  mustKeepDestinations: 0,
  
  // Game end tracking
  finalRoundTriggered: false,
  gameOver: false,
  
  // UI state
  menuSelection: 0,
  message: "",
  messageTimer: 0
};

// Export function to access game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}