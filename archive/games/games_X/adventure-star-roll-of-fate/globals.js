// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const CONTROL_MODE = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const GRID_CONFIG = {
  tileSize: 38,
  offsetX: 30,
  offsetY: 105
};

export const TILE_TYPES = {
  EMPTY: "EMPTY",
  WALL: "WALL",
  EXIT: "EXIT",
  EVENT_TREASURE: "EVENT_TREASURE",
  EVENT_TRAP: "EVENT_TRAP",
  EVENT_ENEMY: "EVENT_ENEMY",
  EVENT_NPC: "EVENT_NPC",
  EVENT_MYSTERY: "EVENT_MYSTERY",
  WEAPON: "WEAPON"
};

export const WEAPONS = {
  PISTOL: {
    name: "Pistol",
    damage: 1,
    speed: 3,
    cost: 0,
    icon: "🔫",
    color: [255, 255, 100]
  },
  SWORD: {
    name: "Sword",
    damage: 2,
    speed: 3,
    cost: 500,
    icon: "⚔️",
    color: [200, 200, 255]
  },
  SHOTGUN: {
    name: "Shotgun",
    damage: 2,
    speed: 4,
    cost: 800,
    icon: "💥",
    color: [255, 150, 50]
  },
  RIFLE: {
    name: "Rifle",
    damage: 3,
    speed: 2,
    cost: 1500,
    icon: "🎯",
    color: [100, 255, 255]
  },
  LASER: {
    name: "Laser Gun",
    damage: 4,
    speed: 1,
    cost: 2500,
    icon: "⚡",
    color: [255, 100, 255]
  }
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [], // Array of moving Enemy instances
  projectiles: [], // Array of active projectiles
  score: 0,
  gamePhase: GAME_PHASE.START,
  controlMode: CONTROL_MODE.HUMAN,
  currentLevel: 1,
  maxLevel: 13,
  hp: 100,
  maxHp: 100,
  currentMap: null,
  eventMessage: "",
  eventMessageTimer: 0,
  eventMessageDuration: 120,
  levelTransitionTimer: 0,
  levelTransitionDuration: 90,
  playerDamageFlash: 0,
  highScore: 0,
  luckFactor: 1.0,
  luck: 50,
  needsInteraction: false,
  testModeActionQueue: [],
  testModeActionIndex: 0,
  weaponPower: 1,
  currentWeapon: "PISTOL",
  ownedWeapons: ["PISTOL"],
  shopOpen: false
};

// Load high score from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const stored = localStorage.getItem('adventureStarHighScore');
  if (stored) {
    gameState.highScore = parseInt(stored, 10) || 0;
  }
}

export function saveHighScore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('adventureStarHighScore', gameState.highScore.toString());
  }
}