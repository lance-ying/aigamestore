// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_COLS = 20;
export const GRID_ROWS = 13;
export const CELL_SIZE = Math.min(
  Math.floor(CANVAS_WIDTH / GRID_COLS),
  Math.floor(CANVAS_HEIGHT / GRID_ROWS)
);

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const UNIT_TYPES = {
  INFANTRY: "INFANTRY",
  ARTILLERY: "ARTILLERY",
  TANK: "TANK"
};

export const TERRAIN_TYPES = {
  LAND: "LAND",
  WATER: "WATER",
  IMPASSABLE: "IMPASSABLE",
  PLAYER_DEPLOY: "PLAYER_DEPLOY",
  ENEMY_DEPLOY: "ENEMY_DEPLOY"
};

export const BUILDING_TYPES = {
  PLAYER_HQ: "PLAYER_HQ",
  ENEMY_HQ: "ENEMY_HQ",
  TURRET: "TURRET"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  playerResources: 0,
  selectedUnitType: null,
  mapGrid: [],
  playerUnits: [],
  enemyUnits: [],
  buildings: [],
  playerHQ: null,
  enemyHQ: null,
  combatPhase: false,
  turnCount: 0,
  projectiles: [],
  animations: [],
  uiButtons: [],
  levelConfig: null,
  enemyTurnTimer: 0,
  enemyDeploymentQueue: [],
  highScores: []
};

export const UNIT_CONFIGS = {
  [UNIT_TYPES.INFANTRY]: {
    health: 100,
    maxHealth: 100,
    damage: 15,
    range: 1,
    movementAllowance: 1,
    cost: 50,
    color: [100, 150, 255],
    enemyColor: [255, 100, 100],
    displayName: "Infantry"
  },
  [UNIT_TYPES.ARTILLERY]: {
    health: 60,
    maxHealth: 60,
    damage: 40,
    range: 3,
    movementAllowance: 1,
    cost: 100,
    color: [100, 200, 255],
    enemyColor: [255, 150, 100],
    displayName: "Artillery"
  },
  [UNIT_TYPES.TANK]: {
    health: 200,
    maxHealth: 200,
    damage: 35,
    range: 2,
    movementAllowance: 1,
    cost: 150,
    color: [120, 180, 255],
    enemyColor: [255, 120, 120],
    displayName: "Tank"
  }
};

export const BUILDING_CONFIGS = {
  [BUILDING_TYPES.PLAYER_HQ]: {
    health: 500,
    maxHealth: 500,
    color: [50, 100, 255],
    displayName: "Player HQ"
  },
  [BUILDING_TYPES.ENEMY_HQ]: {
    health: 400,
    maxHealth: 400,
    color: [255, 50, 50],
    displayName: "Enemy HQ"
  },
  [BUILDING_TYPES.TURRET]: {
    health: 150,
    maxHealth: 150,
    damage: 25,
    range: 2,
    color: [120, 120, 120],
    displayName: "Defense Turret"
  }
};

export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "The Beachhead",
    startResources: 300,
    resourcePerTurn: 50,
    enemyUnits: [
      { type: UNIT_TYPES.INFANTRY, count: 3 },
      { type: UNIT_TYPES.INFANTRY, count: 2 }
    ],
    turrets: [
      { gridX: 15, gridY: 6 }
    ],
    enemyHQPos: { gridX: 18, gridY: 6 },
    playerHQPos: { gridX: 1, gridY: 6 }
  },
  {
    level: 2,
    name: "Rocky Outpost",
    startResources: 250,
    resourcePerTurn: 40,
    enemyUnits: [
      { type: UNIT_TYPES.INFANTRY, count: 4 },
      { type: UNIT_TYPES.ARTILLERY, count: 2 },
      { type: UNIT_TYPES.INFANTRY, count: 3 }
    ],
    turrets: [
      { gridX: 14, gridY: 4 },
      { gridX: 14, gridY: 8 },
      { gridX: 17, gridY: 6 }
    ],
    enemyHQPos: { gridX: 18, gridY: 6 },
    playerHQPos: { gridX: 1, gridY: 6 },
    rocks: [
      { gridX: 10, gridY: 5 },
      { gridX: 10, gridY: 6 },
      { gridX: 10, gridY: 7 }
    ]
  },
  {
    level: 3,
    name: "Twin Peaks Fortress",
    startResources: 200,
    resourcePerTurn: 35,
    enemyUnits: [
      { type: UNIT_TYPES.INFANTRY, count: 5 },
      { type: UNIT_TYPES.ARTILLERY, count: 3 },
      { type: UNIT_TYPES.TANK, count: 2 }
    ],
    turrets: [
      { gridX: 13, gridY: 3 },
      { gridX: 13, gridY: 9 },
      { gridX: 16, gridY: 6 },
      { gridX: 17, gridY: 4 }
    ],
    enemyHQPos: { gridX: 18, gridY: 6 },
    playerHQPos: { gridX: 1, gridY: 6 },
    rocks: [
      { gridX: 9, gridY: 4 },
      { gridX: 9, gridY: 5 },
      { gridX: 9, gridY: 7 },
      { gridX: 9, gridY: 8 },
      { gridX: 12, gridY: 6 }
    ]
  },
  {
    level: 4,
    name: "Island Stronghold",
    startResources: 180,
    resourcePerTurn: 30,
    enemyUnits: [
      { type: UNIT_TYPES.INFANTRY, count: 6 },
      { type: UNIT_TYPES.ARTILLERY, count: 4 },
      { type: UNIT_TYPES.TANK, count: 3 },
      { type: UNIT_TYPES.TANK, count: 2 }
    ],
    turrets: [
      { gridX: 12, gridY: 3 },
      { gridX: 12, gridY: 9 },
      { gridX: 15, gridY: 4 },
      { gridX: 15, gridY: 8 },
      { gridX: 17, gridY: 6 }
    ],
    enemyHQPos: { gridX: 18, gridY: 6 },
    playerHQPos: { gridX: 1, gridY: 6 },
    rocks: [
      { gridX: 8, gridY: 3 },
      { gridX: 8, gridY: 4 },
      { gridX: 8, gridY: 5 },
      { gridX: 8, gridY: 7 },
      { gridX: 8, gridY: 8 },
      { gridX: 8, gridY: 9 },
      { gridX: 11, gridY: 6 },
      { gridX: 14, gridY: 6 }
    ]
  }
];