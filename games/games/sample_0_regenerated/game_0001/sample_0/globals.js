// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 0,
  distance: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Physics
  gravity: 0.8,
  friction: 0.9,
  
  // Game specific
  segments: [], // Path segments
  obstacles: [],
  collectibles: [],
  particles: [],
  
  // Camera/viewport
  cameraZ: 0, // Z-depth for 3D effect
  cameraX: 0, // Lateral camera position
  
  // Player state tracking
  currentPath: null,
  upcomingIntersection: null,
  
  // Speed and difficulty
  baseSpeed: 3,
  currentSpeed: 3,
  speedIncrement: 0.001,
  maxSpeed: 8,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Game stats
  distanceTraveled: 0,
  coinsCollected: 0,
  obstaclesAvoided: 0,
  turnsCompleted: 0,
  
  // Tutorial/help
  showTutorial: true,
  tutorialTimer: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Path constants
export const PATH_WIDTH = 120;
export const SEGMENT_LENGTH = 200;
export const LANE_WIDTH = 40;

// Obstacle types
export const OBSTACLE_TYPES = {
  GAP: 'gap',
  BARRIER: 'barrier',
  LOW_BARRIER: 'low_barrier',
  PILLAR: 'pillar'
};

// Direction constants
export const DIRECTIONS = {
  FORWARD: 0,
  LEFT: -1,
  RIGHT: 1
};