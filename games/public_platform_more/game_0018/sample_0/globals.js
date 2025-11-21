// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 3;
export const SPRINT_MULTIPLIER = 1.5;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Game state object
export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  hazards: [],
  collectibles: [],
  chests: [],
  currentLevel: 0,
  score: 0,
  sacredStones: 0,
  totalStones: 6, // Total stones needed to win
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  health: 100,
  maxHealth: 100,
  invincibilityFrames: 0,
  mathPuzzle: null,
  puzzleActive: false,
  levelComplete: false,
  hasSpyglass: false,
  levelData: [],
  camera: { x: 0, y: 0 }
};

// Control mode management
export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.setControlMode = setControlMode;
  window.getGameState = () => gameState;
}