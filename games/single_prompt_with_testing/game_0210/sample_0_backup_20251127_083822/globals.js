// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Grid size for rooms
export const ROOM_WIDTH = 600;
export const ROOM_HEIGHT = 400;
export const TILE_SIZE = 20;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  
  // Room and level data
  currentRoom: { x: 0, y: 0 },
  rooms: new Map(),
  platforms: [],
  spikes: [],
  checkpoints: [],
  crewMembers: [],
  
  // Game progress
  collectedCrew: 0,
  totalCrew: 6,
  lastCheckpoint: { x: 50, y: 350, roomX: 0, roomY: 0 },
  deathCount: 0,
  
  // Physics
  gravity: 0.6,
  friction: 0.85,
  maxVelocity: 8,
  
  // Game state
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  cameraTargetX: 0,
  cameraTargetY: 0,
  
  // Transition state
  transitioning: false,
  transitionTimer: 0,
  transitionDirection: null,
  
  // Visual effects
  particles: [],
  screenShake: 0,
  
  // Room generation seed
  roomSeed: 42
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Color palette (VVVVVV style)
export const COLORS = {
  background: [0, 0, 0],
  player: [0, 191, 243],
  platform: [255, 255, 255],
  spike: [255, 0, 0],
  checkpoint: [255, 255, 0],
  crew: [255, 165, 0],
  gridLine: [40, 40, 60]
};