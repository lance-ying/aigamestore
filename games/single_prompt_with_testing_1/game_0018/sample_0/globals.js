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
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

// Game state object
export const gameState = {
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
  
  // Game entities
  player: null,
  entities: [],
  runway: null,
  terrain: null,
  
  // Flight state
  altitude: 300, // meters (1000 feet)
  speed: 77, // m/s (150 knots)
  verticalSpeed: 0, // m/s
  heading: 0, // degrees
  pitch: 0, // degrees
  roll: 0, // degrees
  
  // Physics
  velocity: new THREE.Vector3(0, 0, 0),
  angularVelocity: new THREE.Vector3(0, 0, 0),
  gravity: new THREE.Vector3(0, -9.81, 0),
  
  // Aircraft systems
  throttle: 0.5, // 0-1
  flapSetting: 0, // 0-4 (0=retracted, 4=full)
  gearDeployed: false,
  spoilersDeployed: false,
  fuel: 100, // percentage
  
  // Engine state
  engine1Running: true,
  engine2Running: true,
  
  // Control inputs
  pitchInput: 0,
  rollInput: 0,
  yawInput: 0,
  
  // Emergencies
  activeEmergencies: [],
  emergencyTimer: 0,
  
  // Landing metrics
  touchdownSpeed: 0,
  touchdownVerticalSpeed: 0,
  touchdownAlignment: 0,
  landedSafely: false,
  crashReason: "",
  
  // Score and mission
  score: 0,
  missionTime: 0,
  
  // Input state
  keys: {},
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Test automation
  testFrameCount: 0,
  testPhase: 0,
  
  // Camera state
  cameraMode: "third_person",
  cameraOffset: new THREE.Vector3(0, 3, 8),
  cameraTarget: null
};

// Physics constants
export const GRAVITY = 9.81;
export const AIRCRAFT_MASS = 50000; // kg
export const MAX_SPEED = 154; // m/s (300 knots)
export const STALL_SPEED = 51; // m/s (100 knots)
export const LANDING_SPEED_TARGET = 72; // m/s (140 knots)
export const MAX_LANDING_VERTICAL_SPEED = 1.5; // m/s (300 fpm)

// Runway parameters (in meters)
export const RUNWAY_LENGTH = 100;
export const RUNWAY_WIDTH = 15;

// Emergency types
export const EMERGENCY_TYPES = [
  "ENGINE_FIRE",
  "HYDRAULIC_FAILURE",
  "ENGINE_FAILURE",
  "FUEL_LEAK",
  "ELECTRICAL_FAILURE"
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}