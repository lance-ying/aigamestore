// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const GRID_COLS = 40;
export const GRID_ROWS = 30;

export const BUILDING_TYPES = {
  DRILL: 'DRILL',
  CONVEYOR: 'CONVEYOR',
  FACTORY: 'FACTORY',
  TURRET: 'TURRET',
  UNIT_FACTORY: 'UNIT_FACTORY'
};

export const RESOURCE_TYPES = {
  COPPER: 'COPPER',
  IRON: 'IRON',
  TITANIUM: 'TITANIUM'
};

export const gameState = {
  player: null,
  entities: [],
  buildings: [],
  enemies: [],
  projectiles: [],
  units: [],
  resources: {
    COPPER: 100,
    IRON: 50,
    TITANIUM: 0,
    STEEL: 0,
    CIRCUITS: 0
  },
  camera: { x: 0, y: 0 },
  cursor: { gridX: 0, gridY: 0 },
  selectedBuilding: BUILDING_TYPES.DRILL,
  core: null,
  score: 0,
  wave: 0,
  waveTimer: 0,
  nextWaveTime: 45 * 60, // 45 seconds at 60 FPS
  gamePhase: "START",
  controlMode: "HUMAN",
  framesSinceLastAction: 0,
  positionHistory: []
};

export const BUILDING_COSTS = {
  DRILL: { COPPER: 10 },
  CONVEYOR: { COPPER: 2 },
  FACTORY: { COPPER: 30, IRON: 20 },
  TURRET: { COPPER: 40, IRON: 30 },
  UNIT_FACTORY: { COPPER: 50, IRON: 40, TITANIUM: 20 }
};

export const BUILDING_COLORS = {
  DRILL: [180, 140, 60],
  CONVEYOR: [80, 80, 80],
  FACTORY: [120, 100, 180],
  TURRET: [200, 60, 60],
  UNIT_FACTORY: [60, 150, 200],
  CORE: [100, 200, 100]
};