// Game constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const START_MONEY = 200;
export const START_LIVES = 20;
export const MAX_WAVES = 15;

// Tower types
export const TOWER_TYPES = {
  DART: {
    name: "Dart Monkey",
    cost: 100,
    range: 80,
    attackSpeed: 1.0,
    damage: 1,
    color: [139, 69, 19],
    upgradePrice: 75,
    upgradeEffect: { range: 20, attackSpeed: 0.2, damage: 0 }
  },
  BOMB: {
    name: "Bomb Tower",
    cost: 200,
    range: 60,
    attackSpeed: 1.5,
    damage: 2,
    color: [0, 0, 0],
    upgradePrice: 150,
    upgradeEffect: { range: 10, attackSpeed: 0, damage: 1 }
  },
  TACK: {
    name: "Tack Shooter",
    cost: 150,
    range: 50,
    attackSpeed: 0.8,
    damage: 1,
    color: [255, 0, 0],
    upgradePrice: 100,
    upgradeEffect: { range: 0, attackSpeed: 0.1, damage: 0 }
  },
  FARM: {
    name: "Banana Farm",
    cost: 300,
    range: 0,
    attackSpeed: 5.0,
    damage: 0,
    color: [255, 255, 0],
    upgradePrice: 200,
    upgradeEffect: { range: 0, attackSpeed: -1.0, damage: 0 }
  }
};

// Balloon types
export const BALLOON_TYPES = {
  RED: { health: 1, speed: 1.0, color: [255, 0, 0], reward: 1 },
  BLUE: { health: 2, speed: 1.2, color: [0, 0, 255], reward: 2 },
  GREEN: { health: 3, speed: 1.4, color: [0, 255, 0], reward: 3 },
  YELLOW: { health: 4, speed: 1.8, color: [255, 255, 0], reward: 4 },
  PURPLE: { health: 5, speed: 1.5, color: [128, 0, 128], reward: 5 }
};

// Game path points (normalized 0-1 coordinates)
export const PATH_POINTS = [
  {x: -0.05, y: 0.5},
  {x: 0.2, y: 0.5},
  {x: 0.2, y: 0.2},
  {x: 0.5, y: 0.2},
  {x: 0.5, y: 0.8},
  {x: 0.8, y: 0.8},
  {x: 0.8, y: 0.5},
  {x: 1.05, y: 0.5}
];

// Game state
export const gameState = {
  player: null,
  entities: {
    towers: [],
    balloons: [],
    projectiles: []
  },
  cursor: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    selectedTower: "DART",
    hoveredTower: null
  },
  path: [],
  money: START_MONEY,
  lives: START_LIVES,
  score: 0,
  wave: 1,
  waveStarted: false,
  waveTimer: 0,
  currentWaveBalloons: [],
  gamePhase: "START",
  controlMode: "HUMAN",
  framesSinceLastAction: 0
};

// Get game state function (exposed globally)
export function getGameState() {
  return gameState;
}