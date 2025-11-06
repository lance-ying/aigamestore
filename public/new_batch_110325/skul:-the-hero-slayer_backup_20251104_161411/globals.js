// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  enemies: [],
  items: [],
  skulls: [],
  projectiles: [],
  particles: [],
  score: 0,
  roomsCleared: 0,
  darkQuartz: 0,
  permanentDarkQuartz: 0,
  currentRoom: 0,
  enemiesInRoom: 0,
  roomComplete: false,
  transitionTimer: 0,
  keysPressed: {},
  lastAttackTime: 0,
  lastDashTime: 0,
  positionHistory: []
};

// Skull types with different abilities
export const SKULL_TYPES = {
  BASIC: {
    name: "Basic Skull",
    attackSpeed: 400,
    damage: 10,
    color: [200, 200, 200],
    projectileSpeed: 6,
    projectileSize: 8,
    special: "Fast basic attacks"
  },
  FIRE: {
    name: "Fire Skull",
    attackSpeed: 600,
    damage: 20,
    color: [255, 100, 0],
    projectileSpeed: 8,
    projectileSize: 12,
    special: "High damage fire projectiles"
  },
  ICE: {
    name: "Ice Skull",
    attackSpeed: 800,
    damage: 15,
    color: [100, 200, 255],
    projectileSpeed: 5,
    projectileSize: 10,
    special: "Slows enemies on hit"
  },
  LIGHTNING: {
    name: "Lightning Skull",
    attackSpeed: 300,
    damage: 8,
    color: [255, 255, 100],
    projectileSpeed: 12,
    projectileSize: 6,
    special: "Rapid lightning bolts"
  },
  SHADOW: {
    name: "Shadow Skull",
    attackSpeed: 500,
    damage: 18,
    color: [100, 0, 150],
    projectileSpeed: 7,
    projectileSize: 10,
    special: "Piercing shadow projectiles"
  }
};

// Item types that drop from enemies
export const ITEM_TYPES = {
  ATTACK_UP: { name: "Attack Up", stat: "attack", value: 5, color: [255, 100, 100] },
  SPEED_UP: { name: "Speed Up", stat: "speed", value: 0.5, color: [100, 255, 100] },
  HEALTH_UP: { name: "Health Up", stat: "maxHealth", value: 20, color: [255, 100, 255] },
  CRIT_CHANCE: { name: "Crit Chance", stat: "critChance", value: 5, color: [255, 255, 100] },
  DAMAGE_UP: { name: "Damage Up", stat: "damageMultiplier", value: 0.1, color: [255, 150, 0] }
};

// Constants
export const PLAYER_SIZE = 20;
export const ENEMY_SIZE = 18;
export const ITEM_SIZE = 12;
export const SKULL_DROP_SIZE = 15;
export const GRAVITY = 0.5;
export const GROUND_Y = 350;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 4;
export const DASH_SPEED = 12;
export const DASH_COOLDOWN = 1000;
export const ATTACK_RANGE = 300;
export const ROOMS_TO_WIN = 5;