// Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

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

// Game state object
export const gameState = {
  // Player reference
  player: null,
  
  // Boss reference
  boss: null,
  
  // Entity arrays
  entities: [],
  playerProjectiles: [],
  bossProjectiles: [],
  particles: [],
  powerUps: [],
  
  // Game state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  score: 0,
  lives: 3,
  maxLives: 3,
  
  // Physics
  gravity: 0.8,
  friction: 0.85,
  airResistance: 0.98,
  
  // Timing
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Camera (not used but included for completeness)
  cameraX: 0,
  cameraY: 0,
  
  // Boss state tracking
  bossPhase: 1,
  bossMaxPhases: 3,
  
  // Player state
  invulnerabilityFrames: 0,
  dashCooldown: 0,
  parryCooldown: 0,
  shootCooldown: 0,
  
  // Difficulty scaling
  difficultyMultiplier: 1.0,
  
  // Background animation
  bgOffset: 0,
  
  // Power-up types
  powerUpTypes: ['HEALTH', 'RAPID_FIRE', 'SHIELD'],
  
  // Game statistics
  damageDealt: 0,
  projectilesShot: 0,
  successfulParries: 0,
  dashesUsed: 0
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Reset game state for new game
export function resetGameState() {
  gameState.player = null;
  gameState.boss = null;
  gameState.entities = [];
  gameState.playerProjectiles = [];
  gameState.bossProjectiles = [];
  gameState.particles = [];
  gameState.powerUps = [];
  gameState.score = 0;
  gameState.lives = 3;
  gameState.gamePhase = PHASE_START;
  gameState.bossPhase = 1;
  gameState.invulnerabilityFrames = 0;
  gameState.dashCooldown = 0;
  gameState.parryCooldown = 0;
  gameState.shootCooldown = 0;
  gameState.difficultyMultiplier = 1.0;
  gameState.bgOffset = 0;
  gameState.damageDealt = 0;
  gameState.projectilesShot = 0;
  gameState.successfulParries = 0;
  gameState.dashesUsed = 0;
}

// Color palette inspired by 1930s cartoons
export const COLORS = {
  // Background colors
  SKY_TOP: [135, 206, 235],
  SKY_BOTTOM: [255, 218, 185],
  GROUND: [139, 90, 43],
  GROUND_HIGHLIGHT: [160, 110, 60],
  
  // Cuphead colors
  CUP_RED: [220, 40, 50],
  CUP_WHITE: [255, 250, 240],
  CUP_BLACK: [20, 20, 30],
  CUP_BLUE: [100, 150, 255],
  
  // Boss colors
  BOSS_PURPLE: [138, 43, 226],
  BOSS_PINK: [255, 105, 180],
  BOSS_YELLOW: [255, 215, 0],
  
  // Effect colors
  PARTICLE_ORANGE: [255, 140, 0],
  PARTICLE_YELLOW: [255, 255, 100],
  PARTICLE_WHITE: [255, 255, 255],
  
  // UI colors
  UI_TEXT: [255, 255, 255],
  UI_SHADOW: [0, 0, 0],
  HEALTH_GREEN: [50, 205, 50],
  HEALTH_RED: [220, 20, 60]
};

// Helper function to create color with alpha
export function colorWithAlpha(colorArray, alpha) {
  return [...colorArray, alpha];
}