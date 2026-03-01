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
export const TAP_DEBOUNCE_MS = 150; // Minimum time between taps for same lane
export const MAX_HEALTH = 3;

// Level Configuration
export const LEVEL_CONFIG = [
  // Easy Levels
  { level: 1, name: "Easy I", speed: 4, spawnInterval: 60, notesToAdvance: 20, color: [40, 40, 40] }, // Dark Grey
  { level: 2, name: "Easy II", speed: 5, spawnInterval: 55, notesToAdvance: 30, color: [0, 100, 100] }, // Teal
  // Medium Levels
  { level: 3, name: "Medium I", speed: 7, spawnInterval: 50, notesToAdvance: 40, color: [0, 0, 150] }, // Blue
  { level: 4, name: "Medium II", speed: 8, spawnInterval: 45, notesToAdvance: 50, color: [100, 0, 150] }, // Purple
  // Hard Levels
  { level: 5, name: "Hard I", speed: 10, spawnInterval: 40, notesToAdvance: 60, color: [150, 0, 100] }, // Magenta
  { level: 6, name: "Hard II", speed: 12, spawnInterval: 35, notesToAdvance: 70, color: [150, 0, 0] }  // Red
];

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
  controlMode: "HUMAN", // Default to HUMAN mode
  speed: LEVEL_CONFIG[0].speed,
  lastSpawnTime: 0,
  spawnInterval: LEVEL_CONFIG[0].spawnInterval,
  spawnCountdown: LEVEL_CONFIG[0].spawnInterval,
  difficultyLevel: 1,
  notesHitInLevel: 0,
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

// Get game state function for testing (kept for dev_mode.js)
export function getGameState() {
  return gameState;
}

// Set control mode function (simplified as only HUMAN mode remains)
export function setControlMode(mode) {
  // Force controlMode to HUMAN as it's the only supported mode now.
  gameState.controlMode = "HUMAN";
  
  // Update button states - only the human mode button exists and should always be active.
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById('humanModeBtn');
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Expose functions globally
window.getGameState = getGameState;
window.setControlMode = setControlMode;