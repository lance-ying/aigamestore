// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4;
export const PLAYER_COVER_SPEED = 1.5;
export const BULLET_SPEED = 6;
export const ENEMY_SPEED = 1.2;
export const ENEMY_BULLET_SPEED = 3;

// Weapon definitions
export const WEAPONS = {
  pistol: {
    name: "Pistol",
    fireRate: 300,
    damage: 1,
    ammo: 30,
    maxAmmo: 30,
    accuracy: 0.05,
    sprintAccuracy: 0.2,
    crouchAccuracy: 0.01,
    bulletSpeed: 6,
    reloadTime: 2000
  },
  rifle: {
    name: "Rifle",
    fireRate: 150,
    damage: 1,
    ammo: 60,
    maxAmmo: 60,
    accuracy: 0.03,
    sprintAccuracy: 0.15,
    crouchAccuracy: 0.005,
    bulletSpeed: 8,
    reloadTime: 2500
  },
  shotgun: {
    name: "Shotgun",
    fireRate: 800,
    damage: 2,
    ammo: 20,
    maxAmmo: 20,
    accuracy: 0.3,
    sprintAccuracy: 0.5,
    crouchAccuracy: 0.2,
    bulletSpeed: 5,
    reloadTime: 3000,
    pellets: 5
  },
  sniper: {
    name: "Sniper",
    fireRate: 1500,
    damage: 3,
    ammo: 15,
    maxAmmo: 15,
    accuracy: 0.01,
    sprintAccuracy: 0.3,
    crouchAccuracy: 0.001,
    bulletSpeed: 12,
    reloadTime: 3500
  }
};

// Game state object to track all game data
export const gameState = {
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  obstacles: [],
  pickups: [],
  weaponPickups: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 1,
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
  R: 82,
  KEY_1: 49,
  KEY_2: 50,
  KEY_3: 51,
  KEY_4: 52
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
  gameState.weaponPickups = [];
  gameState.score = 0;
  gameState.enemiesKilled = 0;
  gameState.timeElapsed = 0;
  gameState.player = null;
  gameState.level.cameraX = 0;
  gameState.level.cameraY = 0;
  
  // Randomize mission type
  gameState.mission = Math.random() < 0.5 ? "elimination" : "extraction";
  gameState.requiredKills = 8 + gameState.currentLevel * 2 + Math.floor(Math.random() * 3);
}

export function nextLevel() {
  gameState.currentLevel++;
  resetGame();
}

export function resetToLevel1() {
  gameState.currentLevel = 1;
  resetGame();
}