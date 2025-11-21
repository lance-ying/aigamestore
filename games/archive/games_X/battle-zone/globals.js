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

// Level difficulty configurations
export const LEVEL_CONFIGS = {
  1: { requiredKills: 6, numEnemies: 8, numObstacles: 15, healthPickups: 6, ammoPickups: 8 },
  2: { requiredKills: 8, numEnemies: 10, numObstacles: 18, healthPickups: 7, ammoPickups: 10 },
  3: { requiredKills: 10, numEnemies: 12, numObstacles: 22, healthPickups: 8, ammoPickups: 12 },
  4: { requiredKills: 12, numEnemies: 15, numObstacles: 28, healthPickups: 8, ammoPickups: 14 },
  5: { requiredKills: 15, numEnemies: 18, numObstacles: 32, healthPickups: 9, ammoPickups: 16 },
  6: { requiredKills: 17, numEnemies: 21, numObstacles: 36, healthPickups: 10, ammoPickups: 18 },
  7: { requiredKills: 20, numEnemies: 25, numObstacles: 42, healthPickups: 10, ammoPickups: 20 },
  8: { requiredKills: 24, numEnemies: 30, numObstacles: 48, healthPickups: 11, ammoPickups: 22 },
  9: { requiredKills: 28, numEnemies: 35, numObstacles: 55, healthPickups: 12, ammoPickups: 25 }
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
  
  // Get level config or default to level 9 config if beyond
  const levelConfig = LEVEL_CONFIGS[gameState.currentLevel] || LEVEL_CONFIGS[9];
  gameState.requiredKills = levelConfig.requiredKills;
}

export function nextLevel() {
  gameState.currentLevel++;
  resetGame();
}

export function resetToLevel1() {
  gameState.currentLevel = 1;
  resetGame();
}