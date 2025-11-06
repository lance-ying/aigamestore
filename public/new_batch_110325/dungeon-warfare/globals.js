// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 20;
export const GRID_COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
export const GRID_ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Trap types
export const TRAP_ARROW = "ARROW";
export const TRAP_SPIKE = "SPIKE";
export const TRAP_FIRE = "FIRE";
export const TRAP_ICE = "ICE";

// Enemy types
export const ENEMY_BASIC = "BASIC";
export const ENEMY_FAST = "FAST";
export const ENEMY_TANK = "TANK";

export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  traps: [],
  enemies: [],
  path: [],
  cursor: { x: 0, y: 0 },
  gold: 100,
  xp: 0,
  level: 1,
  wave: 0,
  maxWaves: 5,
  enemiesEscaped: 0,
  maxEscaped: 20,
  enemiesKilled: 0,
  waveInProgress: false,
  waveTimer: 0,
  waveDelay: 180, // 3 seconds at 60 FPS
  showTrapMenu: false,
  selectedTrap: null,
  hoveredTrap: null,
  skillPoints: 0,
  skills: {
    damage: 0,
    range: 0,
    goldBonus: 0
  }
};

// Trap definitions
export const TRAP_DEFINITIONS = {
  [TRAP_ARROW]: {
    name: "Arrow Trap",
    cost: 50,
    damage: 20,
    range: 60,
    cooldown: 60,
    color: [180, 100, 50]
  },
  [TRAP_SPIKE]: {
    name: "Spike Trap",
    cost: 40,
    damage: 15,
    range: 25,
    cooldown: 30,
    color: [120, 120, 120]
  },
  [TRAP_FIRE]: {
    name: "Fire Trap",
    cost: 80,
    damage: 10,
    range: 50,
    cooldown: 20,
    color: [255, 100, 0]
  },
  [TRAP_ICE]: {
    name: "Ice Trap",
    cost: 70,
    damage: 5,
    range: 60,
    cooldown: 90,
    color: [100, 200, 255]
  }
};

// Enemy definitions
export const ENEMY_DEFINITIONS = {
  [ENEMY_BASIC]: {
    name: "Goblin",
    hp: 50,
    speed: 1,
    goldReward: 10,
    xpReward: 5,
    color: [100, 200, 100]
  },
  [ENEMY_FAST]: {
    name: "Scout",
    hp: 30,
    speed: 2,
    goldReward: 15,
    xpReward: 8,
    color: [200, 200, 100]
  },
  [ENEMY_TANK]: {
    name: "Ogre",
    hp: 150,
    speed: 0.5,
    goldReward: 30,
    xpReward: 15,
    color: [200, 100, 100]
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateButtonStates();
}

window.setControlMode = setControlMode;

function updateButtonStates() {
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeId = gameState.controlMode === 'HUMAN' ? 'humanModeBtn' : 
                   gameState.controlMode === 'TEST_1' ? 'test_1_ModeBtn' :
                   gameState.controlMode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeId) {
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
}