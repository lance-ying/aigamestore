/**
 * Global constants and game state management
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = new THREE.Vector3(0, -0.015, 0);
export const GROUND_Y = -2;
export const ARENA_SIZE = 30;

// Player constants
export const PLAYER_SPEED = 0.08;
export const PLAYER_JUMP_POWER = 0.4;
export const PLAYER_SIZE = 0.8;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_ATTACK_COOLDOWN = 0.3;
export const PLAYER_SPECIAL_COOLDOWN = 5.0;

// Enemy constants
export const ENEMY_BASE_SPEED = 0.025; // Reduced from 0.08 (about 70% slower)
export const ENEMY_BASE_HEALTH = 30;
export const ENEMY_BASE_DAMAGE = 10;
export const ENEMY_SPAWN_RATE = 3.0;
export const ENEMY_MAX_COUNT = 15;

// Item constants
export const ITEM_DROP_CHANCE = 0.3;
export const ITEM_TYPES = [
  { name: 'Health Boost', color: 0x00ff00, effect: 'maxHealth' },
  { name: 'Speed Boost', color: 0x00ffff, effect: 'speed' },
  { name: 'Fire Rate', color: 0xff6600, effect: 'fireRate' },
  { name: 'Damage Up', color: 0xff0000, effect: 'damage' },
  { name: 'Multi-Shot', color: 0xff00ff, effect: 'multishot' },
  { name: 'Shield', color: 0x0066ff, effect: 'shield' },
  { name: 'Critical', color: 0xffff00, effect: 'critical' },
  { name: 'Explosion', color: 0xff9900, effect: 'explosive' }
];

// Difficulty scaling
export const DIFFICULTY_SCALE_RATE = 0.05;
export const TELEPORTER_KILL_REQUIREMENT = 25;

// Game state object
export const gameState = {
  // Core objects
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  pointLights: [],
  
  // Physics
  gravity: new THREE.Vector3().copy(GRAVITY),
  
  // Camera
  cameraMode: 'third_person',
  cameraTarget: null,
  cameraOffset: new THREE.Vector3(0, 4, 6), // Closer camera
  cameraAngle: 0,
  cameraDistance: 6, // Closer distance (was 10)
  cameraHeight: 4, // Lower height (was 6)
  cameraForward: new THREE.Vector3(0, 0, -1), // Camera forward direction
  mouseX: 0,
  mouseY: 0,
  
  // Game state
  gamePhase: 'START', // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: 'HUMAN', // HUMAN, TEST_1, TEST_2
  
  // Entities
  player: null,
  enemies: [],
  projectiles: [],
  items: [],
  platforms: [],
  particles: [],
  teleporter: null,
  
  // Game progress
  score: 0,
  killCount: 0,
  difficultyMultiplier: 1.0,
  enemySpawnTimer: 0,
  gameTime: 0,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Test mode state
  testModeActive: false,
  testModeTimer: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

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

// Log helper functions
export function logGameInfo(status, data = {}) {
  logs.game_info.push({
    game_status: status,
    data: data,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(player) {
  if (!player || !player.mesh) return;
  
  const screenPos = player.mesh.position.clone().project(gameState.camera);
  logs.player_info.push({
    screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
    screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
    game_x: player.mesh.position.x,
    game_y: player.mesh.position.y,
    game_z: player.mesh.position.z,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function logInput(inputType, key, keyCode) {
  logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}