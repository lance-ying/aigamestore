// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 32;
export const MAP_COLS = 30;
export const MAP_ROWS = 20;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Gameplay states
export const GAMEPLAY_OVERWORLD = "OVERWORLD";
export const GAMEPLAY_COMBAT = "COMBAT";
export const GAMEPLAY_DIALOGUE = "DIALOGUE";
export const GAMEPLAY_MENU = "MENU";

// Combat states
export const COMBAT_INTRO = "COMBAT_INTRO";
export const COMBAT_PLAYER_TURN = "COMBAT_PLAYER_TURN";
export const COMBAT_ENEMY_TURN = "COMBAT_ENEMY_TURN";
export const COMBAT_ACTION_ANIMATION = "COMBAT_ACTION_ANIMATION";
export const COMBAT_BREAK_ATTACK = "COMBAT_BREAK_ATTACK";
export const COMBAT_VICTORY = "COMBAT_VICTORY";
export const COMBAT_DEFEAT = "COMBAT_DEFEAT";

// Elements
export const ELEMENT_PHYSICAL = "PHYSICAL";
export const ELEMENT_FIRE = "FIRE";
export const ELEMENT_ICE = "ICE";
export const ELEMENT_LIGHTNING = "LIGHTNING";
export const ELEMENT_DARK = "DARK";

// Global game state
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  gameplayState: GAMEPLAY_OVERWORLD,
  combatState: null,
  
  player: null,
  party: [],
  enemies: [],
  entities: [],
  
  camera: { x: 0, y: 0 },
  map: null,
  
  // Combat data
  currentTurn: 0,
  selectedPartyMember: 0,
  combatMenu: "MAIN", // MAIN, ATTACK, SKILL, ITEM
  selectedMenuOption: 0,
  combatAnimation: null,
  animationTimer: 0,
  
  // Progress tracking
  score: 0,
  infamy: 0,
  level: 1,
  materials: 0,
  battlesWon: 0,
  encounterTimer: 0,
  
  // Inventory
  inventory: {
    healthPotion: 3,
    manaPotion: 2
  },
  
  // Story progress
  storyProgress: 0,
  dialogueQueue: [],
  currentDialogue: null,
  
  // Win condition tracking
  targetVictories: 5,
  
  // Input tracking
  keysPressed: {},
  lastMoveTime: 0
};

// Expose game state getter
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}