// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
export const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

export const COMPONENT_TYPES = {
  CONVEYOR: 'CONVEYOR',
  PROCESSOR: 'PROCESSOR',
  ROTATOR: 'ROTATOR'
};

export const MATERIAL_TYPES = {
  RAW: 'RAW',
  PROCESSED: 'PROCESSED',
  REFINED: 'REFINED'
};

export const DIRECTIONS = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

export const gameState = {
  player: null,
  entities: [],
  materials: [],
  components: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  buildMode: false,
  selectedComponent: COMPONENT_TYPES.CONVEYOR,
  cursorX: 0,
  cursorY: 0,
  level: 1,
  levelComplete: false,
  requiredProducts: 3,
  deliveredProducts: 0,
  spawners: [],
  goals: [],
  framesSinceLastSpawn: 0,
  spawnInterval: 120,
  lastPlacementFrame: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;