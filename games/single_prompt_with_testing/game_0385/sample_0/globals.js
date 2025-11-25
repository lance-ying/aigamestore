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

export const PLAY_MODES = {
  TRAINING: "TRAINING",
  BATTLE: "BATTLE",
  EVENT: "EVENT"
};

export const FOOD_TYPES = {
  MEAT: { name: "Meat", hp: 5, attack: 3, defense: 1, cost: 10, color: [180, 70, 70] },
  FISH: { name: "Fish", hp: 4, attack: 2, defense: 2, cost: 8, color: [100, 150, 200] },
  BREAD: { name: "Bread", hp: 6, attack: 1, defense: 1, cost: 5, color: [220, 180, 120] },
  FRUIT: { name: "Fruit", hp: 3, attack: 1, defense: 3, cost: 6, color: [255, 150, 100] },
  GEM: { name: "Gem", hp: 2, attack: 5, defense: 3, cost: 20, color: [150, 100, 255] },
  ROCK: { name: "Rock", hp: 3, attack: 2, defense: 5, cost: 12, color: [120, 120, 120] },
  IRON: { name: "Iron", hp: 4, attack: 4, defense: 4, cost: 18, color: [160, 160, 180] },
  POTION: { name: "Potion", hp: 10, attack: 2, defense: 2, cost: 15, color: [200, 100, 255] },
  DRAGON_FRUIT: { name: "Dragon Fruit", hp: 8, attack: 6, defense: 4, cost: 30, color: [255, 100, 150] }
};

export const SKILLS = {
  TACKLE: { name: "Tackle", damage: 10, type: "attack", cost: 0 },
  FIRE_BREATH: { name: "Fire Breath", damage: 20, type: "attack", cost: 5 },
  HEAL: { name: "Heal", heal: 15, type: "heal", cost: 10 },
  DEFEND: { name: "Defend", defense: 10, type: "defense", cost: 5 },
  DRAGON_STRIKE: { name: "Dragon Strike", damage: 35, type: "attack", cost: 15 },
  TAIL_WHIP: { name: "Tail Whip", damage: 15, type: "attack", cost: 3 },
  ROAR: { name: "Roar", damage: 25, type: "attack", cost: 8 }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  playMode: PLAY_MODES.TRAINING,
  day: 1,
  maxDays: 365,
  gold: 100,
  selectedMenuItem: 0,
  menuItems: [],
  currentEnemy: null,
  battleTurn: "player",
  selectedSkill: 0,
  message: "",
  messageTimer: 0,
  defeatedEnemies: 0,
  bossDefeated: false,
  eventHistory: []
};

// Attach getGameState to window
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}