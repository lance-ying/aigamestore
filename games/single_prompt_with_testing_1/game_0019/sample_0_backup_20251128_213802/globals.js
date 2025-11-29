// globals.js - Global constants and game state
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  coins: [],
  barriers: [],
  swingPoints: [],
  checkpoints: [],
  portal: null,
  platforms: [],
  
  score: 0,
  health: 3,
  maxHealth: 3,
  
  currentLevel: 1,
  maxLevel: 6,
  
  abilities: {
    doubleJump: false,
    karateKick: false,
    hookSwing: false
  },
  
  lastCheckpoint: { x: 5, y: 2, z: 0 },
  
  invincible: false,
  invincibilityTimer: 0,
  
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  gameContainer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Physics
  gravity: new THREE.Vector3(0, -0.025, 0),
  
  // Camera state
  cameraOffset: new THREE.Vector3(0, 8, 15),
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Testing state
  testFrameCount: 0,
  testPhase: 0,
  
  // Ability unlock thresholds
  abilityThresholds: {
    doubleJump: 50,
    hookSwing: 100,
    karateKick: 25
  }
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}