// globals.js - Game constants and state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 0,
  currentLevel: 1,
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  timeRemaining: 60,
  lastFrameTime: 0,
  targetScore: 1000,
  selectedWeaponIndex: 0,
  unlockedWeapons: [0, 1], // Start with kick and pistol
  comboCount: 0,
  comboTimer: 0,
  lastHitTime: 0,
  particles: [],
  projectiles: [],
  isPrecisionMode: false,
  buddyVelocity: { x: 0, y: 0 }
};

export const LEVELS = [
  { level: 1, targetScore: 1000, timeLimit: 60, name: "Basic Training Room" },
  { level: 2, targetScore: 2500, timeLimit: 90, name: "Obstacle Course" },
  { level: 3, targetScore: 5000, timeLimit: 120, name: "Gravity Chamber" },
  { level: 4, targetScore: 7500, timeLimit: 150, name: "Weapon Mastery Arena" }
];

export const WEAPONS = [
  { name: "Kick", cost: 0, unlocked: true },
  { name: "Pistol", cost: 0, unlocked: true },
  { name: "Grenade", cost: 100, unlocked: false },
  { name: "Laser", cost: 200, unlocked: false },
  { name: "Black Hole", cost: 300, unlocked: false }
];