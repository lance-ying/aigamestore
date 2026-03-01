// globals.js - Global constants, game state, and utility functions

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game state object that tracks all game data
export const gameState = {
  player: null,           // The creature (player)
  entities: [],           // All game entities
  humans: [],             // Human NPCs
  particles: [],          // Particle effects
  tentacles: [],          // Active tentacles
  walls: [],              // Wall collision geometry
  
  score: 0,               // Total score
  currentLevel: 1,        // Current level (1-3)
  maxLevels: 3,           // Total levels
  
  gamePhase: "START",     // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE", "LEVEL_COMPLETE"
  controlMode: "HUMAN",   // "HUMAN", "TEST_1", "TEST_2", etc.
  levelTransitionTimer: 0, // Timer for level transition
  
  // Physics
  gravity: 0,             // No gravity - top-down view
  friction: 0.85,
  
  // Game-specific state
  biomass: 1,             // Current creature size (1-3 scale)
  totalHumans: 15,        // Total humans to consume
  humansConsumed: 0,      // Humans consumed count
  evolutionStage: "SMALL", // "SMALL", "MEDIUM", "LARGE"
  
  // Abilities
  canUseTentacles: false,
  canUseBloodTrail: false,
  bloodTrailActive: false,
  bloodTrailTimer: 0,
  bloodTrailCooldown: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Level
  levelWidth: 1200,
  levelHeight: 800,
  
  // UI
  shakeAmount: 0,
  flashAmount: 0
};

// Key codes
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

// Color palette definitions
const LEVEL_PALETTES = [
  { // Level 1: Research Facility (Red/Dark)
    background: [10, 5, 15],
    wall: [30, 25, 35],
    wallHighlight: [45, 40, 50],
    floor1: [15, 10, 20],
    floor2: [18, 13, 23]
  },
  { // Level 2: Toxic Waste (Green/Industrial)
    background: [5, 15, 5],
    wall: [20, 35, 20],
    wallHighlight: [30, 50, 30],
    floor1: [10, 20, 10],
    floor2: [13, 23, 13]
  },
  { // Level 3: Deep Containment (Blue/Cold)
    background: [5, 10, 20],
    wall: [20, 25, 40],
    wallHighlight: [30, 40, 60],
    floor1: [10, 15, 25],
    floor2: [13, 18, 28]
  }
];

// Current Colors (Mutable)
export const COLORS = {
  background: [10, 5, 15],
  wall: [30, 25, 35],
  wallHighlight: [45, 40, 50],
  floor1: [15, 10, 20],
  floor2: [18, 13, 23],
  
  creature: [120, 20, 30],
  creatureDark: [80, 10, 20],
  blood: [180, 0, 20],
  human: [220, 200, 180],
  humanClothes: [40, 60, 90],
  alert: [255, 200, 0],
  tentacle: [140, 30, 40],
  text: [255, 255, 255],
  ui: [200, 200, 200]
};

// Update colors based on level
export function updatePalette(level) {
  const idx = Math.max(0, Math.min(level - 1, LEVEL_PALETTES.length - 1));
  const palette = LEVEL_PALETTES[idx];
  
  COLORS.background = [...palette.background];
  COLORS.wall = [...palette.wall];
  COLORS.wallHighlight = [...palette.wallHighlight];
  COLORS.floor1 = [...palette.floor1];
  COLORS.floor2 = [...palette.floor2];
}

// Expose gameState getter
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Helper functions
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, amt) {
  return start + (end - start) * amt;
}

// Reset game state for full restart
export function resetGame() {
  gameState.player = null;
  gameState.entities = [];
  gameState.humans = [];
  gameState.particles = [];
  gameState.tentacles = [];
  gameState.walls = [];
  
  gameState.score = 0;
  gameState.currentLevel = 1;
  
  resetLevelState();
  updatePalette(1);
  
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.shakeAmount = 0;
  gameState.flashAmount = 0;
  gameState.frameCount = 0;
}

// Reset state for next level (keep score/level)
export function resetLevelState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.humans = [];
  gameState.particles = [];
  gameState.tentacles = [];
  gameState.walls = [];
  
  gameState.biomass = 1;
  gameState.humansConsumed = 0;
  gameState.evolutionStage = "SMALL";
  gameState.canUseTentacles = false;
  gameState.canUseBloodTrail = false;
  gameState.bloodTrailActive = false;
  gameState.bloodTrailTimer = 0;
  gameState.bloodTrailCooldown = 0;
}