// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GAME_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// World settings
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;
export const TILE_SIZE = 40;

// Player stats
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_SPEED = 2;
export const PLAYER_SPRINT_MULTIPLIER = 1.8;
export const STAMINA_SPRINT_COST = 0.5;
export const STAMINA_ATTACK_COST = 15;
export const STAMINA_REGEN_RATE = 0.3;
export const HEALTH_REGEN_RATE = 0.05;
export const HEALTH_REGEN_DELAY = 300; // frames

// Inventory
export const MAX_INVENTORY_SLOTS = 100;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  destructibles: [],
  enemies: [],
  outposts: [],
  craftingStations: [],
  score: 0,
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  camera: { x: 0, y: 0 },
  clearedZones: [],
  inventory: {
    wood: 0,
    stone: 0,
    metal: 0,
    fabric: 0
  },
  equippedWeapon: "fists",
  equippedTool: "hands",
  unlockedRecipes: ["wooden_club", "stone_axe"],
  combatTimer: 0,
  escapePointActivated: false
};

// Weapon stats
export const WEAPONS = {
  fists: { damage: 5, range: 30, attackSpeed: 20 },
  wooden_club: { damage: 12, range: 35, attackSpeed: 25 },
  iron_sword: { damage: 25, range: 40, attackSpeed: 20 },
  steel_axe: { damage: 35, range: 38, attackSpeed: 30 }
};

// Tool stats
export const TOOLS = {
  hands: { efficiency: 1 },
  stone_axe: { efficiency: 2 },
  iron_pickaxe: { efficiency: 3 },
  steel_hammer: { efficiency: 5 }
};

// Enemy types
export const ENEMY_TYPES = {
  zombie: { health: 50, damage: 10, speed: 0.8, xp: 20, color: [80, 120, 80] },
  mutant: { health: 100, damage: 15, speed: 1.2, xp: 40, color: [140, 80, 120] },
  beast: { health: 150, damage: 20, speed: 1.5, xp: 60, color: [160, 60, 60] },
  boss: { health: 300, damage: 30, speed: 1.0, xp: 150, color: [200, 40, 40] }
};

// Crafting recipes
export const RECIPES = {
  wooden_club: { wood: 10, stone: 0, metal: 0, fabric: 0, type: "weapon" },
  stone_axe: { wood: 5, stone: 10, metal: 0, fabric: 0, type: "tool" },
  iron_sword: { wood: 5, stone: 5, metal: 20, fabric: 0, type: "weapon" },
  iron_pickaxe: { wood: 10, stone: 5, metal: 15, fabric: 0, type: "tool" },
  steel_axe: { wood: 10, stone: 10, metal: 30, fabric: 5, type: "weapon" },
  steel_hammer: { wood: 15, stone: 15, metal: 40, fabric: 10, type: "tool" }
};

// Zone system
export const ZONES = [
  { id: 0, x: 100, y: 100, width: 400, height: 300, cleared: false, enemyCount: 3, type: "zombie" },
  { id: 1, x: 800, y: 200, width: 350, height: 350, cleared: false, enemyCount: 4, type: "mutant" },
  { id: 2, x: 400, y: 600, width: 400, height: 350, cleared: false, enemyCount: 5, type: "beast" },
  { id: 3, x: 1200, y: 700, width: 450, height: 400, cleared: false, enemyCount: 1, type: "boss" }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}