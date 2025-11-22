// globals.js - Global constants and game state

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
  
  // Matter.js physics
  engine: null,
  world: null,
  
  // Game entities
  player: null,
  entities: [],
  runway: null,
  
  // Flight state
  altitude: 1000, // feet
  speed: 150, // knots
  verticalSpeed: 0, // feet per minute
  heading: 270, // degrees (270 = west, toward runway)
  pitch: 0, // degrees
  roll: 0, // degrees
  
  // Aircraft systems
  throttle: 0.5, // 0-1
  flapSetting: 0, // 0-4 (0=retracted, 4=full)
  gearDeployed: false,
  spoilersDeployed: false,
  fuel: 100, // percentage
  
  // Engine state
  engine1Running: true,
  engine2Running: true,
  
  // Emergencies
  activeEmergencies: [],
  emergencyTimer: 0,
  
  // Landing metrics
  touchdownSpeed: 0,
  touchdownVerticalSpeed: 0,
  touchdownAlignment: 0,
  landedSafely: false,
  
  // Score and mission
  score: 0,
  missionTime: 0,
  
  // Input state
  keys: {},
  
  // Test automation
  testFrameCount: 0,
  testPhase: 0
};

// Physics constants
export const GRAVITY = 0.5;
export const AIRCRAFT_MASS = 2;
export const MAX_SPEED = 300; // knots
export const STALL_SPEED = 100; // knots
export const LANDING_SPEED_TARGET = 140; // knots
export const MAX_LANDING_VERTICAL_SPEED = 300; // feet per minute

// Runway parameters
export const RUNWAY_X = 450;
export const RUNWAY_Y = 350;
export const RUNWAY_WIDTH = 100;
export const RUNWAY_HEIGHT = 300;

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