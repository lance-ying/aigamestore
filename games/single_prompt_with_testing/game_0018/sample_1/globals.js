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
export const BASE_SPEED = 0.2;
export const SPEED_INCREMENT = 0.001;
export const MAX_SPEED = 0.8;

// Level system - 9 distinct levels based on coin collection
// Increased coin requirements for progression
export const LEVEL_CONFIG = [
  // Easy levels (1-3)
  { level: 1, difficulty: 'EASY', coinsRequired: 30, spawnInterval: 1.7, speedMultiplier: 0.2 },
  { level: 2, difficulty: 'EASY', coinsRequired: 70, spawnInterval: 1.5, speedMultiplier: 0.3 },
  { level: 3, difficulty: 'EASY', coinsRequired: 120, spawnInterval: 1.4, speedMultiplier: 0.4 },
  // Medium levels (4-6)
  { level: 4, difficulty: 'MEDIUM', coinsRequired: 180, spawnInterval: 1.3, speedMultiplier: 0.6 },
  { level: 5, difficulty: 'MEDIUM', coinsRequired: 250, spawnInterval: 1.2, speedMultiplier: 0.7 },
  { level: 6, difficulty: 'MEDIUM', coinsRequired: 330, spawnInterval: 1.0, speedMultiplier: 0.8 },
  // Hard levels (7-9)
  { level: 7, difficulty: 'HARD', coinsRequired: 420, spawnInterval: 0.9, speedMultiplier: 0.9 },
  { level: 8, difficulty: 'HARD', coinsRequired: 520, spawnInterval: 0.8, speedMultiplier: 1.0 },
  { level: 9, difficulty: 'HARD', coinsRequired: Infinity, spawnInterval: 0.7, speedMultiplier: 1.0 }
];

// Level themes for visual variety
export const LEVEL_THEMES = [
  { level: 1, bgColor: 0x1a1a2e, fogColor: 0x1a1a2e, tunnelColor: 0x3a3a3a, lightColor: 0xff9900 },
  { level: 2, bgColor: 0x1a2e1a, fogColor: 0x1a2e1a, tunnelColor: 0x3a4a3a, lightColor: 0x99ff00 },
  { level: 3, bgColor: 0x1a1e2e, fogColor: 0x1a1e2e, tunnelColor: 0x3a3a4a, lightColor: 0x0099ff },
  { level: 4, bgColor: 0x2e1a1a, fogColor: 0x2e1a1a, tunnelColor: 0x4a3a3a, lightColor: 0xff6600 },
  { level: 5, bgColor: 0x2e1a2e, fogColor: 0x2e1a2e, tunnelColor: 0x4a3a4a, lightColor: 0xff00ff },
  { level: 6, bgColor: 0x1a2e2e, fogColor: 0x1a2e2e, tunnelColor: 0x3a4a4a, lightColor: 0x00ffff },
  { level: 7, bgColor: 0x2e2e1a, fogColor: 0x2e2e1a, tunnelColor: 0x4a4a3a, lightColor: 0xffff00 },
  { level: 8, bgColor: 0x2e1a26, fogColor: 0x2e1a26, tunnelColor: 0x4a3a46, lightColor: 0xff0088 },
  { level: 9, bgColor: 0x0a0a0a, fogColor: 0x0a0a0a, tunnelColor: 0x1a1a1a, lightColor: 0xff0000 }
];

// Game state
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  trains: [],
  track: null,
  
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
  lives: 3,
  maxLives: 3,
  invincibilityTimer: 0,
  invincibilityDuration: 2.0,
  
  // Level system
  currentLevel: 1,
  currentLevelConfig: LEVEL_CONFIG[0],
  levelCompleteTimer: 0,
  levelCompleteDelay: 3.0,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Spawning
  spawnTimer: 0,
  spawnInterval: 1.7,
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