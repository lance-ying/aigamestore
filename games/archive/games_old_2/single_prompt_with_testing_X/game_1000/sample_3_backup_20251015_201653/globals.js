// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const BLOCK_SIZE = 20;
export const WORLD_WIDTH = 200; // blocks
export const WORLD_HEIGHT = 60; // blocks

export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 30;

export const gameState = {
  player: null,
  entities: [],
  blocks: [], // 2D array of blocks
  camera: { x: 0, y: 0 },
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", "TEST_4"
  
  // Game time
  time: 0, // 0-1000, day/night cycle
  dayLength: 1000,
  
  // Player stats
  playerHealth: 100,
  playerMaxHealth: 100,
  playerInventory: {},
  
  // Crafting
  craftingMenuOpen: false,
  selectedRecipe: 0,
  
  // World generation
  worldSeed: 42,
  spawnX: 0,
  spawnY: 0,
  
  // Progression
  bossesDefeated: [],
  unlockedRecipes: ["wooden_pickaxe", "wooden_sword", "stone_pickaxe", "stone_sword"],
  
  // Combat
  enemies: [],
  projectiles: [],
  
  // Building
  selectedBlockType: "dirt",
  
  // Testing
  testStartTime: 0,
  testPositionHistory: [],
};

export function getGameState() {
  return gameState;
}

// Make globally accessible
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Block types
export const BLOCK_TYPES = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  WOOD: 3,
  IRON_ORE: 4,
  GOLD_ORE: 5,
  GRASS: 6,
  LEAF: 7,
};

export const BLOCK_COLORS = {
  [BLOCK_TYPES.DIRT]: [139, 90, 43],
  [BLOCK_TYPES.STONE]: [128, 128, 128],
  [BLOCK_TYPES.WOOD]: [101, 67, 33],
  [BLOCK_TYPES.IRON_ORE]: [192, 192, 192],
  [BLOCK_TYPES.GOLD_ORE]: [255, 215, 0],
  [BLOCK_TYPES.GRASS]: [34, 139, 34],
  [BLOCK_TYPES.LEAF]: [50, 205, 50],
};

export const BLOCK_NAMES = {
  [BLOCK_TYPES.DIRT]: "dirt",
  [BLOCK_TYPES.STONE]: "stone",
  [BLOCK_TYPES.WOOD]: "wood",
  [BLOCK_TYPES.IRON_ORE]: "iron_ore",
  [BLOCK_TYPES.GOLD_ORE]: "gold_ore",
  [BLOCK_TYPES.GRASS]: "grass",
  [BLOCK_TYPES.LEAF]: "leaf",
};

export const BLOCK_HARDNESS = {
  [BLOCK_TYPES.DIRT]: 1,
  [BLOCK_TYPES.STONE]: 3,
  [BLOCK_TYPES.WOOD]: 2,
  [BLOCK_TYPES.IRON_ORE]: 5,
  [BLOCK_TYPES.GOLD_ORE]: 7,
  [BLOCK_TYPES.GRASS]: 1,
  [BLOCK_TYPES.LEAF]: 0.5,
};

// Items and crafting
export const ITEMS = {
  WOODEN_PICKAXE: "wooden_pickaxe",
  STONE_PICKAXE: "stone_pickaxe",
  IRON_PICKAXE: "iron_pickaxe",
  WOODEN_SWORD: "wooden_sword",
  STONE_SWORD: "stone_sword",
  IRON_SWORD: "iron_sword",
  IRON_ARMOR: "iron_armor",
};

export const CRAFTING_RECIPES = {
  wooden_pickaxe: { wood: 3 },
  stone_pickaxe: { wood: 2, stone: 3 },
  iron_pickaxe: { wood: 2, iron_ore: 3 },
  wooden_sword: { wood: 2 },
  stone_sword: { wood: 1, stone: 2 },
  iron_sword: { wood: 1, iron_ore: 2 },
  iron_armor: { iron_ore: 5 },
};

export const TOOL_POWER = {
  none: 1,
  wooden_pickaxe: 2,
  stone_pickaxe: 3,
  iron_pickaxe: 5,
};

export const WEAPON_DAMAGE = {
  none: 5,
  wooden_sword: 10,
  stone_sword: 15,
  iron_sword: 25,
};