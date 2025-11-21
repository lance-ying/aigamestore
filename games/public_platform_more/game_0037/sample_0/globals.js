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

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Fireplace dimensions
export const FIREPLACE_X = 50;
export const FIREPLACE_Y = 200;
export const FIREPLACE_WIDTH = 300;
export const FIREPLACE_HEIGHT = 180;

// Catalog dimensions
export const CATALOG_X = 380;
export const CATALOG_Y = 50;
export const CATALOG_WIDTH = 200;
export const CATALOG_HEIGHT = 320;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 50, // Start with some coins
  stamps: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Catalog system
  catalogs: [],
  currentCatalogIndex: 0,
  catalogOpen: false,
  selectedItemIndex: 0,
  
  // Inventory
  inventory: [],
  
  // Items being burned
  burningItems: [],
  
  // Combos discovered
  combosDiscovered: [],
  
  // Item being grabbed
  grabbedItem: null,
  
  // Frame counter for animations
  frameCounter: 0,
  
  // Story progression
  storyProgress: 0,
  letterQueue: [],
  currentLetter: null,
  
  // Position tracking for testing
  lastActionFrame: 0
};

// Item catalog data
export const ITEM_TEMPLATES = [
  // Catalog 1 - Basic items
  { id: 'log', name: 'Wood Log', cost: 10, burnTime: 180, color: [139, 69, 19], catalog: 0 },
  { id: 'paper', name: 'Paper', cost: 5, burnTime: 60, color: [255, 250, 240], catalog: 0 },
  { id: 'match', name: 'Match', cost: 3, burnTime: 45, color: [255, 69, 0], catalog: 0 },
  { id: 'candle', name: 'Candle', cost: 8, burnTime: 120, color: [255, 253, 208], catalog: 0 },
  { id: 'book', name: 'Book', cost: 12, burnTime: 150, color: [139, 0, 0], catalog: 0 },
  
  // Catalog 2 - Toys
  { id: 'teddy', name: 'Teddy Bear', cost: 20, burnTime: 200, color: [210, 180, 140], catalog: 1 },
  { id: 'doll', name: 'Doll', cost: 18, burnTime: 190, color: [255, 182, 193], catalog: 1 },
  { id: 'toy_car', name: 'Toy Car', cost: 15, burnTime: 160, color: [255, 0, 0], catalog: 1 },
  { id: 'robot', name: 'Robot Toy', cost: 25, burnTime: 220, color: [192, 192, 192], catalog: 1 },
  { id: 'blocks', name: 'Toy Blocks', cost: 10, burnTime: 140, color: [255, 215, 0], catalog: 1 },
  
  // Catalog 3 - Electronics
  { id: 'battery', name: 'Battery', cost: 15, burnTime: 100, color: [255, 215, 0], catalog: 2 },
  { id: 'phone', name: 'Old Phone', cost: 35, burnTime: 250, color: [70, 70, 70], catalog: 2 },
  { id: 'camera', name: 'Camera', cost: 40, burnTime: 280, color: [50, 50, 50], catalog: 2 },
  { id: 'gameboy', name: 'Gameboy', cost: 45, burnTime: 300, color: [169, 169, 169], catalog: 2 },
  { id: 'radio', name: 'Radio', cost: 30, burnTime: 240, color: [139, 69, 19], catalog: 2 },
  
  // Catalog 4 - Special items
  { id: 'diamond', name: 'Diamond', cost: 100, burnTime: 500, color: [185, 242, 255], catalog: 3 },
  { id: 'photo', name: 'Photo', cost: 20, burnTime: 90, color: [245, 245, 220], catalog: 3 },
  { id: 'letter', name: 'Letter', cost: 8, burnTime: 70, color: [255, 255, 255], catalog: 3 },
  { id: 'globe', name: 'Globe', cost: 50, burnTime: 350, color: [0, 100, 200], catalog: 3 },
  { id: 'clock', name: 'Clock', cost: 35, burnTime: 280, color: [218, 165, 32], catalog: 3 }
];

// Combo definitions
export const COMBO_DEFINITIONS = [
  // Catalog 1 combos
  { id: 'campfire', items: ['log', 'match'], hint: 'Classic Warmth', reward: 50, catalog: 0 },
  { id: 'reading', items: ['book', 'candle'], hint: 'Night Reading', reward: 40, catalog: 0 },
  { id: 'kindle', items: ['paper', 'match'], hint: 'Quick Start', reward: 30, catalog: 0 },
  { id: 'bonfire', items: ['log', 'log'], hint: 'Double Trouble', reward: 35, catalog: 0 },
  
  // Catalog 2 combos
  { id: 'childhood', items: ['teddy', 'doll'], hint: 'Playmates', reward: 60, catalog: 1 },
  { id: 'toy_box', items: ['toy_car', 'blocks'], hint: 'Play Time', reward: 50, catalog: 1 },
  { id: 'robot_rage', items: ['robot', 'battery'], hint: 'Power Up', reward: 70, catalog: 1 },
  { id: 'race', items: ['toy_car', 'toy_car'], hint: 'Race Day', reward: 55, catalog: 1 },
  
  // Catalog 3 combos
  { id: 'tech_junk', items: ['phone', 'radio'], hint: 'Old Tech', reward: 80, catalog: 2 },
  { id: 'memories', items: ['camera', 'photo'], hint: 'Captured Moments', reward: 90, catalog: 2 },
  { id: 'gaming', items: ['gameboy', 'battery'], hint: 'Game Over', reward: 85, catalog: 2 },
  { id: 'communication', items: ['phone', 'letter'], hint: 'Send Message', reward: 75, catalog: 2 },
  
  // Catalog 4 combos
  { id: 'treasure', items: ['diamond', 'globe'], hint: 'World Wealth', reward: 150, catalog: 3 },
  { id: 'time', items: ['clock', 'photo'], hint: 'Time Stands Still', reward: 120, catalog: 3 },
  { id: 'precious', items: ['diamond', 'diamond'], hint: 'Luxury Burns', reward: 200, catalog: 3 },
  { id: 'farewell', items: ['letter', 'photo'], hint: 'Goodbye', reward: 100, catalog: 3 },
  
  // Cross-catalog combos
  { id: 'nostalgia', items: ['teddy', 'photo'], hint: 'Remember When', reward: 110, catalog: 2 },
  { id: 'education', items: ['book', 'globe'], hint: 'World Knowledge', reward: 95, catalog: 3 }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}