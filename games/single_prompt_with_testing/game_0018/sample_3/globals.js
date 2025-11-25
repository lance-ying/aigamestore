import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Lane positions
export const LANE_LEFT = -2;
export const LANE_CENTER = 0;
export const LANE_RIGHT = 2;
export const LANES = [LANE_LEFT, LANE_CENTER, LANE_RIGHT];

// Game constants
export const INITIAL_SPEED = 0.15;
export const SPEED_INCREMENT = 0.002;
export const MAX_SPEED = 0.5;
export const SPAWN_DISTANCE = 50;
export const DESPAWN_DISTANCE = -10;

// Player constants
export const JUMP_POWER = 0.4;
export const JUMP_DURATION = 0.6;
export const SLIDE_DURATION = 0.5;
export const LANE_SWITCH_SPEED = 0.15;

// Obstacle types
export const OBSTACLE_TYPES = {
  TRAIN: 'train',
  LOW_BARRIER: 'low_barrier',
  HIGH_BARRIER: 'high_barrier',
  COIN: 'coin'
};

// Game state
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  score: 0,
  distance: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  
  // Three.js core
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Physics
  gravity: new THREE.Vector3(0, -0.02, 0),
  
  // Camera
  cameraOffset: new THREE.Vector3(0, 4, 8),
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Game-specific
  gameSpeed: INITIAL_SPEED,
  lastSpawnZ: 0,
  spawnInterval: 10,
  nextSpawnZ: SPAWN_DISTANCE,
  
  // Track sections
  trackSections: [],
  
  // UI Canvas
  uiCanvas: null,
  uiContext: null
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Initialize logs (write-only)
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

if (typeof window !== 'undefined') {
  window.logs = logs;
}