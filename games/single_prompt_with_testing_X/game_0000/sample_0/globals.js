// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  SHOP: "SHOP",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const ITEM_TYPES = {
  SMALL_GOLD: { value: 50, weight: 1, size: 15, color: [255, 215, 0] },
  LARGE_GOLD: { value: 500, weight: 3, size: 30, color: [255, 200, 0] },
  ROCK: { value: 10, weight: 2, size: 20, color: [100, 100, 100] },
  DIAMOND: { value: 600, weight: 1, size: 20, color: [0, 191, 255] }
};

export const CLAW_CONFIG = {
  SWING_ANGLE: Math.PI / 3,
  SWING_SPEED: 0.02,
  DEPLOY_SPEED: 5,
  BASE_RETRACT_SPEED: 3,
  CABLE_START_X: CANVAS_WIDTH / 2,
  CABLE_START_Y: 40,
  MAX_LENGTH: CANVAS_HEIGHT - 60
};

export const SHOP_ITEMS = {
  DYNAMITE: { price: 100, label: "Dynamite" },
  STRENGTH_POTION: { price: 150, label: "Strength Potion" }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  
  // Player/Miner state
  player: null,
  
  // Level state
  level: 1,
  money: 0,
  target: 500,
  timeLeft: 60,
  
  // Claw state
  clawAngle: 0,
  clawDirection: 1,
  clawState: "SWINGING", // SWINGING, DEPLOYING, RETRACTING, RETURNING
  clawLength: 0,
  clawX: CLAW_CONFIG.CABLE_START_X,
  clawY: CLAW_CONFIG.CABLE_START_Y,
  grabbedItem: null,
  
  // Power-ups
  dynamiteCount: 0,
  strengthPotionCount: 0,
  strengthActive: false,
  strengthTimeLeft: 0,
  
  // Shop state
  shopSelection: 0,
  
  // Entities
  entities: [],
  items: [],
  
  // Testing
  testTimer: 0,
  testAction: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}