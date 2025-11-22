// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const GENRE_TYPES = {
  EXPLORATION_2D: "EXPLORATION_2D",
  SHOOTER: "SHOOTER",
  CARD_BATTLE: "CARD_BATTLE",
  PUZZLE: "PUZZLE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  enemies: [],
  npcs: [],
  collectibles: [],
  doors: [],
  switches: [],
  portals: [],
  
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  currentGenre: GENRE_TYPES.EXPLORATION_2D,
  crystalsCollected: 0,
  totalCrystals: 5,
  
  playerHealth: 100,
  maxHealth: 100,
  
  // Card battle state
  cardBattleActive: false,
  cardBattleEnemy: null,
  playerCards: [],
  enemyCards: [],
  selectedCardIndex: -1,
  battleTurn: "player",
  battleResult: null,
  
  // Puzzle state
  switchStates: {},
  doorsUnlocked: {},
  
  // Camera for scrolling
  cameraX: 0,
  cameraY: 0,
  
  // World size
  worldWidth: 1200,
  worldHeight: 800,
  
  // Dash ability
  dashCooldown: 0,
  dashDuration: 0,
  
  frameCount: 0
};

// Expose gameState globally
window.getGameState = () => gameState;