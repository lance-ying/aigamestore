// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  SHOP: "SHOP",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const ITEM_TYPES = {
  GOLD_SMALL: { value: 100, weight: 1, color: [255, 215, 0], size: 15, name: "Small Gold" },
  GOLD_MEDIUM: { value: 250, weight: 2, color: [255, 200, 0], size: 20, name: "Medium Gold" },
  GOLD_LARGE: { value: 500, weight: 4, color: [255, 185, 0], size: 30, name: "Large Gold" },
  DIAMOND: { value: 600, weight: 1, color: [0, 255, 255], size: 12, name: "Diamond" },
  ROCK: { value: 10, weight: 3, color: [100, 100, 100], size: 18, name: "Rock" },
  MYSTERY: { value: 0, weight: 1, color: [255, 0, 255], size: 16, name: "Mystery Bag" }
};

export const SHOP_ITEMS = {
  DYNAMITE: { cost: 150, name: "Dynamite", description: "Destroy unwanted items" },
  STRENGTH: { cost: 200, name: "Strength Potion", description: "+25% retrieval speed" }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  level: 1,
  timeRemaining: 60,
  goalAmount: 500,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  claw: null,
  items: [],
  inventory: {
    dynamite: 0,
    strength: 0
  },
  shopSelection: 0,
  strengthActive: false,
  levelMoney: 0,
  totalMoney: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;