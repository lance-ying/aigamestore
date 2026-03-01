// globals.js - Game constants and global state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Physics constants
export const GRAVITY = 0.6;
export const FRICTION = 0.85;
export const AIR_RESISTANCE = 0.98;
export const JUMP_POWER = -13;
export const MOVE_SPEED = 5;
export const MAX_FALL_SPEED = 15;

// Grapple constants
export const GRAPPLE_RANGE = 250;
export const GRAPPLE_PULL_STRENGTH = 0.4;
export const GRAPPLE_SWING_DAMPING = 0.98;
export const GRAPPLE_LENGTH_VARIANCE = 0.05;

// Platform constants
export const PLATFORM_DECAY_TIME = 180; // 3 seconds at 60fps
export const PLATFORM_SHAKE_DURATION = 60; // 1 second warning
export const PLATFORM_FALL_SPEED = 2;

// Player constants
export const PLAYER_RADIUS = 15;
export const PLAYER_BOUNCE = 0.3;
export const PLAYER_SQUASH_FACTOR = 0.3;

// Collectible constants
export const STAR_RADIUS = 12;
export const STAR_VALUE = 100;
export const STAR_ROTATION_SPEED = 0.08;
export const STAR_BOB_AMPLITUDE = 5;
export const STAR_BOB_SPEED = 0.05;

// Game state object - tracks all game data
export const gameState = {
  // Core game state
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Entities
  player: null,
  entities: [],
  platforms: [],
  grapplePoints: [],
  collectibles: [],
  particles: [],
  
  // Physics state
  gravity: GRAVITY,
  friction: FRICTION,
  airResistance: AIR_RESISTANCE,
  
  // Game state
  score: 0,
  starsCollected: 0,
  totalStars: 0,
  levelTime: 0,
  
  // Performance tracking
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera state
  cameraX: 0,
  cameraY: 0,
  cameraShakeX: 0,
  cameraShakeY: 0,
  cameraShakeIntensity: 0,
  
  // Grapple state
  isGrappling: false,
  grappleTarget: null,
  grappleLength: 0,
  
  // Goal state
  goalPlatform: null,
  
  // Tutorial state
  showTutorial: true,
  tutorialStep: 0,
  
  // Level state
  currentLevel: 1,
  levelComplete: false
};

// Expose getGameState function globally
export function getGameState() {
  return gameState;
}
window.getGameState = getGameState;

// Key code constants
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// Color palette
export const COLORS = {
  background: [15, 15, 25],
  player: [100, 180, 255],
  playerEye: [255, 255, 255],
  playerPupil: [20, 20, 40],
  platform: [80, 80, 100],
  platformDecay: [180, 80, 80],
  platformGoal: [100, 255, 150],
  grapplePoint: [255, 200, 100],
  grappleLine: [255, 220, 150],
  star: [255, 230, 100],
  starGlow: [255, 200, 50],
  particle: [255, 255, 255],
  ui: [255, 255, 255],
  uiDark: [100, 100, 120]
};

// Level configuration
export const LEVEL_CONFIG = {
  1: {
    platforms: [
      { x: 100, y: 350, width: 150, height: 20, decay: true },
      { x: 300, y: 300, width: 120, height: 20, decay: true },
      { x: 480, y: 250, width: 100, height: 20, decay: true },
      { x: 350, y: 180, width: 130, height: 20, decay: true },
      { x: 150, y: 120, width: 140, height: 20, decay: true },
      { x: 50, y: 50, width: 100, height: 20, decay: false, isGoal: true }
    ],
    grapplePoints: [
      { x: 250, y: 200 },
      { x: 420, y: 150 },
      { x: 280, y: 80 }
    ],
    stars: [
      { x: 375, y: 270 },
      { x: 530, y: 220 },
      { x: 415, y: 150 },
      { x: 210, y: 90 }
    ],
    playerStart: { x: 150, y: 300 }
  }
};

// Initialize logs structure
export function initializeLogs(p) {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  // Log initial state
  p.logs.game_info.push({
    data: { 
      gamePhase: gameState.gamePhase,
      level: gameState.currentLevel
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Utility functions
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}