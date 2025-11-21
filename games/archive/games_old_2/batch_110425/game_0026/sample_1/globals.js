// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const GRID_SIZE = 20;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

export const ATTRACTION_TYPES = {
  COFFEE_CUP: {
    name: "Coffee Cup",
    cost: 100,
    income: 5,
    satisfaction: 3,
    size: 1,
    buildTime: 60,
    color: [200, 100, 50],
    unlocked: true
  },
  TRAMPOLINE: {
    name: "Trampoline",
    cost: 150,
    income: 8,
    satisfaction: 5,
    size: 1,
    buildTime: 90,
    color: [100, 200, 100],
    unlocked: true
  },
  CAROUSEL: {
    name: "Carousel",
    cost: 300,
    income: 15,
    satisfaction: 10,
    size: 2,
    buildTime: 120,
    color: [255, 180, 200],
    unlocked: false
  },
  FERRIS_WHEEL: {
    name: "Ferris Wheel",
    cost: 800,
    income: 40,
    satisfaction: 25,
    size: 3,
    buildTime: 180,
    color: [100, 150, 255],
    unlocked: false
  },
  ROLLER_COASTER: {
    name: "Roller Coaster",
    cost: 1500,
    income: 80,
    satisfaction: 50,
    size: 4,
    buildTime: 240,
    color: [255, 100, 100],
    unlocked: false
  },
  HAUNTED_HOUSE: {
    name: "Haunted House",
    cost: 600,
    income: 30,
    satisfaction: 20,
    size: 2,
    buildTime: 150,
    color: [80, 50, 100],
    unlocked: false
  }
};

export const RESEARCH_TREE = [
  { id: "carousel", name: "Carousel", cost: 200, satisfaction: 0, unlocks: "CAROUSEL", tier: 1 },
  { id: "efficiency1", name: "Efficiency I", cost: 150, satisfaction: 0, incomeBoost: 1.2, tier: 1 },
  { id: "haunted", name: "Haunted House", cost: 400, satisfaction: 0, unlocks: "HAUNTED_HOUSE", tier: 2 },
  { id: "landExpand1", name: "Land Expansion I", cost: 300, satisfaction: 0, expandsLand: 30, tier: 2 },
  { id: "ferris", name: "Ferris Wheel", cost: 600, satisfaction: 0, unlocks: "FERRIS_WHEEL", tier: 3 },
  { id: "efficiency2", name: "Efficiency II", cost: 400, satisfaction: 0, incomeBoost: 1.5, tier: 3 },
  { id: "landExpand2", name: "Land Expansion II", cost: 500, satisfaction: 0, expandsLand: 50, tier: 4 },
  { id: "roller", name: "Roller Coaster", cost: 1000, satisfaction: 0, unlocks: "ROLLER_COASTER", tier: 4 },
  { id: "marketing", name: "Marketing", cost: 800, satisfaction: 20, tier: 5 }
];

export const MASCOTS = [
  { id: "bear", name: "Teddy Bear", cost: 400, popularity: 50, theme: "Classic", color: [180, 120, 80] },
  { id: "penguin", name: "Ice Penguin", cost: 600, popularity: 80, theme: "Snow Country", color: [100, 150, 200] },
  { id: "alien", name: "Space Alien", cost: 800, popularity: 120, theme: "Space Zone", color: [150, 100, 200] }
];

export const gameState = {
  player: null,
  entities: [],
  attractions: [],
  guests: [],
  money: 500,
  satisfaction: 0,
  popularity: 0,
  ranking: 10,
  day: 1,
  year: 1,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  grid: null,
  selectedAttractionType: null,
  menuOpen: false,
  menuIndex: 0,
  researchedItems: [],
  unlockedAttractions: ["COFFEE_CUP", "TRAMPOLINE"],
  availableLandCells: 50,
  mascots: [],
  cameraOffsetX: 0,
  cameraOffsetY: 0,
  incomeMultiplier: 1.0,
  lastGuestSpawnFrame: 0,
  hoveredCell: { x: -1, y: -1 },
  timescale: 1.0,
  framesSinceStart: 0,
  snsMessages: []
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;