// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Lane configuration
export const NUM_LANES = 5;
export const LANE_WIDTH = CANVAS_WIDTH / NUM_LANES;

// Track configuration
export const TRACK_LENGTH = 3000;
export const SCROLL_SPEED = 2;

// Player configuration
export const PLAYER_START_X = CANVAS_WIDTH / 2;
export const PLAYER_START_Y = CANVAS_HEIGHT - 80;
export const PLAYER_SPEED = 4;
export const BOOST_SPEED = 7;
export const BOOST_COST = 0.5;
export const ENERGY_REGEN = 0.3;
export const MAX_ENERGY = 100;

// Stack configuration
export const CUP_HEIGHT = 12;
export const CUP_WIDTH = 20;

// Item types
export const ITEM_CUP = "CUP";
export const ITEM_COFFEE = "COFFEE";
export const ITEM_MILK = "MILK";
export const ITEM_SLEEVE = "SLEEVE";
export const ITEM_LID = "LID";

// Obstacle types
export const OBSTACLE_BARRIER = "BARRIER";
export const OBSTACLE_SPILL = "SPILL";
export const OBSTACLE_WIND = "WIND";

// Game state
export const gameState = {
  player: null,
  entities: [],
  collectibles: [],
  obstacles: [],
  customers: [],
  score: 0,
  coins: 0,
  totalCoins: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  scrollOffset: 0,
  level: 1,
  cupsCollected: 0,
  coffeeAdded: 0,
  sleevesAdded: 0,
  lidsAdded: 0,
  completedDrinks: 0,
  comboMultiplier: 1,
  lastCollectionTime: 0,
  servingPhase: false,
  servingProgress: 0,
  trackComplete: false
};

// Control mode management
export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateControlButtons();
}

function updateControlButtons() {
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = gameState.controlMode === 'HUMAN' ? 'humanModeBtn' : 
                    gameState.controlMode.toLowerCase() + '_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
}

// Expose setControlMode globally
if (typeof window !== 'undefined') {
  window.setControlMode = setControlMode;
}