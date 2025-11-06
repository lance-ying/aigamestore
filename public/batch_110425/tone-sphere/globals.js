// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const NOTE_TYPES = {
  CIRCLE: "CIRCLE",      // Space key
  ARROW_UP: "ARROW_UP",       // Up arrow
  ARROW_DOWN: "ARROW_DOWN",   // Down arrow
  ARROW_LEFT: "ARROW_LEFT",   // Left arrow
  ARROW_RIGHT: "ARROW_RIGHT", // Right arrow
  SQUARE: "SQUARE",      // Z key
  TRIANGLE: "TRIANGLE"   // Shift key
};

export const KEY_BINDINGS = {
  32: NOTE_TYPES.CIRCLE,    // Space
  38: NOTE_TYPES.ARROW_UP,      // Up arrow
  40: NOTE_TYPES.ARROW_DOWN,    // Down arrow
  37: NOTE_TYPES.ARROW_LEFT,    // Left arrow
  39: NOTE_TYPES.ARROW_RIGHT,   // Right arrow
  90: NOTE_TYPES.SQUARE,    // Z
  16: NOTE_TYPES.TRIANGLE   // Shift
};

export const HIT_GRADES = {
  PERFECT: { name: "PERFECT", score: 100, healthBonus: 2, window: 15 },
  GREAT: { name: "GREAT", score: 75, healthBonus: 1, window: 30 },
  GOOD: { name: "GOOD", score: 50, healthBonus: 0, window: 50 },
  MISS: { name: "MISS", score: 0, healthBonus: -10, window: Infinity }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  notes: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  health: 100,
  maxHealth: 100,
  currentSongIndex: 0,
  songsCompleted: 0,
  totalNotesHit: 0,
  totalNotes: 0,
  perfectHits: 0,
  greatHits: 0,
  goodHits: 0,
  missedHits: 0,
  lastHitGrade: null,
  lastHitTime: 0,
  songProgress: 0,
  difficultyLevel: 1,
  noteSpeed: 2.0,
  spawnTimer: 0,
  spawnInterval: 60,
  songDuration: 1800, // 30 seconds at 60 FPS
  framesSinceStart: 0
};

// Function to expose gameState globally
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}