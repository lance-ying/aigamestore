// globals.js - Game constants and state management

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game constants
export const PLAYER_SPEED = 1.5; // Slower base speed
export const PLAYER_SPRINT_SPEED = 3; // Sprint speed (original speed)
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
export const MAMA_BASE_SPEED = 0.6; // Base speed for level 1
export const MAMA_CATCH_DISTANCE = 2;

export const NOISE_DECAY_RATE = 0.5;
export const MOVEMENT_NOISE = 0.2;

export const GAME_DURATION = 180; // 3 minutes in seconds

export const MAX_LEVELS = 9;

// Level color schemes (RGB values for walls, floors, ambient)
export const LEVEL_COLORS = [
  // Easy levels (1-3)
  { walls: 0x2a1a2f, floor: 0x1a1520, ambient: 0x404060, fog: 0x0a0508 }, // Purple (original)
  { walls: 0x1a2a2f, floor: 0x152025, ambient: 0x406060, fog: 0x050a0a }, // Teal
  { walls: 0x2f2a1a, floor: 0x25201a, ambient: 0x606040, fog: 0x0a0805 }, // Brown
  // Medium levels (4-6)
  { walls: 0x2f1a1a, floor: 0x201515, ambient: 0x604040, fog: 0x0a0505 }, // Dark red
  { walls: 0x1a1a2f, floor: 0x151520, ambient: 0x404060, fog: 0x05050a }, // Dark blue
  { walls: 0x2a2f1a, floor: 0x202515, ambient: 0x506050, fog: 0x080a05 }, // Dark green
  // Hard levels (7-9)
  { walls: 0x2f1a2a, floor: 0x20151a, ambient: 0x604050, fog: 0x0a0508 }, // Magenta
  { walls: 0x1a2f1a, floor: 0x152015, ambient: 0x406040, fog: 0x050a05 }, // Green
  { walls: 0x2f2a2a, floor: 0x252020, ambient: 0x605050, fog: 0x0a0808 }, // Gray
];

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

// Collectible spawn positions
export const COLLECTIBLE_POSITIONS = [
  { x: 5, z: 10 },
  { x: 10, z: 5 },
  { x: 35, z: 5 },
  { x: 35, z: 25 },
  { x: 5, z: 25 },
  { x: 20, z: 10 },
  { x: 30, z: 15 },
  { x: 10, z: 20 },
];

// Game state object
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "JUMPSCARE", "GAME_OVER_WIN", "GAME_OVER_LOSE", "LEVEL_COMPLETE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Level system
  currentLevel: 1,
  collectiblesNeeded: 5,
  collectiblesCollected: 0,
  
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
  goal: null,
  collectibles: [],
  entities: [],
  wallMeshes: [],
  floorMesh: null,
  ceilingMesh: null,
  
  // Game variables
  score: 0,
  timeRemaining: GAME_DURATION,
  noiseLevel: 0,
  
  // Player state
  flashlightOn: false,
  flashlightBattery: 100,
  lastShakeTime: 0,
  isSprinting: false,
  
  // Tattletail state
  tattletailHunger: 100,
  tattletailCleanliness: 100,
  tattletailBattery: 100,
  tattletailNeedType: "none", // "food", "brush", "charge", "none"
  
  // Mama state
  mamaSpawned: false,
  mamaActive: false,
  
  // Jumpscare
  jumpscareTime: 0,
  
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