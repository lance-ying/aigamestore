export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;

export const TOWER_TYPES = {
  MACHINE_GUN: {
    name: "Machine Gun",
    cost: 50,
    damage: 15,
    range: 80,
    fireRate: 15,
    color: [100, 100, 200],
    upgradeCost: [75, 100],
    damageMultiplier: [1, 1.5, 2.5],
    rangeMultiplier: [1, 1.2, 1.4]
  },
  FLAMETHROWER: {
    name: "Flamethrower",
    cost: 75,
    damage: 8,
    range: 60,
    fireRate: 5,
    color: [255, 100, 50],
    upgradeCost: [100, 150],
    damageMultiplier: [1, 1.8, 3.0],
    rangeMultiplier: [1, 1.3, 1.6]
  },
  CANNON: {
    name: "Cannon",
    cost: 100,
    damage: 50,
    range: 100,
    fireRate: 60,
    color: [80, 200, 80],
    upgradeCost: [150, 200],
    damageMultiplier: [1, 1.6, 2.8],
    rangeMultiplier: [1, 1.15, 1.3]
  },
  PLASMA: {
    name: "Plasma",
    cost: 150,
    damage: 35,
    range: 90,
    fireRate: 30,
    color: [200, 50, 255],
    upgradeCost: [200, 300],
    damageMultiplier: [1, 2.0, 3.5],
    rangeMultiplier: [1, 1.25, 1.5]
  }
};

export const ENEMY_TYPES = {
  BASIC: {
    name: "Scout",
    health: 50,
    speed: 1.0,
    reward: 15,
    color: [255, 100, 100],
    size: 8
  },
  FAST: {
    name: "Runner",
    health: 30,
    speed: 1.8,
    reward: 20,
    color: [255, 255, 100],
    size: 6
  },
  TANK: {
    name: "Tank",
    health: 150,
    speed: 0.5,
    reward: 40,
    color: [150, 50, 50],
    size: 12
  },
  ELITE: {
    name: "Elite",
    health: 200,
    speed: 0.8,
    reward: 60,
    color: [200, 50, 255],
    size: 10
  }
};

export const gameState = {
  player: null,
  entities: [],
  towers: [],
  enemies: [],
  projectiles: [],
  score: 0,
  money: 200,
  wave: 0,
  waveActive: false,
  waveEnemiesSpawned: 0,
  waveEnemiesTotal: 0,
  waveSpawnTimer: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  commandCenterHealth: 100,
  selectedTowerType: null,
  selectedTowerIndex: 0,
  placementMode: false,
  previewX: 0,
  previewY: 0,
  selectedTower: null,
  gameSpeed: 1,
  enemiesReachedGoal: 0,
  path: [],
  validTowerPositions: [],
  framesSinceLastAction: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;