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
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Party
  heroes: [],
  
  // Combat
  enemies: [],
  currentEncounter: 0,
  totalEncounters: 5,
  turnPhase: "SELECT_CARDS", // SELECT_CARDS, EXECUTING, ENEMY_TURN
  
  // Deck and hand
  deck: [],
  hand: [],
  selectedCards: [],
  discardPile: [],
  
  // Shop
  availableCards: [],
  gold: 100,
  
  // UI state
  selectedHandIndex: 0,
  shopOpen: false,
  selectedShopIndex: 0,
  detailCardIndex: -1,
  
  // Progression
  experience: 0,
  level: 1,
  battlesWon: 0,
  
  // Animation
  animationQueue: [],
  
  // Player reference for testing
  player: null
};

// Card types
export const CARD_TYPES = {
  ATTACK: "ATTACK",
  DEFEND: "DEFEND",
  SPECIAL: "SPECIAL"
};

// Hero classes
export const HERO_CLASSES = {
  WARRIOR: "WARRIOR",
  MAGE: "MAGE",
  ROGUE: "ROGUE"
};