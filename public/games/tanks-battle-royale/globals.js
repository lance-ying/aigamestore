// globals.js - Global constants and game state

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
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  pickups: [],
  particles: [],
  obstacles: [],
  score: 0,
  xp: 0,
  level: 1,
  kills: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  waveNumber: 1,
  enemiesKilledThisWave: 0,
  framesSinceLastSpawn: 0,
  spawnCooldown: 180,
  timeElapsed: 0
};

export const PLAYER_CONFIG = {
  maxHealth: 150,
  moveSpeed: 2,
  sprintMultiplier: 2,
  turnSpeed: 0.05,
  weaponDamage: 25,
  fireRate: 15,
  maxAmmo: 30,
  reloadTime: 90
};

export const ENEMY_CONFIG = {
  maxHealth: 40,
  moveSpeed: 1.2,
  turnSpeed: 0.03,
  detectionRange: 250,
  attackRange: 200,
  attackDamage: 6,
  fireRate: 60,
  xpValue: 25
};

export const PICKUP_TYPES = {
  HEALTH: "HEALTH",
  AMMO: "AMMO",
  WEAPON: "WEAPON"
};

export const WEAPON_TYPES = {
  PISTOL: {
    name: "Pistol",
    damage: 25,
    fireRate: 15,
    maxAmmo: 30,
    reloadTime: 90,
    projectileCount: 1,
    spread: 0,
    color: [255, 220, 100]
  },
  SHOTGUN: {
    name: "Shotgun",
    damage: 15,
    fireRate: 35,
    maxAmmo: 12,
    reloadTime: 120,
    projectileCount: 5,
    spread: 0.3,
    color: [255, 150, 50]
  },
  RIFLE: {
    name: "Rifle",
    damage: 35,
    fireRate: 8,
    maxAmmo: 40,
    reloadTime: 100,
    projectileCount: 1,
    spread: 0,
    color: [100, 200, 255]
  },
  SMG: {
    name: "SMG",
    damage: 18,
    fireRate: 6,
    maxAmmo: 50,
    reloadTime: 80,
    projectileCount: 1,
    spread: 0.1,
    color: [255, 100, 200]
  }
};

export const XP_TO_LEVEL = [0, 50, 125, 225, 350, 500];

window.getGameState = function() {
  return gameState;
};