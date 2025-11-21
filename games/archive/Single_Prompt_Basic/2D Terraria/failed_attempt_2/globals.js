// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;
export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 50;
export const GRAVITY = 0.5;
export const JUMP_FORCE = 10;
export const MOVE_SPEED = 3;
export const DAY_LENGTH = 1800; // in frames (30 seconds)

// Game phases
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Control modes
export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Block types
export const BLOCK_TYPES = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  IRON: 3,
  GOLD: 4,
  WOOD: 5,
  LEAVES: 6,
  CRAFTING_TABLE: 7,
  PORTAL: 8
};

// Item types (for inventory)
export const ITEM_TYPES = {
  DIRT: 1,
  STONE: 2,
  IRON: 3,
  GOLD: 4,
  WOOD: 5,
  WOODEN_PICKAXE: 6,
  STONE_PICKAXE: 7,
  IRON_PICKAXE: 8,
  GOLD_PICKAXE: 9,
  WOODEN_SWORD: 10,
  STONE_SWORD: 11,
  IRON_SWORD: 12,
  GOLD_SWORD: 13,
  CRAFTING_TABLE: 14,
  PORTAL: 15
};

// Tool tiers and their mining powers
export const TOOL_TIERS = {
  HAND: { power: 1, damage: 1 },
  WOODEN_PICKAXE: { power: 2, damage: 2 },
  STONE_PICKAXE: { power: 3, damage: 3 },
  IRON_PICKAXE: { power: 4, damage: 4 },
  GOLD_PICKAXE: { power: 5, damage: 5 },
  WOODEN_SWORD: { power: 1, damage: 3 },
  STONE_SWORD: { power: 1, damage: 4 },
  IRON_SWORD: { power: 1, damage: 5 },
  GOLD_SWORD: { power: 1, damage: 6 }
};

// Block hardness (mining difficulty)
export const BLOCK_HARDNESS = {
  [BLOCK_TYPES.DIRT]: 1,
  [BLOCK_TYPES.WOOD]: 2,
  [BLOCK_TYPES.LEAVES]: 1,
  [BLOCK_TYPES.STONE]: 3,
  [BLOCK_TYPES.IRON]: 4,
  [BLOCK_TYPES.GOLD]: 5,
  [BLOCK_TYPES.CRAFTING_TABLE]: 2,
  [BLOCK_TYPES.PORTAL]: 10
};

// Crafting recipes
export const CRAFTING_RECIPES = [
  {
    result: ITEM_TYPES.WOODEN_PICKAXE,
    ingredients: [{ type: ITEM_TYPES.WOOD, count: 5 }],
    station: null // null means craftable by hand
  },
  {
    result: ITEM_TYPES.WOODEN_SWORD,
    ingredients: [{ type: ITEM_TYPES.WOOD, count: 3 }],
    station: null
  },
  {
    result: ITEM_TYPES.STONE_PICKAXE,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 3 },
      { type: ITEM_TYPES.STONE, count: 5 }
    ],
    station: null
  },
  {
    result: ITEM_TYPES.STONE_SWORD,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 2 },
      { type: ITEM_TYPES.STONE, count: 4 }
    ],
    station: null
  },
  {
    result: ITEM_TYPES.CRAFTING_TABLE,
    ingredients: [{ type: ITEM_TYPES.WOOD, count: 10 }],
    station: null
  },
  {
    result: ITEM_TYPES.IRON_PICKAXE,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 3 },
      { type: ITEM_TYPES.IRON, count: 5 }
    ],
    station: BLOCK_TYPES.CRAFTING_TABLE
  },
  {
    result: ITEM_TYPES.IRON_SWORD,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 2 },
      { type: ITEM_TYPES.IRON, count: 4 }
    ],
    station: BLOCK_TYPES.CRAFTING_TABLE
  },
  {
    result: ITEM_TYPES.GOLD_PICKAXE,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 3 },
      { type: ITEM_TYPES.GOLD, count: 5 }
    ],
    station: BLOCK_TYPES.CRAFTING_TABLE
  },
  {
    result: ITEM_TYPES.GOLD_SWORD,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 2 },
      { type: ITEM_TYPES.GOLD, count: 4 }
    ],
    station: BLOCK_TYPES.CRAFTING_TABLE
  },
  {
    result: ITEM_TYPES.PORTAL,
    ingredients: [
      { type: ITEM_TYPES.WOOD, count: 10 },
      { type: ITEM_TYPES.STONE, count: 15 },
      { type: ITEM_TYPES.IRON, count: 10 },
      { type: ITEM_TYPES.GOLD, count: 5 }
    ],
    station: BLOCK_TYPES.CRAFTING_TABLE
  }
];

// Initialize game state
export const gameState = {
  player: null,
  entities: [],
  world: [],
  inventory: [],
  selectedItemIndex: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  camera: { x: 0, y: 0 },
  time: 0, // 0-DAY_LENGTH, used for day/night cycle
  score: 0,
  dayCount: 1,
  nearCraftingTable: false,
  lastPosition: { x: 0, y: 0 }, // For detecting when player is stuck
  stuckCounter: 0
};

export function getGameState() {
  return gameState;
}