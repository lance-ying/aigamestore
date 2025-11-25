import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Lane positions (X coordinates)
export const LANES = [-3, 0, 3];
export const LANE_WIDTH = 2.5;

// Game constants
export const INITIAL_SPEED = 0.15;
export const SPEED_INCREMENT = 0.001;
export const MAX_SPEED = 0.5;
export const SPAWN_INTERVAL = 60; // frames
export const COIN_SPAWN_CHANCE = 0.3;

// Player constants
export const PLAYER_SIZE = { width: 0.8, height: 1.6, depth: 0.8 };
export const JUMP_POWER = 0.4;
export const SLIDE_DURATION = 30; // frames
export const LANE_SWITCH_SPEED = 0.2;

// Obstacle constants
export const TRAIN_LENGTH = 8;
export const TRAIN_HEIGHT = 2;
export const BARRIER_LOW_HEIGHT = 0.8;
export const BARRIER_HIGH_HEIGHT = 2.2;

// Scoring
export const COIN_VALUE = 10;
export const WIN_SCORE = 500;

// Game state
export const gameState = {
  player: null,
  entities: [],
  
  // Three.js core
  scene: null,
  camera: null,
  renderer: null,
  gameContainer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Game variables
  score: 0,
  distance: 0,
  gameSpeed: INITIAL_SPEED,
  spawnCounter: 0,
  
  // Entity arrays
  obstacles: [],
  coins: [],
  tracks: [],
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera state
  cameraOffset: new THREE.Vector3(0, 8, 12),
  
  // Input state
  keys: {},
  lastLaneSwitch: 0,
  
  // UI Canvas
  uiCanvas: null,
  uiContext: null
};

// Initialize logs (write-only)
if (!window.logs) {
  window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
  };
}

export function getGameState() {
  return gameState;
}

// Expose globally
window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`${mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};