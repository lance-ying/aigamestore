// globals.js - Global constants and game state

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
  engine: null,
  world: null,
  currentLevel: 0,
  maxLevels: 3, // Start with 3 levels for this implementation
  checkpoint: { x: 100, y: 250 },
  levelComplete: false,
  collectibles: [],
  platforms: [],
  hazards: [],
  blocks: [],
  switches: [],
  goal: null,
  cameraOffsetX: 0,
  levelWidth: 2400, // Extended level width for scrolling
  hasDoubleJump: true,
  levelData: []
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};