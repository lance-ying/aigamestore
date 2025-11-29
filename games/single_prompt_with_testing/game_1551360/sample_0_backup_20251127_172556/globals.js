// globals.js - Global constants and game state management
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Canvas constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// World constants
export const WORLD_SIZE = 200; // Size of the playable area
export const BIOME_ZONES = 4; // Number of distinct biome areas

// Game configuration
export const TARGET_SCORE = 1000;
export const TARGET_TOKENS = 50;
export const TOKEN_VALUE = 10;
export const CHECKPOINT_VALUE = 50;
export const BOOST_COST = 3; // Tokens needed for one boost

// Initialize game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Score and progression
  score: 0,
  tokensCollected: 0,
  checkpointsCompleted: 0,
  boostsAvailable: 0,
  
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  gameContainer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  hemisphereLight: null,
  
  // Game entities
  player: null, // The vehicle
  entities: [],
  tokens: [],
  checkpoints: [],
  obstacles: [],
  terrain: null,
  
  // Physics state
  gravity: new THREE.Vector3(0, -0.5, 0),
  
  // Camera state
  cameraMode: "third_person",
  cameraTarget: null,
  cameraOffset: new THREE.Vector3(0, 8, 15),
  cameraLookOffset: new THREE.Vector3(0, 2, -5),
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // UI state
  uiCanvas: null,
  uiContext: null,
  
  // Biome information
  biomes: [],
  currentBiome: 0,
  
  // Checkpoint system
  activeCheckpoint: null,
  checkpointIndex: 0,
  
  // Testing state
  testStartTime: 0,
  testDuration: 0,
  testPhase: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

// Initialize logs (write-only)
export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Expose logs globally
window.logs = logs;
window.getGameState = getGameState;

// Utility function to log game info
export function logGameInfo(status, data = {}) {
  logs.game_info.push({
    game_status: status,
    data: data,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Utility function to log player info
export function logPlayerInfo(screenX, screenY, gameX, gameY, gameZ, extraData = {}) {
  logs.player_info.push({
    screen_x: screenX,
    screen_y: screenY,
    game_x: gameX,
    game_y: gameY,
    game_z: gameZ,
    ...extraData,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Utility function to log inputs
export function logInput(inputType, key, keyCode) {
  logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Biome definitions
export const BIOME_DEFINITIONS = [
  {
    name: "Desert",
    groundColor: 0xD2B48C,
    skyColor: 0xFFB347,
    fogColor: 0xFFE4B5,
    accentColor: 0xFF8C00
  },
  {
    name: "Jungle",
    groundColor: 0x228B22,
    skyColor: 0x87CEEB,
    fogColor: 0x90EE90,
    accentColor: 0x006400
  },
  {
    name: "Beach",
    groundColor: 0xF4E7D7,
    skyColor: 0x00BFFF,
    fogColor: 0xE0F6FF,
    accentColor: 0x1E90FF
  },
  {
    name: "Mountain",
    groundColor: 0x8B7355,
    skyColor: 0xB0C4DE,
    fogColor: 0xD3D3D3,
    accentColor: 0x696969
  }
];