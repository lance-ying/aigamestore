// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  enemies: [],
  innocents: [],
  bullets: [],
  particles: [],
  score: 0,
  level: 1,
  enemiesKilled: 0,
  totalEnemies: 0,
  frameCount: 0,
  lastSpawnTime: 0,
  weaponUnlocks: [true, false, false], // pistol, shotgun, rifle
  currentWeapon: 0
};

// Player constants
export const PLAYER_SIZE = 20;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4.0;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_STAMINA_DRAIN = 0.8;
export const PLAYER_STAMINA_REGEN = 0.4;
export const PLAYER_MAX_HEALTH = 100;

// Weapon constants
export const WEAPONS = [
  { name: "PISTOL", damage: 15, fireRate: 15, bulletSpeed: 8, spread: 0, ammo: Infinity, color: [200, 200, 200] },
  { name: "SHOTGUN", damage: 10, fireRate: 40, bulletSpeed: 7, spread: 0.3, pellets: 5, ammo: 30, color: [180, 140, 100] },
  { name: "RIFLE", damage: 25, fireRate: 8, bulletSpeed: 12, spread: 0, ammo: 90, color: [150, 180, 150] }
];

// Enemy constants
export const ENEMY_SIZE = 18;
export const ENEMY_SPEED = 1.2;
export const ENEMY_HEALTH = 30;
export const ENEMY_DAMAGE = 5;
export const ENEMY_SHOOT_COOLDOWN = 80;
export const ENEMY_DETECTION_RANGE = 300;

// Innocent constants
export const INNOCENT_SIZE = 16;
export const INNOCENT_SPEED = 0.8;
export const INNOCENT_PANIC_SPEED = 2.0;
export const INNOCENT_PANIC_RANGE = 150;

// Particle constants
export const PARTICLE_LIFETIME = 30;

// Level progression
export const LEVEL_ENEMY_COUNTS = [5, 8, 12, 15, 20];
export const LEVEL_INNOCENT_COUNTS = [3, 4, 5, 6, 8];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.innocents = [];
  gameState.bullets = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.level = 1;
  gameState.enemiesKilled = 0;
  gameState.totalEnemies = 0;
  gameState.lastSpawnTime = 0;
  gameState.weaponUnlocks = [true, false, false];
  gameState.currentWeapon = 0;
}