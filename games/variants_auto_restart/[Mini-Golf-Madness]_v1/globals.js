// globals.js - Game constants and global state

export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 600;

// Game constants
export const HOLE_RADIUS = 12;
export const BALL_RADIUS = 6;
export const MAX_POWER = 20;
export const POWER_CHARGE_RATE = 0.5;
export const FRICTION = 0.98;
export const WALL_BOUNCE = 0.7;
export const MIN_VELOCITY = 0.1;
export const HOLE_CAPTURE_RADIUS = 8;
export const WATER_SLOWDOWN = 0.85;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  
  // Physics state
  gravity: 0,
  friction: FRICTION,
  
  // Golf-specific state
  ball: null,
  currentHole: 0,
  totalHoles: 9,
  strokes: 0,
  holeStrokes: [],
  holes: [],
  obstacles: [],
  walls: [],
  waterHazards: [],
  ramps: [],
  
  // Shooting state
  isAiming: true,
  aimAngle: 0,
  power: 0,
  isCharging: false,
  canShoot: true,
  
  // Camera state
  cameraX: 0,
  cameraY: 0,
  cameraZoom: 1,
  cameraFollowBall: true,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Particle effects
  particles: [],
  
  // Course data
  courseData: null,

  // Auto-restart timer ID
  autoRestartTimeoutId: null // New: To store the setTimeout ID for auto-restart
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;