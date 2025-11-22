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

export const BATTLE_PHASES = {
  PLAYER_SELECT: "PLAYER_SELECT",
  PLAYER_EXECUTE: "PLAYER_EXECUTE",
  ENEMY_TURN: "ENEMY_TURN",
  TURN_END: "TURN_END"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Battle state
  battlePhase: BATTLE_PHASES.PLAYER_SELECT,
  turnNumber: 1,
  selectedCards: [],
  currentSteam: 3,
  maxSteam: 3,
  
  // Party
  heroes: [],
  
  // Enemies
  enemies: [],
  
  // Deck and hand
  deck: [],
  hand: [],
  discardPile: [],
  
  // Progression
  gold: 0,
  experience: 0,
  battleNumber: 1,
  
  // Animation state
  animations: [],
  messageQueue: [],
  currentMessage: null,
  messageTimer: 0,
  
  // UI state
  selectedCardIndex: -1,
  hoveredCardIndex: -1,
  
  // Position tracking for tests
  lastActionFrame: 0
};

// Card types
export const CARD_TYPES = {
  ATTACK: "ATTACK",
  DEFEND: "DEFEND",
  SPECIAL: "SPECIAL"
};

// Status effects
export const STATUS_EFFECTS = {
  SHIELD: "SHIELD",
  POWER_UP: "POWER_UP",
  WEAK: "WEAK"
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}