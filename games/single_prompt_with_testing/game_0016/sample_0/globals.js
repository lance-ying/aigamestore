// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Game constants
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 800;
export const TILE_SIZE = 40;

export const ITEM_TYPES = {
  BERRY: "BERRY",
  WOOD: "WOOD",
  STONE: "STONE",
  MEAT: "MEAT"
};

export const CRAFT_RECIPES = {
  AXE: { wood: 2, stone: 1 },
  PICKAXE: { wood: 1, stone: 2 }
};

export const RESOURCE_GATHER_AMOUNTS = {
  BERRY: 3,
  WOOD: 1,
  STONE: 1,
  WOOD_WITH_AXE: 3,
  STONE_WITH_PICKAXE: 3
};

export const HUNGER_CONFIG = {
  MAX: 100,
  START: 100,
  DECAY_RATE: 0.05, // per frame
  BERRY_RESTORE: 10,
  MEAT_RESTORE: 25
};

export const TIME_CONFIG = {
  DAY_LENGTH: 600, // frames (10 seconds at 60fps)
  NIGHT_LENGTH: 400, // frames
  CYCLES_TO_WIN: 5
};

export const CAMPFIRE_CONFIG = {
  FUEL_MAX: 300,
  FUEL_DECAY: 0.5,
  FUEL_PER_WOOD: 100,
  LIGHT_RADIUS: 100,
  DAMAGE_PER_FRAME: 0.1
};

// Game state
export const gameState = {
  player: null,
  entities: [],
  resources: [], // berry bushes, trees, rocks
  rabbits: [],
  campfire: null,
  portal: null,
  
  inventory: {
    berry: 0,
    wood: 0,
    stone: 0,
    meat: 0,
    hasAxe: false,
    hasPickaxe: false
  },
  
  hunger: HUNGER_CONFIG.START,
  
  timeOfDay: 0, // 0 to DAY_LENGTH + NIGHT_LENGTH
  cyclesCompleted: 0,
  
  cameraX: 0,
  cameraY: 0,
  
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  score: 0,
  
  // For testing
  positionHistory: []
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}