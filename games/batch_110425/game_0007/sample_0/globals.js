// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Block types
export const BLOCK_GRASS = "grass";
export const BLOCK_DIRT = "dirt";
export const BLOCK_STONE = "stone";
export const BLOCK_WOOD = "wood";
export const BLOCK_EMPTY = "empty";

// Material types
export const MATERIAL_DIRT = "dirt";
export const MATERIAL_STONE = "stone";
export const MATERIAL_WOOD = "wood";

// Entity types
export const ENTITY_PLAYER = "player";
export const ENTITY_MONSTER = "monster";
export const ENTITY_NPC = "npc";

// Crafting recipes
export const RECIPES = {
  wooden_sword: { materials: { wood: 3 }, category: "tool" },
  wooden_wall: { materials: { wood: 2 }, category: "building" },
  stone_block: { materials: { stone: 1 }, category: "building" },
  door: { materials: { wood: 4 }, category: "building" }
};

// Grid settings
export const TILE_SIZE = 40;
export const WORLD_WIDTH = 20;
export const WORLD_HEIGHT = 15;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  world: null,
  inventory: {},
  craftingOpen: false,
  selectedRecipe: null,
  quests: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  time: 0,
  camera: { x: 0, y: 0 },
  breakingBlock: null,
  breakProgress: 0,
  placingMode: false,
  selectedBlockType: BLOCK_WOOD,
  monsterSpawnTimer: 0,
  questsCompleted: 0
};

// Quest definitions
export const QUEST_DEFINITIONS = [
  {
    id: "gather_materials",
    title: "Gather Basic Materials",
    description: "Collect 10 wood and 10 stone",
    objectives: {
      wood: 10,
      stone: 10
    },
    reward: 50,
    completed: false
  },
  {
    id: "craft_sword",
    title: "Craft a Wooden Sword",
    description: "Craft a wooden sword to defend yourself",
    objectives: {
      crafted_wooden_sword: 1
    },
    reward: 100,
    completed: false
  },
  {
    id: "build_shelter",
    title: "Build a Shelter",
    description: "Place 20 blocks to build a shelter",
    objectives: {
      blocks_placed: 20
    },
    reward: 150,
    completed: false
  },
  {
    id: "defeat_monsters",
    title: "Defend the Settlement",
    description: "Defeat 5 monsters",
    objectives: {
      monsters_defeated: 5
    },
    reward: 200,
    completed: false
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}