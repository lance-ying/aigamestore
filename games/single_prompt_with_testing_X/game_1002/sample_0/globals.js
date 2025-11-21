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

export const BUILDING_TYPES = {
  TOWN_HALL: "TOWN_HALL",
  FOOD_GATHERER: "FOOD_GATHERER",
  WOOD_CUTTER: "WOOD_CUTTER",
  COAL_MINE: "COAL_MINE",
  HOUSE: "HOUSE",
  BARRACKS: "BARRACKS",
  WALL: "WALL",
  TECH_LAB: "TECH_LAB"
};

export const HERO_TYPES = {
  WARRIOR: "WARRIOR",
  ARCHER: "ARCHER",
  MAGE: "MAGE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Resources
  food: 100,
  wood: 100,
  coal: 50,
  population: 5,
  maxPopulation: 10,
  
  // Buildings
  buildings: [],
  selectedBuilding: null,
  buildingMenuOpen: false,
  selectedBuildingType: null,
  
  // Heroes
  heroes: [],
  selectedHero: null,
  heroMenuOpen: false,
  
  // Enemies
  beasts: [],
  
  // Wave system
  currentWave: 0,
  maxWaves: 10,
  waveTimer: 0,
  waveDuration: 600, // frames between waves (10 seconds at 60fps)
  waveActive: false,
  
  // Technology
  techLevel: 1,
  
  // Time
  gameTime: 0,
  timeScale: 1,
  
  // UI state
  uiMessage: "",
  uiMessageTimer: 0,
  
  // Camera for scrolling (if needed)
  cameraX: 0,
  cameraY: 0,
  
  // Player
  player: null, // Reference to town hall
  
  // All entities
  entities: [],
  
  // Input state
  currentInput: null
};

// Building definitions
export const BUILDING_DEFS = {
  [BUILDING_TYPES.TOWN_HALL]: {
    name: "Town Hall",
    cost: { food: 0, wood: 0, coal: 0 },
    size: 50,
    color: [100, 100, 200],
    produces: null,
    productionRate: 0,
    health: 500,
    unique: true
  },
  [BUILDING_TYPES.FOOD_GATHERER]: {
    name: "Farm",
    cost: { food: 20, wood: 30, coal: 0 },
    size: 30,
    color: [150, 200, 100],
    produces: "food",
    productionRate: 0.5,
    health: 100
  },
  [BUILDING_TYPES.WOOD_CUTTER]: {
    name: "Lumber Mill",
    cost: { food: 20, wood: 20, coal: 0 },
    size: 30,
    color: [139, 90, 43],
    produces: "wood",
    productionRate: 0.3,
    health: 100
  },
  [BUILDING_TYPES.COAL_MINE]: {
    name: "Coal Mine",
    cost: { food: 30, wood: 40, coal: 0 },
    size: 30,
    color: [60, 60, 60],
    produces: "coal",
    productionRate: 0.2,
    health: 100
  },
  [BUILDING_TYPES.HOUSE]: {
    name: "House",
    cost: { food: 15, wood: 25, coal: 10 },
    size: 25,
    color: [200, 150, 100],
    produces: null,
    productionRate: 0,
    health: 80,
    populationBonus: 5
  },
  [BUILDING_TYPES.BARRACKS]: {
    name: "Barracks",
    cost: { food: 50, wood: 60, coal: 30 },
    size: 35,
    color: [150, 50, 50],
    produces: null,
    productionRate: 0,
    health: 150
  },
  [BUILDING_TYPES.WALL]: {
    name: "Wall",
    cost: { food: 10, wood: 20, coal: 5 },
    size: 20,
    color: [120, 120, 120],
    produces: null,
    productionRate: 0,
    health: 200
  },
  [BUILDING_TYPES.TECH_LAB]: {
    name: "Tech Lab",
    cost: { food: 80, wood: 100, coal: 60 },
    size: 35,
    color: [100, 200, 200],
    produces: null,
    productionRate: 0,
    health: 120
  }
};

// Hero definitions
export const HERO_DEFS = {
  [HERO_TYPES.WARRIOR]: {
    name: "Warrior",
    cost: { food: 40, wood: 20, coal: 10 },
    color: [200, 100, 100],
    health: 150,
    damage: 15,
    range: 30,
    speed: 2,
    attackCooldown: 30
  },
  [HERO_TYPES.ARCHER]: {
    name: "Archer",
    cost: { food: 30, wood: 40, coal: 10 },
    color: [100, 200, 100],
    health: 100,
    damage: 20,
    range: 80,
    speed: 2.5,
    attackCooldown: 40
  },
  [HERO_TYPES.MAGE]: {
    name: "Mage",
    cost: { food: 50, wood: 30, coal: 30 },
    color: [150, 100, 200],
    health: 80,
    damage: 25,
    range: 100,
    speed: 1.8,
    attackCooldown: 50,
    aoe: true
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;