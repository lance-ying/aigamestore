// globals.js - Game constants and global state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

// Fruit tiers with properties
export const FRUIT_TIERS = [
  { name: "Cherry", radius: 15, color: [220, 20, 60], points: 10 },
  { name: "Strawberry", radius: 20, color: [255, 69, 0], points: 20 },
  { name: "Grape", radius: 25, color: [138, 43, 226], points: 30 },
  { name: "Orange", radius: 30, color: [255, 140, 0], points: 40 },
  { name: "Apple", radius: 35, color: [255, 0, 0], points: 50 },
  { name: "Kiwi", radius: 40, color: [107, 142, 35], points: 60 },
  { name: "Pineapple", radius: 45, color: [255, 215, 0], points: 70 },
  { name: "Watermelon", radius: 50, color: [34, 139, 34], points: 100 }
];

// Level definitions
export const LEVELS = [
  {
    name: "Orchard Starter",
    number: 1,
    scoreGoal: 500,
    fusionGoal: 5,
    availableFruits: [0, 1, 2], // Cherry, Strawberry, Grape
    loseLineY: 80,
    description: "Get 500 points or 5 fusions"
  },
  {
    name: "Citrus Challenge",
    number: 2,
    scoreGoal: 1500,
    fusionGoal: 3,
    availableFruits: [0, 1, 2, 3, 4], // Cherry to Apple
    loseLineY: 100,
    description: "Get 1500 points or 3 Orange fusions"
  },
  {
    name: "Tropical Trial",
    number: 3,
    scoreGoal: 3000,
    fusionGoal: 2,
    availableFruits: [2, 3, 4, 5, 6], // Grape to Pineapple
    loseLineY: 120,
    description: "Get 3000 points or 2 Pineapple fusions"
  },
  {
    name: "Watermelon Dream",
    number: 4,
    scoreGoal: Infinity,
    fusionGoal: 1,
    availableFruits: [3, 4, 5, 6], // Orange to Pineapple
    loseLineY: 140,
    description: "Create the Watermelon!"
  }
];

// Container boundaries
export const CONTAINER = {
  x: 100,
  y: 150,
  width: 400,
  height: 250,
  wallThickness: 10
};

// Game state
export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  fruits: [],
  score: 0,
  currentLevel: 0,
  fusionCount: 0,
  targetFusionTier: -1, // For level-specific fusion goals
  currentFruit: null,
  nextFruit: null,
  dropX: CANVAS_WIDTH / 2,
  lastFusionTime: 0,
  comboCount: 0,
  levelStartTime: 0,
  transitionTimer: 0,
  highScore: 0
};

// Physics settings
export const PHYSICS = {
  gravity: 0.8,
  restitution: 0.3,
  friction: 0.5,
  frictionStatic: 0.8,
  density: 0.001
};

export function getGameState() {
  return gameState;
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}