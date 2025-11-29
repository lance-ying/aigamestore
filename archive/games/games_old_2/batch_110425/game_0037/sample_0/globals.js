// globals.js - Game constants and shared state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Shop types with costs and appeal
export const SHOP_TYPES = {
  RESTAURANT: { name: 'Restaurant', cost: 100, appeal: 8, color: [255, 100, 100], width: 60, revenue: 15 },
  CINEMA: { name: 'Cinema', cost: 150, appeal: 10, color: [100, 100, 255], width: 80, revenue: 20 },
  BOOKSTORE: { name: 'Bookstore', cost: 80, appeal: 6, color: [100, 200, 100], width: 50, revenue: 10 },
  CAFE: { name: 'Cafe', cost: 60, appeal: 5, color: [200, 150, 100], width: 40, revenue: 8 },
  CLOTHING: { name: 'Clothing', cost: 90, appeal: 7, color: [255, 200, 100], width: 55, revenue: 12 },
  ELECTRONICS: { name: 'Electronics', cost: 120, appeal: 8, color: [150, 150, 255], width: 65, revenue: 16 },
  FOSSIL_EXHIBIT: { name: 'Fossil Exhibit', cost: 200, appeal: 12, color: [180, 140, 100], width: 90, revenue: 25 }
};

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  
  // Building state
  floors: [], // Array of floor objects
  currentFloorIndex: 0,
  maxFloors: 10,
  floorHeight: 60,
  
  // Economy
  money: 300,
  revenue: 0,
  
  // Shops
  shops: [], // All placed shops across all floors
  selectedShopType: null,
  shopMenuOpen: false,
  hoveredShop: null,
  
  // Customers
  customers: [], // All active customers
  customerSpawnTimer: 0,
  customerSpawnRate: 120, // frames between spawns
  totalCustomersServed: 0,
  satisfactionScore: 50, // 0-100
  
  // VIP customers
  vipCustomers: [],
  vipChance: 0.05,
  
  // Progression
  rating: 0, // 0-5 stars
  upgradePoints: 0,
  
  // UI state
  selectedFloor: 0,
  scrollOffset: 0,
  
  // Game stats
  frameCount: 0,
  gameTime: 0,
  
  // Player reference (for logging purposes)
  player: null
};

// Initialize the game state
export function initializeGameState() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.floors = [createFloor(0)];
  gameState.currentFloorIndex = 0;
  gameState.money = 300;
  gameState.revenue = 0;
  gameState.shops = [];
  gameState.customers = [];
  gameState.vipCustomers = [];
  gameState.selectedShopType = null;
  gameState.shopMenuOpen = false;
  gameState.hoveredShop = null;
  gameState.customerSpawnTimer = 0;
  gameState.totalCustomersServed = 0;
  gameState.satisfactionScore = 50;
  gameState.rating = 0;
  gameState.upgradePoints = 0;
  gameState.selectedFloor = 0;
  gameState.scrollOffset = 0;
  gameState.frameCount = 0;
  gameState.gameTime = 0;
  
  // Create a dummy player object for logging
  gameState.player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    gameX: CANVAS_WIDTH / 2,
    gameY: CANVAS_HEIGHT / 2
  };
}

export function createFloor(index) {
  return {
    index: index,
    y: CANVAS_HEIGHT - 100 - (index * gameState.floorHeight),
    shops: [],
    capacity: 5, // Max shops per floor
    trafficLevel: 1.0
  };
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}