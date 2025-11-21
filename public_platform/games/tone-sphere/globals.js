// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Note types
export const NOTE_TYPE_REGULAR = "CIRCLE";
export const NOTE_TYPE_CIRCLE = "CIRCLE";
export const NOTE_TYPE_ARROW = "ARROW";
export const NOTE_TYPE_ARROW_UP = "ARROW_UP";
export const NOTE_TYPE_ARROW_DOWN = "ARROW_DOWN";
export const NOTE_TYPE_ARROW_LEFT = "ARROW_LEFT";
export const NOTE_TYPE_ARROW_RIGHT = "ARROW_RIGHT";
export const NOTE_TYPE_HOLD = "TRIANGLE";
export const NOTE_TYPE_SPECIAL = "SQUARE";
export const NOTE_TYPE_SQUARE = "SQUARE";
export const NOTE_TYPE_TRIANGLE = "TRIANGLE";

// Hit grades
export const HIT_PERFECT = "PERFECT";
export const HIT_GREAT = "GREAT";
export const HIT_GOOD = "GOOD";
export const HIT_MISS = "MISS";

// Gameplay constants
export const TARGET_RADIUS = 40;
export const TARGET_INNER_RADIUS = 10;
export const PERFECT_RANGE = 15;
export const GREAT_RANGE = 30;
export const GOOD_RANGE = 50;

export const GAME_PHASES = {
  START: PHASE_START,
  PLAYING: PHASE_PLAYING,
  PAUSED: PHASE_PAUSED,
  GAME_OVER_WIN: PHASE_GAME_OVER_WIN,
  GAME_OVER_LOSE: PHASE_GAME_OVER_LOSE
};

export const NOTE_TYPES = {
  CIRCLE: NOTE_TYPE_CIRCLE,
  ARROW_UP: NOTE_TYPE_ARROW_UP,
  ARROW_DOWN: NOTE_TYPE_ARROW_DOWN,
  ARROW_LEFT: NOTE_TYPE_ARROW_LEFT,
  ARROW_RIGHT: NOTE_TYPE_ARROW_RIGHT,
  SQUARE: NOTE_TYPE_SQUARE,
  TRIANGLE: NOTE_TYPE_TRIANGLE
};

export const KEY_BINDINGS = {
  32: NOTE_TYPE_CIRCLE,    // Space
  38: NOTE_TYPE_ARROW_UP,      // Up arrow
  40: NOTE_TYPE_ARROW_DOWN,    // Down arrow
  37: NOTE_TYPE_ARROW_LEFT,    // Left arrow
  39: NOTE_TYPE_ARROW_RIGHT,   // Right arrow
  90: NOTE_TYPE_SQUARE,    // Z
  16: NOTE_TYPE_TRIANGLE   // Shift
};

export const HIT_GRADES = {
  PERFECT: { name: HIT_PERFECT, score: 100, healthBonus: 2, window: PERFECT_RANGE },
  GREAT: { name: HIT_GREAT, score: 75, healthBonus: 1, window: GREAT_RANGE },
  GOOD: { name: HIT_GOOD, score: 50, healthBonus: 0, window: GOOD_RANGE },
  MISS: { name: HIT_MISS, score: 0, healthBonus: -10, window: Infinity }
};

export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  notes: [],
  particles: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  health: 100,
  maxHealth: 100,
  currentSongIndex: 0,
  currentDifficulty: 1,
  songsCompleted: 0,
  totalNotesHit: 0,
  totalNotes: 0,
  notesHit: 0,
  notesMissed: 0,
  perfectHits: 0,
  greatHits: 0,
  goodHits: 0,
  missedHits: 0,
  lastHitGrade: null,
  lastHitTime: 0,
  lastJudgment: null,
  judgmentTimer: 0,
  songProgress: 0,
  difficultyLevel: 1,
  noteSpeed: 2.0,
  spawnTimer: 0,
  spawnInterval: 60,
  songDuration: 1800, // 30 seconds at 60 FPS
  framesSinceStart: 0,
  currentSong: null,
  songStartTime: 0,
  activeHoldNotes: new Set(),
  backgroundColor: [20, 15, 30]
};

// Function to set control mode
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Function to expose gameState globally
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
  window.setControlMode = setControlMode;
}