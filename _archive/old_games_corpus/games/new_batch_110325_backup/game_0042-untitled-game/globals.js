// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const COMBAT_PHASES = {
  SELECT_CARD: "SELECT_CARD",
  SELECT_TARGET: "SELECT_TARGET",
  ANIMATING: "ANIMATING",
  ENEMY_TURN: "ENEMY_TURN",
  REWARD: "REWARD",
  NEXT_FLOOR: "NEXT_FLOOR"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Combat state
  combatPhase: COMBAT_PHASES.SELECT_CARD,
  currentFloor: 1,
  maxFloors: 5,
  
  // Deck and hand
  deck: [],
  hand: [],
  discardPile: [],
  selectedCardIndex: -1,
  selectedTargetIndex: 0,
  
  // Enemies
  enemies: [],
  
  // Animation
  animations: [],
  animationTimer: 0,
  
  // Reward cards
  rewardCards: [],
  selectedRewardIndex: 0,
  
  // Turn tracking
  turnCount: 0,
  
  // Position tracking for testing
  lastPlayerAction: null,
  actionHistory: []
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}