// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4;
export const PLAYER_COVER_SPEED = 1.5;
export const BULLET_SPEED = 6;
export const ENEMY_SPEED = 1.2;
export const ENEMY_BULLET_SPEED = 3;

// Game state object to track all game data
export const gameState = {
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  obstacles: [],
  pickups: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  level: {
    width: 1200,
    height: 800,
    cameraX: 0,
    cameraY: 0
  },
  extractionPoint: { x: 0, y: 0 },
  requiredKills: 10,
  enemiesKilled: 0,
  mission: "elimination", // "elimination" or "extraction"
  timeElapsed: 0
};

// Keyboard codes
export const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

// Get game state function (exposed globally)
export function getGameState() {
  return gameState;
}

// Helper functions
export function resetGame() {
  gameState.bullets = [];
  gameState.enemyBullets = [];
  gameState.enemies = [];
  gameState.obstacles = [];
  gameState.pickups = [];
  gameState.score = 0;
  gameState.enemiesKilled = 0;
  gameState.timeElapsed = 0;
  gameState.player = null;
  gameState.level.cameraX = 0;
  gameState.level.cameraY = 0;
  
  // Randomize mission type
  gameState.mission = Math.random() < 0.5 ? "elimination" : "extraction";
  gameState.requiredKills = 10 + Math.floor(Math.random() * 5);
}