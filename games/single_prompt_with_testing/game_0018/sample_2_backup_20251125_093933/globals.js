import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const LANE_POSITIONS = [-3, 0, 3]; // X positions for three lanes
export const TRACK_LENGTH = 100;
export const BASE_SPEED = 0.3;
export const MAX_SPEED = 1.2;
export const SPEED_INCREMENT = 0.00005;
export const WIN_SCORE = 1000;

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  coins: [],
  score: 0,
  distance: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  
  // Three.js core
  scene: null,
  camera: null,
  renderer: null,
  
  // Lighting
  lights: [],
  ambientLight: null,
  directionalLight: null,
  
  // Game state
  currentSpeed: BASE_SPEED,
  spawnTimer: 0,
  spawnInterval: 2.0,
  coinSpawnTimer: 0,
  coinSpawnInterval: 1.5,
  
  // Performance
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera
  cameraOffset: new THREE.Vector3(0, 8, 12),
  
  // Track visuals
  trackSegments: [],
  tunnelSegments: []
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;