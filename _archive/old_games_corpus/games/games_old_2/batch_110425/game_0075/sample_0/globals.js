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

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game specific state
  currentLevel: 0,
  totalLevels: 5,
  terrainLayers: [],
  selectedLayerIndex: 0,
  oldMan: null,
  goalPosition: { x: 0, y: 0 },
  isMoving: false,
  levelComplete: false,
  
  // Input state
  keys: {},
  lastTerrainAdjustTime: 0,
  terrainAdjustDelay: 150,
  
  // Camera
  cameraOffsetX: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}