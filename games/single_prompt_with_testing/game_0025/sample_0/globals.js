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

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Fish types with rarity and value
export const FISH_TYPES = [
  { name: "Minnow", rarity: 0.4, value: 5, minRodLevel: 0, color: [200, 200, 200] },
  { name: "Carp", rarity: 0.25, value: 10, minRodLevel: 0, color: [180, 140, 80] },
  { name: "Bass", rarity: 0.15, value: 20, minRodLevel: 0, color: [100, 150, 100] },
  { name: "Trout", rarity: 0.1, value: 30, minRodLevel: 1, color: [200, 150, 180] },
  { name: "Pike", rarity: 0.05, value: 50, minRodLevel: 1, color: [150, 180, 150] },
  { name: "Salmon", rarity: 0.025, value: 75, minRodLevel: 2, color: [255, 150, 120] },
  { name: "Tuna", rarity: 0.015, value: 100, minRodLevel: 2, color: [100, 100, 150] },
  { name: "Swordfish", rarity: 0.008, value: 150, minRodLevel: 3, color: [150, 150, 200] },
  { name: "Shark", rarity: 0.005, value: 250, minRodLevel: 3, color: [120, 120, 140] },
  { name: "Golden Fish", rarity: 0.002, value: 500, minRodLevel: 4, color: [255, 215, 0] }
];

// Rod upgrades
export const ROD_UPGRADES = [
  { level: 0, name: "Basic Rod", cost: 0, castRange: 80, catchSpeed: 1.0 },
  { level: 1, name: "Wooden Rod", cost: 100, castRange: 100, catchSpeed: 1.2 },
  { level: 2, name: "Iron Rod", cost: 300, castRange: 120, catchSpeed: 1.4 },
  { level: 3, name: "Steel Rod", cost: 700, castRange: 140, catchSpeed: 1.6 },
  { level: 4, name: "Master Rod", cost: 1500, castRange: 160, catchSpeed: 2.0 }
];

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  money: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  fishingLine: null,
  fishJournal: new Set(),
  rodLevel: 0,
  shopOpen: false,
  lastCatch: null,
  totalFishCaught: 0,
  waterAreas: [],
  trees: [],
  rocks: []
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.score = 0;
  gameState.money = 0;
  gameState.fishingLine = null;
  gameState.fishJournal = new Set();
  gameState.rodLevel = 0;
  gameState.shopOpen = false;
  gameState.lastCatch = null;
  gameState.totalFishCaught = 0;
  gameState.entities = gameState.entities.filter(e => e.type === 'player');
  if (gameState.player) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT - 60;
    gameState.player.velocityX = 0;
    gameState.player.velocityY = 0;
  }
}