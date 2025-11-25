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

// Performance thresholds
export const CRITICAL_FPS = 45;
export const TARGET_DISPLAY_FPS = 90;
export const MAX_CABLE_TWIST = 720; // degrees
export const CRITICAL_CABLE_TWIST = 540;
export const MAX_TEMPERATURE = 85;
export const CRITICAL_TEMPERATURE = 75;

// Player constants
export const PLAYER_SIZE = 30;
export const PLAYER_SPEED = 3;
export const BOOST_MULTIPLIER = 1.5;
export const BOOST_HEAT_RATE = 0.3;
export const NORMAL_HEAT_RATE = 0.05;
export const COOLING_RATE = 0.1;

// Energy and ability constants
export const MAX_ENERGY = 100;
export const ENERGY_REGEN_RATE = 0.3;
export const UNTWIST_COST = 25;
export const UNTWIST_AMOUNT = 180;
export const BOOST_ENERGY_COST = 0.5;
export const OPTIMIZE_COOLDOWN = 300; // frames
export const OPTIMIZE_COST = 30;

// Challenge constants
export const CHALLENGES_TO_WIN = 5;
export const CHALLENGE_DURATION = 600; // frames (10 seconds)
export const CHALLENGE_INTERVAL = 300; // frames between challenges

// Zone constants
export const ZONE_SIZE = 80;
export const HIGH_DEMAND_ZONE_COLOR = [255, 100, 100, 100];
export const NORMAL_ZONE_COLOR = [100, 255, 100, 100];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Performance metrics
  currentFPS: TARGET_DISPLAY_FPS,
  averageFPS: TARGET_DISPLAY_FPS,
  cpuUsage: 30,
  gpuUsage: 40,
  gpuTemp: 55,
  cpuTemp: 50,
  cableTwist: 0, // degrees
  energy: MAX_ENERGY,
  
  // Challenge tracking
  challengesCompleted: 0,
  currentChallenge: null,
  challengeTimer: 0,
  timeSinceLastChallenge: 0,
  
  // Ability cooldowns
  boostActive: false,
  optimizeCooldown: 0,
  
  // Session tracking
  sessionStartTime: 0,
  frameCount: 0,
  
  // Performance zones
  performanceZones: [],
  
  // History for automated testing
  positionHistory: [],
  lastActionFrame: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}