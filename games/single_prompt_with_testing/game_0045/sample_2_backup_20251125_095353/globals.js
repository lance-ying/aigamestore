// globals.js - Global constants and game state
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const GRAVITY = new THREE.Vector3(0, -0.03, 0);
export const PLAYER_SPEED = 0.15;
export const PLAYER_SPRINT_SPEED = 0.25;
export const PLAYER_JUMP_POWER = 0.35;
export const GROUND_Y = 0;

// Soul Card types and their abilities
export const CARD_TYPES = {
  PISTOL: { name: 'Pistol', color: 0x00ffff, ability: 'double_jump', damage: 30 },
  RIFLE: { name: 'Rifle', color: 0xff00ff, ability: 'dash', damage: 50 },
  SHOTGUN: { name: 'Shotgun', color: 0xffff00, ability: 'grapple', damage: 70 }
};

// Game state object
export const gameState = {
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  gameContainer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Player
  player: null,
  
  // Entities
  entities: [],
  enemies: [],
  collectibles: [],
  projectiles: [],
  platforms: [],
  
  // Physics
  gravity: GRAVITY.clone(),
  
  // Camera
  cameraMode: "first_person",
  cameraOffset: new THREE.Vector3(0, 0.8, 0),
  mouseSensitivity: 0.002,
  
  // Game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  score: 0,
  enemiesKilled: 0,
  totalEnemies: 0,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  levelStartTime: 0,
  levelCompleteTime: 0,
  bestTime: Infinity,
  
  // Input state
  keys: {},
  mouseMovement: { x: 0, y: 0 },
  
  // Level state
  currentLevel: 1,
  goalReached: false,
  
  // Respawn
  spawnPosition: new THREE.Vector3(0, 2, 0),
  respawnTimer: 0,
  isRespawning: false
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

// Log helper functions
export function logGameInfo(data) {
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: data,
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

export function logPlayerInfo(position) {
  if (gameState.camera && position) {
    const screenPos = position.clone().project(gameState.camera);
    logs.player_info.push({
      screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
      screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
      game_x: position.x,
      game_y: position.y,
      game_z: position.z,
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}