// globals.js - Game constants and state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_COLS = 9;
export const GRID_ROWS = 5;
export const CELL_WIDTH = CANVAS_WIDTH / GRID_COLS;
export const CELL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLANT_TYPES = {
  SUNFLOWER: "SUNFLOWER",
  PEASHOOTER: "PEASHOOTER",
  WALLNUT: "WALLNUT"
};

export const ZOMBIE_TYPES = {
  BASIC: "BASIC",
  CONEHEAD: "CONEHEAD"
};

export const PLANT_COSTS = {
  SUNFLOWER: 50,
  PEASHOOTER: 100,
  WALLNUT: 50
};

export const PLANT_COOLDOWNS = {
  SUNFLOWER: 7.5,
  PEASHOOTER: 7.5,
  WALLNUT: 30
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  currentWave: 0,
  sun: 0,
  plantFood: 3,
  selectedPlantType: null,
  cursorRow: 2,
  cursorCol: 4,
  plants: [],
  zombies: [],
  projectiles: [],
  sunDrops: [],
  plantCooldowns: {},
  waveTimer: 0,
  waveDelay: 0,
  levelComplete: false,
  sunTimer: 0,
  framesSinceStart: 0,
  highScore: 0
};

// Level configurations
export const LEVEL_CONFIG = [
  {
    level: 1,
    name: "Sunny Start",
    startingSun: 75,
    waves: [
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 2 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 2 }] }
    ],
    sunDropInterval: 10,
    availablePlants: [PLANT_TYPES.SUNFLOWER, PLANT_TYPES.PEASHOOTER]
  },
  {
    level: 2,
    name: "Nutty Defense",
    startingSun: 50,
    waves: [
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 2 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 1 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 4 }] }
    ],
    sunDropInterval: 12,
    availablePlants: [PLANT_TYPES.SUNFLOWER, PLANT_TYPES.PEASHOOTER, PLANT_TYPES.WALLNUT]
  },
  {
    level: 3,
    name: "Pea Power",
    startingSun: 25,
    waves: [
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 2 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 2 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 4, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 4 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 3 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 4 }] }
    ],
    sunDropInterval: 15,
    availablePlants: [PLANT_TYPES.SUNFLOWER, PLANT_TYPES.PEASHOOTER, PLANT_TYPES.WALLNUT]
  },
  {
    level: 4,
    name: "Strategic Stand",
    startingSun: 0,
    waves: [
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 1 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 2 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 4 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 3 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 4, delay: 4 }] }
    ],
    sunDropInterval: 17,
    availablePlants: [PLANT_TYPES.SUNFLOWER, PLANT_TYPES.PEASHOOTER, PLANT_TYPES.WALLNUT]
  },
  {
    level: 5,
    name: "Final Frontier",
    startingSun: 0,
    waves: [
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 1 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.BASIC, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 4, delay: 2 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 2 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 0, delay: 3 }] },
      { zombies: [{ type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 3, delay: 3 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 4, delay: 4 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 2 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 3 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 4 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 2 }, { type: ZOMBIE_TYPES.BASIC, lane: 0, delay: 3 }, { type: ZOMBIE_TYPES.BASIC, lane: 4, delay: 4 }] },
      { zombies: [{ type: ZOMBIE_TYPES.CONEHEAD, lane: 0, delay: 0 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 1, delay: 1 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 2, delay: 2 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 3, delay: 3 }, { type: ZOMBIE_TYPES.CONEHEAD, lane: 4, delay: 4 }, { type: ZOMBIE_TYPES.BASIC, lane: 2, delay: 5 }] }
    ],
    sunDropInterval: 20,
    availablePlants: [PLANT_TYPES.SUNFLOWER, PLANT_TYPES.PEASHOOTER, PLANT_TYPES.WALLNUT]
  }
];

export function resetGameState() {
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.plants = [];
  gameState.zombies = [];
  gameState.projectiles = [];
  gameState.sunDrops = [];
  gameState.entities = [];
  gameState.plantCooldowns = {};
  gameState.waveTimer = 0;
  gameState.waveDelay = 10;
  gameState.levelComplete = false;
  gameState.sunTimer = 0;
  gameState.framesSinceStart = 0;
  gameState.selectedPlantType = null;
  gameState.cursorRow = 2;
  gameState.cursorCol = 4;
}

export function initializeLevel(level) {
  resetGameState();
  gameState.currentLevel = level;
  const config = LEVEL_CONFIG[level - 1];
  gameState.sun = config.startingSun;
  gameState.plantFood = 3;
  
  // Initialize cooldowns
  for (let plantType of config.availablePlants) {
    gameState.plantCooldowns[plantType] = 0;
  }
}