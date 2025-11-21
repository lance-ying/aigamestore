// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.7;
export const JUMP_FORCE = -12;
export const SHIP_LIFT = -0.6; // Reduced for continuous application when key is held
export const GROUND_Y = 300;
export const SCROLL_SPEED = 5;
export const BLOCK_SIZE = 30;

// Player modes
export const PLAYER_MODES = {
  CUBE: 'cube',
  SHIP: 'ship'
};

// Game state object
export const gameState = {
  player: null,
  obstacles: [],
  portals: [],
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  level: null,
  camera: {
    x: 0
  },
  progress: 0, // Progress percentage (0-100)
  deathCount: 0,
  lives: 3, // Player has 3 lives
  currentCheckpoint: 0,
  levelLength: 0,
  startTime: 0,
  elapsedTime: 0,
  currentLevel: 1 // Current level number (1-4)
};

// Export the getGameState function
export function getGameState() {
  return gameState;
}

// Set control mode function
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
    if (button.id === 'humanModeBtn' && mode === 'HUMAN') {
      button.classList.add('active');
    } else if (button.id === `test_1_ModeBtn` && mode === 'TEST_1') {
      button.classList.add('active');
    } else if (button.id === `test_2_ModeBtn` && mode === 'TEST_2') {
      button.classList.add('active');
    } else if (button.id === `test_3_ModeBtn` && mode === 'TEST_3') {
      button.classList.add('active');
    } else if (button.id === `test_4_ModeBtn` && mode === 'TEST_4') {
      button.classList.add('active');
    } else if (button.id === `test_5_ModeBtn` && mode === 'TEST_5') {
      button.classList.add('active');
    }
  });
}

// Global keyboard state
export const keys = {
  up: false,
  space: false,
  r: false,
  enter: false,
  esc: false
};

// Expose functions globally
window.getGameState = getGameState;
window.setControlMode = setControlMode;