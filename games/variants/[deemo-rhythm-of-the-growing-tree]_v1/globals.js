// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_LOADING_LEVEL = "LOADING_LEVEL";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Gameplay constants
export const JUDGMENT_LINE_Y = 340;
export const NUM_LANES = 4;
export const LANE_WIDTH = CANVAS_WIDTH / NUM_LANES;
export const NOTE_SPEED = 2.5;
export const NOTE_SIZE = 40;
export const PERFECT_TIMING = 15;
export const GREAT_TIMING = 30;
export const GOOD_TIMING = 50;
export const MAX_MISSES = 5;

// Tree growth constants
export const TREE_BASE_X = CANVAS_WIDTH / 2;
export const TREE_BASE_Y = CANVAS_HEIGHT - 50;
export const TREE_HEIGHT_TARGET = 20; // meters (milestone, not end)
export const TREE_HEIGHT_STORY_1 = 5;
export const TREE_HEIGHT_STORY_2 = 10;
export const TREE_HEIGHT_STORY_3 = 15;

// Note types
export const NOTE_TYPE_SINGLE = "SINGLE";
export const NOTE_TYPE_HOLD = "HOLD";
export const NOTE_TYPE_SWIPE = "SWIPE";
export const NOTE_TYPE_HEART = "HEART";

// Song difficulty
export const DIFFICULTY_EASY = "EASY";
export const DIFFICULTY_NORMAL = "NORMAL";
export const DIFFICULTY_HARD = "HARD";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  notes: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  treeHeight: 0, // in meters
  gamePhase: PHASE_START,
  controlMode: "HUMAN", // Default to HUMAN mode
  currentSong: null,
  currentDifficulty: DIFFICULTY_EASY,
  unlockedSongs: 1,
  storyProgress: 0,
  perfectHits: 0,
  greatHits: 0,
  goodHits: 0,
  missedHits: 0,
  missesInLevel: 0,
  lives: MAX_MISSES, // Allowable misses remaining
  songComplete: false,
  songsCompleted: 0,
  framesSinceStart: 0,
  loadingFrame: 0,
  holdingNote: null,
  lastNoteSpawnFrame: 0,
  notesHitThisSong: 0,
  totalNotesThisSong: 0
};

// Global reference to p5 instance
export let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}