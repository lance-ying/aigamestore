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

export const SPELL_TYPES = {
  FIRE: "FIRE",
  ICE: "ICE",
  EXPLOSION: "EXPLOSION",
  WATER: "WATER"
};

export const ELEMENT_TYPES = {
  EARTH: 0,
  WATER: 1,
  FIRE: 2,
  ICE: 3,
  SMOKE: 4,
  STEAM: 5,
  EMPTY: 6
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  particles: [],
  pickups: [],
  terrain: [],
  cellularGrid: null,
  score: 0,
  depth: 0,
  maxDepth: 5,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  spellsCollected: [],
  currentSpellIndex: 0,
  cameraY: 0,
  roomHeight: 400,
  currentRoom: 0,
  totalRooms: 6,
  framesSinceStart: 0,
  enemiesDefeated: 0
};

// Expose game state globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.pickups = [];
  gameState.terrain = [];
  gameState.score = 0;
  gameState.depth = 0;
  gameState.spellsCollected = [SPELL_TYPES.FIRE];
  gameState.currentSpellIndex = 0;
  gameState.cameraY = 0;
  gameState.currentRoom = 0;
  gameState.framesSinceStart = 0;
  gameState.enemiesDefeated = 0;
}