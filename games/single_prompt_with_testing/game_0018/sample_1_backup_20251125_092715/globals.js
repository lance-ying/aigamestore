import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const LANE_POSITIONS = [-3, 0, 3]; // Left, Center, Right lane X positions
export const LANES = { LEFT: 0, CENTER: 1, RIGHT: 2 };
export const GROUND_Y = -1;
export const PLAYER_START_Z = -5;
export const OBSTACLE_SPAWN_Z = -50;
export const OBSTACLE_DESPAWN_Z = 10;
export const BASE_SPEED = 0.3;
export const SPEED_INCREMENT = 0.001;
export const MAX_SPEED = 1.2;

// Game state
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  trains: [],
  
  // Three.js core
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Physics
  gravity: new THREE.Vector3(0, -0.03, 0),
  
  // Camera
  cameraMode: "third_person",
  cameraTarget: null,
  cameraOffset: new THREE.Vector3(0, 8, 12),
  
  // Game state
  gamePhase: "START",
  controlMode: "HUMAN",
  score: 0,
  distance: 0,
  coins_collected: 0,
  speed: BASE_SPEED,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Spawning
  spawnTimer: 0,
  spawnInterval: 2.0,
  nextObstacleType: null,
  difficultyLevel: 1
};

// Initialize logs
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Expose globally
window.logs = logs;

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  logs.game_info.push({
    game_status: `control_mode_${mode}`,
    data: { mode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
};