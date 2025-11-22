// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Lane configuration
export const NUM_LANES = 3;
export const LANE_HEIGHT = 80;
export const GROUND_Y = 300;
export const LANE_Y_POSITIONS = [
  GROUND_Y - LANE_HEIGHT * 2,
  GROUND_Y - LANE_HEIGHT,
  GROUND_Y
];

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER = "GAME_OVER";

// Player states
export const STATE_RUNNING = "running";
export const STATE_JUMPING = "jumping";
export const STATE_SLIDING = "sliding";
export const STATE_INVULNERABLE = "invulnerable";

// Object types
export const TYPE_OBSTACLE_HIGH = "obstacle_high";
export const TYPE_OBSTACLE_LOW = "obstacle_low";
export const TYPE_GAP = "gap";
export const TYPE_FISH = "fish";
export const TYPE_RESCUED_PENGUIN = "rescued_penguin";
export const TYPE_POWERUP_SHIELD = "powerup_shield";
export const TYPE_POWERUP_MAGNET = "powerup_magnet";

// Power-up types
export const POWERUP_SHIELD = "shield";
export const POWERUP_MAGNET = "magnet";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  obstacles: [],
  items: [],
  score: 0,
  fishCount: 0,
  lives: 3,
  maxLives: 3,
  currentLevel: 1,
  distanceTraveled: 0,
  scrollSpeed: 3,
  powerUp: {
    active: false,
    type: null,
    timer: 0
  },
  invulnerabilityTimer: 0,
  levelConfig: null,
  spawnTimer: 0,
  highScore: 0,
  framesSinceStart: 0
};

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    distanceTarget: 2000,
    baseSpeed: 3,
    obstacleDensity: 0.015,
    itemDensity: 0.025,
    powerUpChance: 0.15
  },
  {
    level: 2,
    distanceTarget: 4000,
    baseSpeed: 4.5,
    obstacleDensity: 0.025,
    itemDensity: 0.018,
    powerUpChance: 0.10
  },
  {
    level: 3,
    distanceTarget: 7000,
    baseSpeed: 6,
    obstacleDensity: 0.035,
    itemDensity: 0.012,
    powerUpChance: 0.05
  }
];

// Timing constants
export const INVULNERABILITY_DURATION = 120; // frames (~2 seconds)
export const SHIELD_DURATION = 300; // frames (~5 seconds)
export const MAGNET_DURATION = 420; // frames (~7 seconds)
export const JUMP_DURATION = 40; // frames
export const SLIDE_DURATION = 30; // frames

// Collision box sizes
export const PENGUIN_WIDTH = 30;
export const PENGUIN_HEIGHT = 40;
export const PENGUIN_SLIDE_HEIGHT = 20;
export const OBSTACLE_HIGH_WIDTH = 40;
export const OBSTACLE_HIGH_HEIGHT = 60;
export const OBSTACLE_LOW_WIDTH = 40;
export const OBSTACLE_LOW_HEIGHT = 20;
export const GAP_WIDTH = 100;
export const FISH_SIZE = 10;
export const RESCUED_PENGUIN_WIDTH = 20;
export const RESCUED_PENGUIN_HEIGHT = 30;
export const POWERUP_SIZE = 25;

// Magnet radius
export const MAGNET_RADIUS = 150;