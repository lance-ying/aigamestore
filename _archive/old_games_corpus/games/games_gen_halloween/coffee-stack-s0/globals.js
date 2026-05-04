// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const NUM_LANES = 3;
export const LANE_WIDTH = CANVAS_WIDTH / NUM_LANES;

export const GAME_LENGTH = 2000; // How far the player travels

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  distanceTraveled: 0,
  cupsCollected: 0,
  obstaclesHit: 0,
  gatesPassed: 0,
  servingPhase: false,
  servingIndex: 0,
  servingTimer: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) activeBtn.classList.add('active');
}

window.setControlMode = setControlMode;