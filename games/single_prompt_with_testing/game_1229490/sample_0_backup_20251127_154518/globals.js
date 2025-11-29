import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const ARENA_SIZE = 30;
export const PLAYER_SPEED = 0.22;
export const PLAYER_DASH_SPEED = 0.5;
export const PLAYER_JUMP_POWER = 0.4;
export const PROJECTILE_SPEED = 0.8;
export const ENEMY_SPEED = 0.05;
export const BLOOD_PARTICLE_LIFETIME = 2.0;
export const MAX_ENEMIES_PER_WAVE = 8;
export const TOTAL_WAVES = 5;
export const STYLE_COMBO_TIMEOUT = 3.0; // seconds without kill to reset combo

// Style ranks
export const STYLE_RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'ULTRAKILL'];
export const STYLE_THRESHOLDS = [0, 5, 10, 20, 35, 50, 75, 100];

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN", // HUMAN, TEST_1, TEST_2, etc.
  
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Physics - Reduced gravity for floating effect
  gravity: new THREE.Vector3(0, -0.008, 0),
  
  // Camera state
  cameraAngleX: 0, // Horizontal rotation
  cameraAngleY: 0, // Vertical rotation (adjusted for first person)
  cameraDistance: 12,
  cameraHeight: 5,
  
  // Entities
  player: null,
  enemies: [],
  projectiles: [],
  bloodParticles: [],
  platforms: [],
  
  // Game progression
  currentWave: 0,
  enemiesKilledThisWave: 0,
  totalEnemiesKilled: 0,
  score: 0,
  
  // Style system
  styleCombo: 0,
  stylePoints: 0,
  lastKillTime: 0,
  currentStyleRank: 'D',
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Wave management
  waveSpawnTimer: 0,
  waveSpawnDelay: 2.0,
  enemiesSpawnedThisWave: 0,
  
  // Input state
  keys: {},
  
  // Testing
  testStartTime: 0,
  testEnemiesKilled: 0
};

// Initialize logs (write-only)
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Expose logs globally
window.logs = logs;

// Expose getGameState globally
export function getGameState() {
  return gameState;
}
window.getGameState = getGameState;

// Log game info
export function logGameInfo(status, data = {}) {
  logs.game_info.push({
    game_status: status,
    data: data,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Log input
export function logInput(inputType, key, keyCode) {
  logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Log player info
export function logPlayerInfo() {
  if (!gameState.player) return;
  
  const screenPos = gameState.player.mesh.position.clone().project(gameState.camera);
  
  logs.player_info.push({
    screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
    screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
    game_x: gameState.player.mesh.position.x,
    game_y: gameState.player.mesh.position.y,
    game_z: gameState.player.mesh.position.z,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}