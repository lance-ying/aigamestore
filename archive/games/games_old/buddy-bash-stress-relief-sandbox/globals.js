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
  score: 0,
  bucks: 1000,
  currentLevel: 1,
  levelTargetScore: 1000,
  levelTimeRemaining: 180,
  activeWeaponIndex: 0,
  currentOutfitIndex: 0,
  unlockedWeapons: [0, 1],
  unlockedOutfits: [0],
  comboMultiplier: 1,
  lastActionTime: 0,
  usedWeapons: new Set(),
  buddy: null,
  projectiles: [],
  particles: [],
  highScores: [0, 0, 0, 0, 0],
  framesSinceAction: 0,
  airborneFrames: 0,
  lastBuddyY: 0
};

export const WEAPONS = [
  { name: "Hand", icon: "👊", damage: 5, cooldown: 10, unlockCost: 0 },
  { name: "Pistol", icon: "🔫", damage: 10, cooldown: 15, unlockCost: 0 },
  { name: "Shotgun", icon: "💥", damage: 25, cooldown: 30, unlockCost: 500 },
  { name: "Bomb", icon: "💣", damage: 50, cooldown: 60, unlockCost: 1000 },
  { name: "Rocket", icon: "🚀", damage: 75, cooldown: 45, unlockCost: 2000 }
];

export const OUTFITS = [
  { name: "Default", color: [200, 200, 200], unlockCost: 0 },
  { name: "Red", color: [255, 100, 100], unlockCost: 300 },
  { name: "Blue", color: [100, 150, 255], unlockCost: 300 },
  { name: "Gold", color: [255, 215, 0], unlockCost: 800 }
];

export const LEVELS = [
  { name: "Training Ground", targetScore: 1000, timeLimit: 180, gravity: 0.5 },
  { name: "Buddy's Bistro", targetScore: 3500, timeLimit: 150, gravity: 0.5 },
  { name: "Zero-G Chamber", targetScore: 7000, timeLimit: 180, gravity: 0.1 },
  { name: "Demolition Zone", targetScore: 12000, timeLimit: 120, gravity: 0.5 },
  { name: "Ultimate Gauntlet", targetScore: 20000, timeLimit: 100, gravity: 0.3 }
];