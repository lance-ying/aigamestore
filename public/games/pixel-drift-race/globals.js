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

// Lane configuration
export const NUM_LANES = 3;
export const LANE_WIDTH = 120;
export const TRACK_WIDTH = NUM_LANES * LANE_WIDTH;
export const TRACK_X_OFFSET = (CANVAS_WIDTH - TRACK_WIDTH) / 2;

// Player car constants - HOLD-BASED CONTROLS
export const PLAYER_CAR_WIDTH = 30;
export const PLAYER_CAR_HEIGHT = 50;
export const PLAYER_START_Y = CANVAS_HEIGHT - 100;
export const BASELINE_SPEED = 4; // Constant cruising speed
export const MAX_SPEED = 12; // Maximum speed
export const SPEED_BOOST = 0.15; // Acceleration per frame when holding
export const CONTINUOUS_DECELERATION = 0.08; // Gradual slowdown when not boosting
export const LANE_CHANGE_SPEED = 8; // Speed of lane change movement
export const BRAKE_FORCE = 0.25; // Speed reduction per frame when braking
export const MAX_HEALTH = 100;

// Drift constants
export const DRIFT_SPEED_THRESHOLD = 3;
export const DRIFT_DURATION_FOR_BONUS = 30; // frames (0.5 seconds at 60fps)
export const DRIFT_POINTS = 20;
export const DRIFT_BOOST_MULTIPLIER = 1.3;

// Rival car constants
export const RIVAL_CAR_WIDTH = 28;
export const RIVAL_CAR_HEIGHT = 45;
export const RIVAL_SPAWN_INTERVAL = 120; // frames

// Obstacle constants
export const OBSTACLE_SPAWN_INTERVAL = 90; // frames

// Coin constants
export const COIN_SPAWN_INTERVAL = 60; // frames
export const COIN_POINTS = 10; // Points per coin

// Boss constants
export const BOSS_WIDTH = 50;
export const BOSS_HEIGHT = 70;
export const BOSS_MAX_HEALTH = 300;

// Collision damage
export const OBSTACLE_DAMAGE = 15;
export const RIVAL_DAMAGE = 10;
export const BOSS_DAMAGE = 20;

// Scoring
export const POINTS_OVERTAKE = 10;
export const POINTS_DRIFT = 20;
export const POINTS_AIRTIME = 50;
export const POINTS_LEVEL_COMPLETE = 100;
export const POINTS_BOSS_DEFEAT = 500;

// Cash rewards
export const CASH_LEVEL_1 = 50;
export const CASH_LEVEL_2 = 100;
export const CASH_LEVEL_3 = 150;
export const CASH_BOSS = 300;

// Level definitions
export const LEVELS = [
  {
    id: 1,
    name: "Suburban Sprint",
    theme: "suburban",
    targetTime: 60,
    rivalCount: 3,
    rivalSpeed: 2,
    obstacleFrequency: 1.0,
    cashReward: CASH_LEVEL_1,
    isBoss: false
  },
  {
    id: 2,
    name: "City Rush",
    theme: "city",
    targetTime: 90,
    rivalCount: 5,
    rivalSpeed: 3,
    obstacleFrequency: 1.5,
    cashReward: CASH_LEVEL_2,
    isBoss: false
  },
  {
    id: 3,
    name: "Mountain Pass Ascent",
    theme: "mountain",
    targetTime: 120,
    rivalCount: 8,
    rivalSpeed: 4,
    obstacleFrequency: 2.0,
    cashReward: CASH_LEVEL_3,
    isBoss: false
  },
  {
    id: 4,
    name: "Boss Battle: The Enforcer",
    theme: "arena",
    targetTime: null,
    rivalCount: 0,
    rivalSpeed: 0,
    obstacleFrequency: 0,
    cashReward: CASH_BOSS,
    isBoss: true
  }
];

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  rivals: [],
  obstacles: [],
  coins: [],
  boss: null,
  projectiles: [],
  particles: [],
  score: 0,
  cash: 0,
  currentLevel: 1,
  levelStartTime: 0,
  scrollSpeed: 0,
  cameraY: 0,
  framesSinceRivalSpawn: 0,
  framesSinceObstacleSpawn: 0,
  framesSinceCoinSpawn: 0,
  driftChainMultiplier: 1,
  consecutiveDrifts: 0,
  noCollisionBonus: true,
  upgrades: {
    engine: 0,
    acceleration: 0,
    handling: 0
  },
  levelDistance: 0,
  levelLength: 3000,
  inputState: {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
  }
};

// Upgrade costs and effects
export const UPGRADE_COSTS = {
  engine: [100, 200, 300],
  acceleration: [100, 200, 300],
  handling: [100, 200, 300]
};

export const UPGRADE_EFFECTS = {
  engine: [1.2, 1.4, 1.6],
  acceleration: [1.2, 1.4, 1.6],
  handling: [1.2, 1.4, 1.6]
};
// Expose gameState to window for debugging and recording scripts
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}