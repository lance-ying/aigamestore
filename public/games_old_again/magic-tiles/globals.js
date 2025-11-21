// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const LANE_COUNT = 4;
export const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;
export const TARGET_ZONE_HEIGHT = 50;
export const TARGET_ZONE_Y = CANVAS_HEIGHT - TARGET_ZONE_HEIGHT;
export const TILE_HEIGHT = 120;
export const PERFECT_SCORE = 10;
export const GOOD_SCORE = 5;
export const WIN_SCORE = 500;
export const STARTING_SPEED = 3;
export const MAX_SPEED = 12;
export const SPEED_INCREMENT = 0.5;
export const SPEED_INCREASE_THRESHOLD = 100;
export const TAP_DEBOUNCE_MS = 150; // Minimum time between taps for same lane
export const MAX_HEALTH = 3;

// Game state object
export const gameState = {
  player: {
    score: 0,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    lastHitTime: 0,
    health: MAX_HEALTH
  },
  tiles: [],
  gamePhase: "START",
  controlMode: "HUMAN",
  speed: STARTING_SPEED,
  lastSpawnTime: 0,
  spawnInterval: 60,
  spawnCountdown: 60,
  difficultyLevel: 1,
  damageFlash: 0,
  lanes: Array(LANE_COUNT).fill().map(() => ({
    active: false,
    lastPressed: 0,
    lastTapTime: 0, // For debouncing
    pressAnimation: 0,
    glowIntensity: 0
  }))
};

// Lane to key mapping
export const LANE_KEYS = {
  0: 40, // DOWN arrow for leftmost lane
  1: 37, // LEFT arrow for second lane
  2: 38, // UP arrow for third lane
  3: 39  // RIGHT arrow for rightmost lane
};

// Get game state function for testing
export function getGameState() {
  return gameState;
}

// Set control mode function
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : `test_${mode.split('_')[1]}_ModeBtn`
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Expose functions globally
window.getGameState = getGameState;
window.setControlMode = setControlMode;