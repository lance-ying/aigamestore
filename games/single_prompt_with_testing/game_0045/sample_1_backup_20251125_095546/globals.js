import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = new THREE.Vector3(0, -0.025, 0);
export const PLAYER_SPEED = 0.15;
export const PLAYER_JUMP_POWER = 0.4;
export const PLAYER_DASH_POWER = 0.8;
export const PROJECTILE_SPEED = 0.6;

// Colors
export const COLORS = {
  player: 0x00ffff,      // Neon cyan
  demon: 0xff0066,       // Neon pink
  card: 0xffff00,        // Neon yellow
  projectile: 0x00ffff,  // Neon cyan
  platform: 0x1a1a2e,    // Dark purple
  background: 0x0a0a15,  // Very dark blue
  ground: 0x16213e,      // Dark blue
  ui: 0x00ffff          // Neon cyan
};

// Game state
export const gameState = {
  // Three.js core
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  pointLights: [],
  
  // Game entities
  player: null,
  demons: [],
  cards: [],
  projectiles: [],
  platforms: [],
  particles: [],
  
  // Game state
  gamePhase: "START",
  controlMode: "HUMAN",
  score: 0,
  demonsEliminated: 0,
  totalDemons: 10,
  cardsCollected: 0,
  
  // Physics
  gravity: GRAVITY.clone(),
  
  // Camera
  cameraMode: "first_person",
  cameraOffset: new THREE.Vector3(0, 0.8, 0), // Eye height
  cameraRotation: { yaw: 0, pitch: 0 },
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameStartTime: 0,
  gameEndTime: 0,
  elapsedTime: 0,
  
  // Input state
  keys: {},
  
  // Special abilities
  canDoubleJump: false,
  hasJumped: false,
  lastJumpTime: 0,
  
  // Level data
  arenaSize: 30,
  
  // Container reference
  gameContainer: null
};

// Initialize logs (write-only)
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Expose logs globally
if (typeof window !== 'undefined') {
  window.logs = logs;
}

// Helper function to log game info
export function logGameInfo(status, data = {}) {
  logs.game_info.push({
    game_status: status,
    data: data,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Helper function to log player info
export function logPlayerInfo(player) {
  if (!player || !gameState.camera) return;
  
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

// Helper function to log input
export function logInput(inputType, key, keyCode) {
  logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}