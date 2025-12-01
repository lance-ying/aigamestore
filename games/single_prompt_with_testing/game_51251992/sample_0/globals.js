// Global constants and game state container

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 40;

// Game State Object
export const gameState = {
  // Core State
  gamePhase: "START",     // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN",   // HUMAN, TEST_1, TEST_2 (for automation)
  
  // Physics Engine
  engine: null,
  world: null,
  
  // Entities
  player: null,
  entities: [],           // All interactive entities (enemies, loot, projectiles)
  walls: [],              // Static environment bodies
  
  // Game Data
  score: 0,
  selectedClass: "WARRIOR", // WARRIOR or WIZARD
  
  // Camera / World Generation
  camera: { x: 0, y: 0 },
  dungeonY: 0,            // How far up we've generated
  highestY: 0,            // Furthest distance reached (negative Y is up)
  
  // Time tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Cleanup queue
  bodiesToRemove: []
};

// Global accessor
export function getGameState() {
  return gameState;
}

// Initialize logs for p5
export function initLogs(p) {
  p.logs = {
    game_info: [],
    player_info: [],
    inputs: []
  };
}