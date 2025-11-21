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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";

// Game configuration
export const CANNON_Y = 350;
export const CANNON_WIDTH = 40;
export const CANNON_HEIGHT = 30;
export const CANNON_BARREL_LENGTH = 35;

export const UNIT_SIZE = 6;
export const UNIT_SPEED = 2.5;
export const UNIT_STREAM_DELAY = 8; // frames between units when holding space

export const GATE_WIDTH = 50;
export const GATE_HEIGHT = 80;
export const GATE_MOVE_SPEED = 1.5;

export const BASE_WIDTH = 60;
export const BASE_HEIGHT = 80;
export const BASE_MAX_HEALTH = 100;
export const BASE_X = CANVAS_WIDTH - BASE_WIDTH - 20;
export const BASE_Y = CANVAS_HEIGHT - BASE_HEIGHT - 20;

export const CHAMPION_ABILITY_COOLDOWN = 600; // 10 seconds at 60fps

// Scoring
export const SCORE_BASE_CLEAR = 1000;
export const SCORE_BLUE_GATE = 10;
export const SCORE_PERFECT_CHAIN = 50;
export const SCORE_SURVIVOR = 1;
export const SCORE_CHAMPION_FIRST = 100;
export const SCORE_CHAMPION_ADDITIONAL = 50;
export const PENALTY_RED_GATE = -25;
export const MULTIPLIER_CLEAN = 1.10;

export const RANK_S = 2400;
export const RANK_A = 1900;
export const RANK_B = 1400;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  gates: [],
  units: [],
  cannon: null,
  enemyBase: null,
  champions: [],
  selectedChampion: 0,
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  level: 1,
  
  // Scoring trackers
  blueGatesPassed: 0,
  redGatesPassed: 0,
  unitsReachedBase: 0,
  championUsed: false,
  championsUsedSet: new Set(),
  
  // Game state flags
  slowMotion: false,
  abilityOnCooldown: false,
  abilityCooldownTimer: 0,
  streamFiring: false,
  streamTimer: 0,
  
  // Input state
  keys: {},
  
  // Timing
  levelStartFrame: 0,
  levelEndFrame: 0
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.entities = [];
  gameState.gates = [];
  gameState.units = [];
  gameState.score = 0;
  gameState.blueGatesPassed = 0;
  gameState.redGatesPassed = 0;
  gameState.unitsReachedBase = 0;
  gameState.championUsed = false;
  gameState.championsUsedSet.clear();
  gameState.slowMotion = false;
  gameState.abilityOnCooldown = false;
  gameState.abilityCooldownTimer = 0;
  gameState.streamFiring = false;
  gameState.streamTimer = 0;
  gameState.levelStartFrame = 0;
  gameState.levelEndFrame = 0;
}