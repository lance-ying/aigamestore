// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Design phases
export const DESIGN_PHASE = "DESIGN";
export const SIMULATE_PHASE = "SIMULATE";

// Road constants
export const ROAD_WIDTH = 20;
export const LANE_WIDTH = 10;
export const MIN_ROAD_LENGTH = 30;
export const MAX_ROAD_SEGMENTS = 50;

// Vehicle constants
export const VEHICLE_LENGTH = 12;
export const VEHICLE_WIDTH = 6;
export const VEHICLE_MAX_SPEED = 2.5;
export const VEHICLE_MIN_SPEED = 0.5;
export const VEHICLE_ACCEL = 0.05;
export const VEHICLE_DECEL = 0.1;
export const SAFE_DISTANCE = 20;

// Simulation constants
export const SIMULATION_DURATION = 60; // seconds
export const JAM_THRESHOLD = 5; // seconds
export const JAM_CAR_COUNT = 10;

// Star rating thresholds
export const STAR_3_THRESHOLD = 0.95; // 95% efficiency
export const STAR_2_THRESHOLD = 0.80; // 80% efficiency
export const STAR_1_THRESHOLD = 0.60; // 60% efficiency

// Game state
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentLevel: 1,
  designPhase: DESIGN_PHASE,
  
  // Road network
  roadSegments: [],
  entryPoints: [],
  exitPoints: [],
  
  // Vehicles
  vehicles: [],
  vehiclesCompleted: 0,
  vehiclesSpawned: 0,
  
  // Simulation
  simulationTime: 0,
  simulationRunning: false,
  
  // Performance metrics
  totalVehicles: 0,
  completedVehicles: 0,
  jammedTime: 0,
  efficiency: 1.0,
  stars: 0,
  
  // UI state
  selectedTool: "DRAW",
  undoStack: [],
  
  // Level data
  levelData: null
};

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ["HUMAN", "TEST_1", "TEST_2"];
  modes.forEach(m => {
    const btn = document.getElementById(m === "HUMAN" ? "humanModeBtn" : `test_${modes.indexOf(m)}_ModeBtn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
  window.setControlMode = setControlMode;
}