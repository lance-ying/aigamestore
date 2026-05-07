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
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

export const DRAWING_PHASES = {
  IDLE: "IDLE",
  FIRST_POINT: "FIRST_POINT",
  SECOND_POINT: "SECOND_POINT",
  CONTROL_POINT: "CONTROL_POINT"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Matter.js references
  engine: null,
  world: null,
  
  // Game entities
  player: null,
  entities: [],
  sugarParticles: [],
  barriers: [],
  cups: [],
  spawners: [],
  colorFilters: [],
  gravitySwitches: [],
  teleporters: [],
  
  // Current level data
  currentLevel: 1,
  maxLevel: 30,
  levelData: null,
  
  // Cursor state
  cursor: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    active: false,
    drawingMode: false
  },
  
  // Drawing state - new curved line system
  drawingPhase: DRAWING_PHASES.IDLE,
  firstPoint: null,
  secondPoint: null,
  controlPoint: null,
  
  // Legacy drawing state (kept for backwards compatibility)
  isDrawing: false,
  currentDrawStart: null,
  currentDrawEnd: null,
  drawingPoints: [],
  
  // Game stats
  score: 0,
  scoreAtLevelStart: 0,
  sugarSpawned: 0,
  sugarInCups: 0,
  
  // Testing
  testFrameCount: 0,
  testAction: null,
  testBarriersDrawn: false,
  
  // Timing
  lastSpawnTime: 0,
  gravityDirection: 1 // 1 = down, -1 = up
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}