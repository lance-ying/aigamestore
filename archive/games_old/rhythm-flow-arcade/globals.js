// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Lane configuration
export const NUM_LANES = 4;
export const LANE_WIDTH = 100;
export const LANE_START_X = 100;
export const HIT_ZONE_Y = 320;
export const HIT_ZONE_HEIGHT = 60;

// Note dimensions
export const NOTE_WIDTH = 80;
export const NOTE_HEIGHT = 50;

// Timing windows (in milliseconds)
export const TIMING_PERFECT = 50;
export const TIMING_GREAT = 100;
export const TIMING_GOOD = 150;

// Lane colors
export const LANE_COLORS = [
  [255, 80, 80],   // Red - Lane 0
  [80, 150, 255],  // Blue - Lane 1
  [80, 255, 120],  // Green - Lane 2
  [255, 220, 80]   // Yellow - Lane 3
];

// Key bindings (default)
export const DEFAULT_KEY_BINDINGS = {
  0: 65, // A - Lane 0
  1: 83, // S - Lane 1
  2: 68, // D - Lane 2
  3: 87  // W - Lane 3
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  lifeBar: 100,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER, LEVEL_COMPLETE
  controlMode: "HUMAN",
  currentLevel: 1,
  totalLevels: 5,
  songTimeElapsed: 0,
  songStartTime: 0,
  activeNotes: [],
  chartIndex: 0,
  currentChart: [],
  keyState: {},
  keyBindings: { ...DEFAULT_KEY_BINDINGS },
  accuracyCount: {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0
  },
  recentHitFeedback: [],
  particleEffects: [],
  unlockedLevels: 1
};

// Score values
export const SCORE_VALUES = {
  perfect: 200,
  great: 100,
  good: 50,
  miss: 0,
  holdInterval: 10
};

// Life bar changes
export const LIFE_CHANGES = {
  perfect: 15,
  great: 10,
  good: 5,
  miss: -25,
  holdInterval: 2
};

// Combo multiplier calculation
export function getComboMultiplier(combo) {
  const multiplier = 1.0 + Math.floor(combo / 10) * 0.1;
  return Math.min(multiplier, 2.0);
}

// Expose game state getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}