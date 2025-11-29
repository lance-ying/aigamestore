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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";
export const CONTROL_TEST_4 = "TEST_4";
export const CONTROL_TEST_5 = "TEST_5";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_R = 82;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game state object
export const gameState = {
  player: null,
  enemies: [],
  bullets: [],
  cover: [],
  utilities: [],
  particles: [],
  entities: [],
  
  // Player stats
  playerHealth: 100,
  playerMaxHealth: 100,
  playerAmmo: 30,
  playerGrenades: 3,
  playerMines: 2,
  
  // Weapons
  currentWeapon: "rifle", // "rifle", "pistol"
  weapons: {
    rifle: { damage: 15, fireRate: 10, range: 250, ammo: 30, maxAmmo: 30 },
    pistol: { damage: 20, fireRate: 8, range: 180, ammo: 12, maxAmmo: 12, silenced: true }
  },
  
  // Game progress
  score: 0,
  enemiesKilled: 0,
  totalEnemies: 0,
  missionComplete: false,
  
  // Stealth
  inStealth: false,
  detectionLevel: 0,
  
  // Game state
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  frameCount: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Mission data
  currentMission: 1,
  missionStars: 0
};

// Initialize function to reset game state
export function initializeGameState() {
  gameState.player = null;
  gameState.enemies = [];
  gameState.bullets = [];
  gameState.cover = [];
  gameState.utilities = [];
  gameState.particles = [];
  gameState.entities = [];
  
  gameState.playerHealth = 100;
  gameState.playerMaxHealth = 100;
  gameState.playerAmmo = 30;
  gameState.playerGrenades = 3;
  gameState.playerMines = 2;
  
  gameState.currentWeapon = "rifle";
  gameState.weapons.rifle.ammo = 30;
  gameState.weapons.pistol.ammo = 12;
  
  gameState.score = 0;
  gameState.enemiesKilled = 0;
  gameState.totalEnemies = 0;
  gameState.missionComplete = false;
  
  gameState.inStealth = false;
  gameState.detectionLevel = 0;
  
  gameState.frameCount = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  gameState.currentMission = 1;
  gameState.missionStars = 0;
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}