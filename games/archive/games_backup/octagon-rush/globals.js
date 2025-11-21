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
export const MIN_OBSTACLE_SPACING = 60;
export const MAX_OBSTACLE_SPACING = 180;

// Game timing
export const GAME_DURATION = 60; // seconds

// Speed configuration - increased for faster gameplay
export const INITIAL_SPEED = 3;
export const MAX_SPEED = 12;
export const SPEED_INCREASE_RATE = 0.07; // per second

// Movement
export const LANE_SWITCH_COOLDOWN = 0.15; // seconds between lane switches

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
  tunnelRotation: 0, // Fixed at 0 for discrete lane movement
  playerSegment: 0, // Which segment (0-7) the player is on
  scrollOffset: 0, // How far we've scrolled
  speed: INITIAL_SPEED,
  gameTime: 0, // Time elapsed in seconds
  lastObstacleZ: 0,
  isFlipping: false,
  flipProgress: 0,
  flipStartSegment: 0,
  flipTargetSegment: 0,
  isMovingLane: false, // New: for smooth lane transitions
  laneMoveProgress: 0,
  laneMoveStartSegment: 0,
  laneMoveTargetSegment: 0,
  nextObstacleId: 0,
  laneSwitchCooldown: 0, // Cooldown timer for lane switching
  screenShake: 0, // Screen shake intensity
  hitFlashAlpha: 0, // Red flash on hit
  invulnerableTime: 0 // Brief invulnerability after hit
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}