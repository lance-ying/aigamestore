// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const FACILITY_TYPES = {
  TENT: { id: 'tent', name: 'Tent', cost: 50, icon: '⛺', satisfaction: 2 },
  FISHING: { id: 'fishing', name: 'Fishing Spot', cost: 100, icon: '🎣', satisfaction: 3 },
  CAMPFIRE: { id: 'campfire', name: 'Campfire BBQ', cost: 80, icon: '🔥', satisfaction: 3 },
  BUG_CATCHING: { id: 'bug', name: 'Bug Spot', cost: 120, icon: '🦋', satisfaction: 4 },
  PICNIC: { id: 'picnic', name: 'Picnic Area', cost: 150, icon: '🧺', satisfaction: 4 },
  PLAYGROUND: { id: 'playground', name: 'Playground', cost: 200, icon: '🎪', satisfaction: 5 }
};

export const SHOP_ITEMS = [
  { id: 'tent_basic', name: 'Basic Tent', cost: 20, price: 50, category: 'tent' },
  { id: 'tent_deluxe', name: 'Deluxe Tent', cost: 40, price: 100, category: 'tent' },
  { id: 'fishing_rod', name: 'Fishing Rod', cost: 30, price: 80, category: 'fishing' },
  { id: 'lure_set', name: 'Lure Set', cost: 50, price: 120, category: 'fishing' },
  { id: 'grill', name: 'Portable Grill', cost: 35, price: 90, category: 'campfire' },
  { id: 'marshmallow', name: 'Marshmallows', cost: 15, price: 40, category: 'campfire' },
  { id: 'bug_net', name: 'Bug Net', cost: 25, price: 70, category: 'bug' },
  { id: 'jar', name: 'Collection Jar', cost: 20, price: 55, category: 'bug' },
  { id: 'picnic_basket', name: 'Picnic Basket', cost: 45, price: 110, category: 'picnic' },
  { id: 'blanket', name: 'Picnic Blanket', cost: 30, price: 75, category: 'picnic' }
];

export const gameState = {
  player: null,
  entities: [],
  campers: [],
  facilities: [],
  score: 0,
  currency: 200,
  satisfaction: 0,
  maxCampers: 0,
  rating: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  time: 0,
  dayNightCycle: 0,
  selectedFacilityType: null,
  shopMode: false,
  shopInventory: {},
  unlockedFacilities: ['tent', 'fishing', 'campfire'],
  campsiteWidth: 12,
  campsiteHeight: 8,
  gridSize: 40,
  cameraX: 0,
  cameraY: 0,
  camperSpawnTimer: 0,
  wishFulfillmentCount: 0
};

// Initialize shop inventory
SHOP_ITEMS.forEach(item => {
  gameState.shopInventory[item.id] = 0;
});