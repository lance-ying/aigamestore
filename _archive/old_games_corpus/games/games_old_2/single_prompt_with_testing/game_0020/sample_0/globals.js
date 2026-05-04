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

export const WEAPON_DATA = [
  { name: "Fist", damage: 5, cost: 0, unlocked: true, attackSpeed: 30, color: [255, 180, 120] },
  { name: "Stick", damage: 8, cost: 50, unlocked: false, attackSpeed: 25, color: [139, 69, 19] },
  { name: "Sword", damage: 12, cost: 150, unlocked: false, attackSpeed: 20, color: [192, 192, 192] },
  { name: "Hammer", damage: 20, cost: 300, unlocked: false, attackSpeed: 40, color: [128, 128, 128] },
  { name: "Axe", damage: 18, cost: 400, unlocked: false, attackSpeed: 35, color: [160, 82, 45] },
  { name: "Spear", damage: 15, cost: 250, unlocked: false, attackSpeed: 18, color: [205, 133, 63] },
  { name: "Mace", damage: 22, cost: 500, unlocked: false, attackSpeed: 38, color: [105, 105, 105] },
  { name: "Dagger", damage: 10, cost: 200, unlocked: false, attackSpeed: 12, color: [220, 220, 220] },
  { name: "Club", damage: 14, cost: 180, unlocked: false, attackSpeed: 28, color: [101, 67, 33] },
  { name: "Katana", damage: 25, cost: 700, unlocked: false, attackSpeed: 22, color: [255, 215, 0] }
];

export const OBJECTIVES = [
  { text: "Deal 500 total damage", requirement: 500, type: "damage", reward: 100 },
  { text: "Hit boss 50 times", requirement: 50, type: "hits", reward: 80 },
  { text: "Defeat boss in under 20 seconds", requirement: 1200, type: "time", reward: 150 },
  { text: "Use 5 different weapons", requirement: 5, type: "weapons", reward: 120 },
  { name: "Rubber Chicken", text: "Hit boss 30 times with Stick", requirement: 30, type: "weapon_hits", weapon: "Stick", reward: 200 }
];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  player: null,
  boss: null,
  entities: [],
  currentStage: 1,
  maxStages: 7,
  currency: 0,
  totalDamage: 0,
  totalHits: 0,
  weaponsUsed: new Set(),
  weaponHits: {},
  currentWeaponIndex: 0,
  weapons: JSON.parse(JSON.stringify(WEAPON_DATA)),
  objectives: [],
  completedObjectives: new Set(),
  attackCooldown: 0,
  damageNumbers: [],
  particles: [],
  stageStartTime: 0,
  shopMode: false
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

export function setControlMode(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
}

window.setControlMode = setControlMode;