// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CARD_WIDTH = 50;
export const CARD_HEIGHT = 70;

export const SUITS = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS'];
export const RANKS = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const CARD_VALUES = {
  '7': 0, '8': 0, '9': 0, '10': 10,
  'J': 2, 'Q': 3, 'K': 4, 'A': 11
};

export const GAME_TYPES = ['CLUBS', 'SPADES', 'HEARTS', 'DIAMONDS', 'GRAND', 'NULL'];

export const gameState = {
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game structure
  level: 1,
  roundsInLevel: 0,
  roundsWonInLevel: 0,
  cumulativeScore: 0,
  
  // Round state
  deck: [],
  playerHands: [[], [], []], // [human, ai1, ai2]
  skatCards: [],
  currentTrick: [],
  collectedTricks: [[], [], []], // cards won by each player
  currentPlayerIndex: 0,
  leadPlayerIndex: 0,
  
  // Bidding
  biddingPhase: false,
  currentBidValue: 18,
  activeBidders: [true, true, true],
  declarer: -1,
  biddingPlayerIndex: 0,
  
  // Game type selection
  gameType: null,
  trumpSuit: null,
  
  // Skat handling
  skatTaken: false,
  cardsToDiscard: 2,
  discardedCards: [],
  
  // Trick tracking
  trickNumber: 0,
  
  // UI selection
  selectedCardIndex: 0,
  selectedGameTypeIndex: 0,
  
  // Points
  declarerPoints: 0,
  opponentPoints: 0,
  
  // Round end
  roundWinner: null,
  roundComplete: false,
  
  // Player entity (for logging)
  player: null,
  entities: []
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}