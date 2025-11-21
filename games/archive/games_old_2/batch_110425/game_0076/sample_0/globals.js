// globals.js - Global constants and game state
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

export const VIGNETTE_TYPES = {
  CONVERSATION: "CONVERSATION",
  PUZZLE: "PUZZLE",
  CLEANING: "CLEANING",
  DATING: "DATING",
  CONFLICT: "CONFLICT",
  MOVING: "MOVING",
  REFLECTION: "REFLECTION"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentVignetteIndex: 0,
  currentVignette: null,
  completedVignettes: 0,
  totalVignettes: 0,
  vignetteProgress: 0,
  vignetteComplete: false,
  narrativeText: "",
  chapterName: "",
  transitionTimer: 0,
  storyBeats: []
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' :
                    'test_3_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};