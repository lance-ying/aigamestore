// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 20;
export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 60;
export const GRAVITY = 0.5;
export const JUMP_FORCE = 10;
export const MOVE_SPEED = 3;
export const DAY_LENGTH = 10800; // frames (3 minutes at 60fps - much longer day/night cycle)

// Item and enemy types
export const ITEM_TYPES = {
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  WOOD_PICKAXE: 'wood_pickaxe',
  STONE_PICKAXE: 'stone_pickaxe',
  IRON_PICKAXE: 'iron_pickaxe',
  WOOD_AXE: 'wood_axe',
  STONE_AXE: 'stone_axe',
  IRON_AXE: 'iron_axe',
  WOOD_SWORD: 'wood_sword',
  STONE_SWORD: 'stone_sword',
  IRON_SWORD: 'iron_sword',
  GOLD_SWORD: 'gold_sword',
  WOODEN_PLATFORM: 'wooden_platform',
  WOODEN_WALL: 'wooden_wall',
  STONE_WALL: 'stone_wall',
  DIRT_BLOCK: 'dirt_block', // NEW
  IRON_BLOCK: 'iron_block', // NEW
  GOLD_BLOCK: 'gold_block'  // NEW
};

export const ENEMY_TYPES = {
  SLIME: 'slime',
  ZOMBIE: 'zombie',
  FLYING_EYE: 'flying_eye',
  BOSS: 'boss'
};

export const TILE_TYPES = {
  AIR: 0,
  DIRT: 1,
  GRASS: 2,
  STONE: 3,
  WOOD: 4,
  IRON_ORE: 5,
  GOLD_ORE: 6,
  WOODEN_PLATFORM: 7,
  WOODEN_WALL: 8,
  STONE_WALL: 9
};

export const TOOL_TYPES = {
  PICKAXE: 'pickaxe',
  AXE: 'axe',
  SWORD: 'sword'
};

export const CRAFTING_RECIPES = [
  { result: ITEM_TYPES.WOOD_PICKAXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 3 }] },
  { result: ITEM_TYPES.STONE_PICKAXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.STONE, amount: 3 }] },
  { result: ITEM_TYPES.IRON_PICKAXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.IRON, amount: 3 }] },
  { result: ITEM_TYPES.WOOD_AXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 3 }] },
  { result: ITEM_TYPES.STONE_AXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.STONE, amount: 3 }] },
  { result: ITEM_TYPES.IRON_AXE, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.IRON, amount: 3 }] },
  { result: ITEM_TYPES.WOOD_SWORD, requirements: [{ type: ITEM_TYPES.WOOD, amount: 5 }] },
  { result: ITEM_TYPES.STONE_SWORD, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.STONE, amount: 5 }] },
  { result: ITEM_TYPES.IRON_SWORD, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.IRON, amount: 5 }] },
  { result: ITEM_TYPES.GOLD_SWORD, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }, { type: ITEM_TYPES.GOLD, amount: 5 }] },
  { result: ITEM_TYPES.WOODEN_PLATFORM, requirements: [{ type: ITEM_TYPES.WOOD, amount: 2 }] },
  { result: ITEM_TYPES.WOODEN_WALL, requirements: [{ type: ITEM_TYPES.WOOD, amount: 4 }] },
  { result: ITEM_TYPES.STONE_WALL, requirements: [{ type: ITEM_TYPES.STONE, amount: 4 }] }
];

// Game state object
export const gameState = {
  player: null,
  entities: [],
  world: [],
  camera: { x: 0, y: 0 },
  inventory: {},
  selectedTool: TOOL_TYPES.PICKAXE,
  selectedBlock: ITEM_TYPES.WOODEN_PLATFORM, // Start with a block selected
  dayTime: 0,
  isDay: true,
  score: 0,
  health: 100,
  maxHealth: 100,
  gamePhase: "START",
  controlMode: "HUMAN",
  bossDefeated: false,
  bossSpawned: false,
  lastActionTime: 0,
  actionHistory: [],
};

// Get game state function
export function getGameState() {
  return gameState;
}

// Set control mode function
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                        document.getElementById('humanModeBtn');
  if (activeButton) {
    activeButton.classList.add('active');
  }
}