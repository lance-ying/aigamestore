// Global constants and state management
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  coins: [],
  cloverleaves: [],
  platforms: [],
  flag: null,
  score: 0,
  level: 1,
  playerHealth: 3,
  maxHealth: 3,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  keys: {},
  jumpStartTime: 0,
  isJumping: false,
  groundContactCount: 0,
  camera: { x: 0, y: 0 },
  levelWidth: 1200,
  testState: {
    startTime: 0,
    phase: 'move_right',
    moveStartTime: 0,
    jumpTestCount: 0,
    enemyTestComplete: false,
    coinTestComplete: false,
    fallTestComplete: false
  }
};

export function getGameState() {
  return gameState;
}

// Expose globally
window.getGameState = getGameState;

// Control mode management
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const modeBtn = document.getElementById(`${mode.toLowerCase()}ModeBtn`);
  if (modeBtn) {
    modeBtn.classList.add('active');
  }
}

window.setControlMode = setControlMode;

export const COLORS = {
  SKY_BLUE: [135, 206, 235],
  GRASS_GREEN: [34, 139, 34],
  BROWN: [139, 69, 19],
  LEPRECHAUN_GREEN: [0, 128, 0],
  LEPRECHAUN_HAT: [0, 100, 0],
  GOLD: [255, 215, 0],
  CLOVER_GREEN: [0, 255, 0],
  ENEMY_RED: [255, 69, 0],
  FLAG_RED: [220, 20, 60],
  FLAG_POLE: [101, 67, 33],
  WHITE: [255, 255, 255],
  BLACK: [0, 0, 0]
};