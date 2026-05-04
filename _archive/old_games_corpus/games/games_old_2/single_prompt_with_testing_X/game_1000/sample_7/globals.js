// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 40;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CROP_TYPES = {
  WHEAT: {
    name: "Wheat",
    growthTime: 4,
    value: 10,
    color: [255, 215, 0],
    season: "spring"
  },
  CARROT: {
    name: "Carrot",
    growthTime: 3,
    value: 15,
    color: [255, 140, 0],
    season: "spring"
  },
  TOMATO: {
    name: "Tomato",
    growthTime: 5,
    value: 20,
    color: [255, 50, 50],
    season: "summer"
  },
  CORN: {
    name: "Corn",
    growthTime: 6,
    value: 25,
    color: [255, 255, 100],
    season: "summer"
  },
  PUMPKIN: {
    name: "Pumpkin",
    growthTime: 7,
    value: 30,
    color: [255, 140, 0],
    season: "fall"
  }
};

export const SEASONS = ["spring", "summer", "fall"];
export const DAYS_PER_SEASON = 20;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game-specific state
  day: 1,
  season: 0, // 0=spring, 1=summer, 2=fall
  energy: 100,
  maxEnergy: 100,
  farmingLevel: 1,
  farmingXP: 0,
  harvests: 0,
  targetHarvests: 30,
  selectedSeed: "WHEAT",
  
  // Farm grid
  farmGrid: [],
  
  // Time management
  timeOfDay: 0, // 0-1 (0=morning, 1=night)
  dayLength: 600, // frames per day
  framesSinceDay: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}