/**
 * Global constants and game state management
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas dimensions
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Control modes
export const CONTROL_MODE = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Game constants
export const GAME_CONFIG = {
  PLAYER_SPEED: 0.05,
  PLAYER_ACCELERATION: 0.35,
  PLAYER_MAX_SPEED: 0.20,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_ATTACK_DAMAGE: 15,
  PLAYER_ATTACK_COOLDOWN: 0.5,
  PLAYER_DODGE_COOLDOWN: 1.0,
  PLAYER_DODGE_DURATION: 0.4,
  PLAYER_HEAL_AMOUNT: 30,
  PLAYER_HEAL_COOLDOWN: 5.0,
  
  MONSTER_MAX_HEALTH: 150,
  MONSTER_SPEED: 0.08,
  MONSTER_ATTACK_DAMAGE: 20,
  MONSTER_ATTACK_RANGE: 2.5,
  MONSTER_ATTACK_COOLDOWN: 2.0,
  MONSTER_DETECTION_RANGE: 15,
  
  TRACK_COUNT: 15,
  TRACKS_TO_REVEAL: 8,
  TRACK_COLLECTION_RANGE: 1.5,
  
  GRAVITY: -0.5,
  WORLD_SIZE: 50
};

// Global game state
export const gameState = {
  // Game phase
  gamePhase: GAME_PHASE.START,
  controlMode: CONTROL_MODE.HUMAN,
  
  // Three.js objects
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Entities
  player: null,
  monster: null,
  tracks: [],
  scoutflies: [],
  
  // Game state
  score: 0,
  tracksCollected: 0,
  monsterRevealed: false,
  huntStartTime: 0,
  huntDuration: 0,
  
  // Physics
  gravity: new THREE.Vector3(0, GAME_CONFIG.GRAVITY, 0),
  
  // Camera
  cameraOffset: new THREE.Vector3(0, 8, 12),
  cameraTarget: null,
  cameraRotationOffset: 0, // Independent camera rotation controlled by arrow keys
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Terrain
  terrain: null,
  trees: [],
  rocks: []
};

// Initialize logs (write-only)
if (!window.logs) {
  window.logs = {
    game_info: [],
    player_info: [],
    inputs: []
  };
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Utility function to log game events
export function logGameEvent(eventType, data = {}) {
  window.logs.game_info.push({
    game_status: gameState.gamePhase,
    event_type: eventType,
    data: data,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Utility function to log player info
export function logPlayerInfo(player) {
  if (!player || !player.mesh) return;
  
  const screenPos = player.mesh.position.clone().project(gameState.camera);
  
  window.logs.player_info.push({
    screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
    screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
    game_x: player.mesh.position.x,
    game_y: player.mesh.position.y,
    game_z: player.mesh.position.z,
    health: player.health,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Utility function to log input
export function logInput(inputType, key, keyCode) {
  window.logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}