// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Seasons
export const SEASONS = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];
export const SEASON_COLORS = {
  SPRING: [144, 238, 144],
  SUMMER: [255, 223, 0],
  AUTUMN: [255, 140, 0],
  WINTER: [176, 224, 230]
};

// Resource types
export const RESOURCE_BERRY = "BERRY";
export const RESOURCE_TWIG = "TWIG";
export const RESOURCE_RESIN = "RESIN";
export const RESOURCE_PEBBLE = "PEBBLE";

// Card types
export const CARD_TYPE_CONSTRUCTION = "CONSTRUCTION";
export const CARD_TYPE_CRITTER = "CRITTER";

// Action types
export const ACTION_PLACE_WORKER = "PLACE_WORKER";
export const ACTION_PLAY_CARD = "PLAY_CARD";
export const ACTION_PREPARE_SEASON = "PREPARE_SEASON";

// UI States
export const UI_STATE_SELECT_ACTION = "SELECT_ACTION";
export const UI_STATE_SELECT_LOCATION = "SELECT_LOCATION";
export const UI_STATE_SELECT_CARD = "SELECT_CARD";

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentSeason: 0, // 0=SPRING, 1=SUMMER, 2=AUTUMN, 3=WINTER
  turnNumber: 0,
  
  resources: {
    [RESOURCE_BERRY]: 0,
    [RESOURCE_TWIG]: 0,
    [RESOURCE_RESIN]: 0,
    [RESOURCE_PEBBLE]: 0
  },
  
  workers: [],
  availableWorkers: 2, // Start with 2 workers
  
  city: [], // Cards played
  hand: [], // Cards in hand
  deck: [], // Remaining cards
  
  locations: [], // Worker placement locations
  
  uiState: UI_STATE_SELECT_ACTION,
  selectedActionIndex: 0,
  selectedLocationIndex: 0,
  selectedCardIndex: 0,
  
  message: "",
  messageTimer: 0
};

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
}

window.setControlMode = setControlMode;