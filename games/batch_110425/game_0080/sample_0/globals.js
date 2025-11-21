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

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  bullets: [],
  enemyBullets: [],
  pickups: [],
  particles: [],
  score: 0,
  level: 1,
  wave: 1,
  enemiesInWave: 0,
  enemiesDefeated: 0,
  totalEnemiesForWave: 0,
  waveComplete: false,
  exitPortal: null,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  frameCount: 0,
  lastDashTime: -1000,
  lastShieldTime: -1000,
  shieldCharges: 3,
  autoFireEnabled: true,
  dungeonSeed: 42,
  cameraX: 0,
  cameraY: 0
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

if (typeof window !== 'undefined') {
  window.setControlMode = setControlMode;
}