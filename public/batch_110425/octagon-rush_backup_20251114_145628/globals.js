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

// Obstacle configuration
export const OBSTACLE_WIDTH = 30;
export const OBSTACLE_HEIGHT = 15;
export const MIN_OBSTACLE_SPACING = 80;
export const MAX_OBSTACLE_SPACING = 200;

// Game timing
export const GAME_DURATION = 60; // seconds

// Speed configuration
export const INITIAL_SPEED = 2;
export const MAX_SPEED = 8;
export const SPEED_INCREASE_RATE = 0.05; // per second

// Movement
export const LANE_SWITCH_COOLDOWN = 0.15; // seconds between lane switches

// Game state object
export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  score: 0,
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
  nextObstacleId: 0,
  laneSwitchCooldown: 0 // Cooldown timer for lane switching
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}