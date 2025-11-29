// globals.js - Game constants and state management

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const PLAYER_SPEED = 3;
export const PLAYER_TURN_SPEED = 0.05;
export const PLAYER_RADIUS = 0.5;

export const FLASHLIGHT_DRAIN_RATE = 0.15;
export const FLASHLIGHT_RECHARGE_RATE = 2.0;
export const FLASHLIGHT_SHAKE_NOISE = 0.8;
export const FLASHLIGHT_RANGE = 15;

export const TATTLETAIL_NEED_DECAY = 0.05;
export const TATTLETAIL_NOISE_BASE = 0.3;
export const TATTLETAIL_NOISE_UNHAPPY = 1.5;

export const MAMA_SPAWN_THRESHOLD = 60;
export const MAMA_SPEED = 2.5;
export const MAMA_CATCH_DISTANCE = 2;

export const NOISE_DECAY_RATE = 0.5;
export const MOVEMENT_NOISE = 0.2;

export const GAME_DURATION = 180; // 3 minutes in seconds

// Wall definitions for the house (converted to 3D coordinates)
export const WALLS = [
  // Outer boundaries (scaled down for 3D)
  { x1: 0, y1: 0, x2: 40, y2: 0 },
  { x1: 40, y1: 0, x2: 40, y2: 30 },
  { x1: 40, y1: 30, x2: 0, y2: 30 },
  { x1: 0, y1: 30, x2: 0, y2: 0 },
  
  // Interior walls - Living room to hallway
  { x1: 15, y1: 0, x2: 15, y2: 10 },
  { x1: 15, y1: 14, x2: 15, y2: 30 },
  
  // Kitchen wall
  { x1: 25, y1: 0, x2: 25, y2: 10 },
  { x1: 25, y1: 14, x2: 25, y2: 20 },
  
  // Bedroom wall
  { x1: 0, y1: 15, x2: 10, y2: 15 },
  { x1: 14, y1: 15, x2: 25, y2: 15 },
];

// Room definitions (scaled for 3D)
export const ROOMS = [
  { name: "Living Room", x: 7.5, z: 7.5, width: 15, depth: 15, color: [40, 30, 50] },
  { name: "Hallway", x: 15, z: 10, width: 10, depth: 4, color: [30, 25, 40] },
  { name: "Kitchen", x: 25, z: 7.5, width: 15, depth: 12.5, color: [45, 35, 45] },
  { name: "Bedroom", x: 0, z: 0, width: 15, depth: 15, color: [35, 25, 45] },
];

// Furniture/interaction points (scaled for 3D)
export const FURNITURE = [
  { type: "food", x: 32.5, z: 5, label: "Food Bowl" },
  { type: "brush", x: 5, z: 5, label: "Brush" },
  { type: "charger", x: 32.5, z: 25, label: "Charger" },
];

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Three.js core objects
  scene: null,
  camera: null,
  renderer: null,
  gameContainer: null,
  uiCanvas: null,
  uiContext: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  spotLight: null,
  
  // Entities
  player: null,
  tattletail: null,
  mama: null,
  entities: [],
  wallMeshes: [],
  floorMesh: null,
  
  // Game variables
  score: 0,
  timeRemaining: GAME_DURATION,
  noiseLevel: 0,
  
  // Player state
  flashlightOn: false,
  flashlightBattery: 100,
  lastShakeTime: 0,
  
  // Tattletail state
  tattletailHunger: 100,
  tattletailCleanliness: 100,
  tattletailBattery: 100,
  tattletailNeedType: "none", // "food", "brush", "charge", "none"
  
  // Mama state
  mamaSpawned: false,
  mamaActive: false,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  gameStartTime: 0,
  
  // Input state
  keys: {},
};

// Expose getGameState function
export function getGameState() {
  return gameState;
}

// Make it globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}