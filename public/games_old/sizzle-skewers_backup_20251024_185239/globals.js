export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 8;
export const CELL_SIZE = 45;
export const GRID_OFFSET_X = 60;
export const GRID_OFFSET_Y = 80;

export const SKEWER_TYPES = {
  CHICKEN: 'CHICKEN',
  BEEF: 'BEEF',
  VEGGIE: 'VEGGIE',
  FISH: 'FISH',
  SHRIMP: 'SHRIMP'
};

export const SPECIAL_TYPES = {
  FLAME: 'FLAME',
  GRILL_FLIP: 'GRILL_FLIP',
  BURNT: 'BURNT',
  EMPTY: 'EMPTY'
};

export const gameState = {
  gamePhase: "START",
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  movesRemaining: 0,
  objectives: {},
  grid: [],
  cursorX: 0,
  cursorY: 0,
  selectedTile: null,
  animating: false,
  levelData: null,
  unlockedLevels: 1,
  highScores: {}
};

export const LEVELS = [
  {
    level: 1,
    name: "Sizzle Starter",
    objectives: { CHICKEN: 25 },
    moves: 40,
    availableSkewers: ['CHICKEN', 'BEEF', 'VEGGIE']
  },
  {
    level: 2,
    name: "Fishy Fun",
    objectives: { FISH: 30, BEEF: 15 },
    moves: 35,
    availableSkewers: ['CHICKEN', 'BEEF', 'VEGGIE', 'FISH']
  },
  {
    level: 3,
    name: "Burnt Bites",
    objectives: { SHRIMP: 20, BURNT: 3 },
    moves: 30,
    availableSkewers: ['CHICKEN', 'BEEF', 'VEGGIE', 'FISH', 'SHRIMP'],
    burntBlocks: 3
  },
  {
    level: 4,
    name: "Grill Master",
    objectives: { TOTAL: 50, BURNT: 5 },
    moves: 28,
    availableSkewers: ['CHICKEN', 'BEEF', 'VEGGIE', 'FISH', 'SHRIMP'],
    burntBlocks: 5
  },
  {
    level: 5,
    name: "Foodie Finale",
    objectives: { FLAME_ACTIVATED: 2, GRILL_FLIP_ACTIVATED: 1, BURNT: 6 },
    moves: 25,
    availableSkewers: ['CHICKEN', 'BEEF', 'VEGGIE', 'FISH', 'SHRIMP'],
    burntBlocks: 6
  }
];