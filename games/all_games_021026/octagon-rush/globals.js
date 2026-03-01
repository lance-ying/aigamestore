// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_LEVEL_SELECT = "LEVEL_SELECT";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_LEVEL_COMPLETE = "LEVEL_COMPLETE";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Tunnel configuration
export const NUM_SEGMENTS = 8; // Octagonal tunnel
export const TUNNEL_RADIUS = 150;
export const SEGMENT_ANGLE = (Math.PI * 2) / NUM_SEGMENTS;

// Player configuration
export const PLAYER_SIZE = 20;
export const MAX_LIVES = 3;

// Obstacle configuration
export const OBSTACLE_WIDTH = 30;
export const OBSTACLE_HEIGHT = 15;

// Level timing
export const LEVEL_DURATION = 20; // seconds per level

// Movement
export const LANE_SWITCH_COOLDOWN = 0.15; // seconds between lane switches

// Level configuration
export const LEVELS = [
  // Easy levels (1-3)
  {
    number: 1,
    difficulty: "EASY",
    name: "Green Valley",
    initialSpeed: 2,
    maxSpeed: 4,
    speedIncreaseRate: 0.03,
    obstacleColor: [100, 255, 100],
    minObstaclesPerWave: 1,
    maxObstaclesPerWave: 2,
    minSpacing: 100,
    maxSpacing: 200
  },
  {
    number: 2,
    difficulty: "EASY",
    name: "Cyan Stream",
    initialSpeed: 2.5,
    maxSpeed: 5,
    speedIncreaseRate: 0.04,
    obstacleColor: [100, 255, 255],
    minObstaclesPerWave: 1,
    maxObstaclesPerWave: 3,
    minSpacing: 90,
    maxSpacing: 180
  },
  {
    number: 3,
    difficulty: "EASY",
    name: "Blue Horizon",
    initialSpeed: 3,
    maxSpeed: 6,
    speedIncreaseRate: 0.05,
    obstacleColor: [100, 150, 255],
    minObstaclesPerWave: 2,
    maxObstaclesPerWave: 3,
    minSpacing: 80,
    maxSpacing: 170
  },
  // Medium levels (4-6)
  {
    number: 4,
    difficulty: "MEDIUM",
    name: "Golden Rush",
    initialSpeed: 4,
    maxSpeed: 7,
    speedIncreaseRate: 0.06,
    obstacleColor: [255, 255, 100],
    minObstaclesPerWave: 2,
    maxObstaclesPerWave: 4,
    minSpacing: 70,
    maxSpacing: 150
  },
  {
    number: 5,
    difficulty: "MEDIUM",
    name: "Orange Blaze",
    initialSpeed: 5,
    maxSpeed: 8,
    speedIncreaseRate: 0.07,
    obstacleColor: [255, 180, 100],
    minObstaclesPerWave: 2,
    maxObstaclesPerWave: 4,
    minSpacing: 65,
    maxSpacing: 140
  },
  {
    number: 6,
    difficulty: "MEDIUM",
    name: "Pink Storm",
    initialSpeed: 6,
    maxSpeed: 9,
    speedIncreaseRate: 0.08,
    obstacleColor: [255, 100, 200],
    minObstaclesPerWave: 3,
    maxObstaclesPerWave: 5,
    minSpacing: 60,
    maxSpacing: 130
  },
  // Hard levels (7-9)
  {
    number: 7,
    difficulty: "HARD",
    name: "Red Inferno",
    initialSpeed: 7,
    maxSpeed: 10,
    speedIncreaseRate: 0.09,
    obstacleColor: [255, 100, 100],
    minObstaclesPerWave: 3,
    maxObstaclesPerWave: 5,
    minSpacing: 55,
    maxSpacing: 120
  },
  {
    number: 8,
    difficulty: "HARD",
    name: "Purple Chaos",
    initialSpeed: 8,
    maxSpeed: 11,
    speedIncreaseRate: 0.10,
    obstacleColor: [200, 100, 255],
    minObstaclesPerWave: 3,
    maxObstaclesPerWave: 6,
    minSpacing: 50,
    maxSpacing: 110
  },
  {
    number: 9,
    difficulty: "HARD",
    name: "White Thunder",
    initialSpeed: 9,
    maxSpeed: 12,
    speedIncreaseRate: 0.11,
    obstacleColor: [255, 255, 255],
    minObstaclesPerWave: 4,
    maxObstaclesPerWave: 6,
    minSpacing: 45,
    maxSpacing: 100
  }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  particles: [],
  score: 0,
  lives: MAX_LIVES,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentLevel: 1,
  levelConfig: LEVELS[0],
  tunnelRotation: 0,
  playerSegment: 0,
  scrollOffset: 0,
  speed: 2,
  gameTime: 0,
  lastObstacleZ: 0,
  isFlipping: false,
  flipProgress: 0,
  flipStartSegment: 0,
  flipTargetSegment: 0,
  isMovingLane: false,
  laneMoveProgress: 0,
  laneMoveStartSegment: 0,
  laneMoveTargetSegment: 0,
  nextObstacleId: 0,
  laneSwitchCooldown: 0,
  screenShake: 0,
  hitFlashAlpha: 0,
  invulnerableTime: 0
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}