// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 0,
  completedLevels: 0,
  inventory: [],
  selectedInventoryIndex: 0,
  selectedHotspotIndex: 0,
  levelStates: [],
  secretsFound: 0,
  totalLevels: 5, // Simplified to 5 levels for this implementation
  currentHotspots: [],
  puzzleProgress: {},
  familyTreeUnlocked: []
};

// Expose gameState getter globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateControlButtons(mode);
}

function updateControlButtons(mode) {
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

window.setControlMode = setControlMode;