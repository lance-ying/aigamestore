// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Control modes
export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

// Key codes
export const KEYS = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  R: 82,
  SHIFT: 16,
  Z: 90
};

// Colors
export const COLORS = {
  BACKGROUND: [20, 20, 30],
  TEXT: [255, 255, 255],
  TITLE: [220, 50, 50],
  VIRUS: [220, 50, 50],
  HEALTHY: [100, 200, 100],
  INFECTED: [220, 50, 50],
  MENU_BG: [40, 40, 50],
  MENU_SELECTED: [70, 70, 90],
  CURE_PROGRESS: [50, 150, 220],
  DNA_POINTS: [150, 220, 50],
  COUNTRY_OUTLINE: [100, 100, 120],
  COUNTRY_HIGHLIGHT: [150, 150, 170],
  INFO_PANEL: [30, 30, 40, 200]
};

// Game settings
export const GAME_SETTINGS = {
  STARTING_DNA: 10,
  CURE_START_PERCENTAGE: 0,
  CURE_SPEED_BASE: 0.01,
  DNA_GAIN_RATE: 0.2,
  INFECTION_SPREAD_RATE: 0.005
};

// Evolution categories
export const EVOLUTION_CATEGORIES = {
  TRANSMISSION: "Transmission",
  SYMPTOMS: "Symptoms",
  RESISTANCES: "Resistances"
};

// Game state object
export const gameState = {
  player: null,
  gamePhase: PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  countries: [],
  totalPopulation: 0,
  infectedPopulation: 0,
  dnaPoints: GAME_SETTINGS.STARTING_DNA,
  cureProgress: GAME_SETTINGS.CURE_START_PERCENTAGE,
  evolutionMenu: {
    categories: [
      EVOLUTION_CATEGORIES.TRANSMISSION,
      EVOLUTION_CATEGORIES.SYMPTOMS,
      EVOLUTION_CATEGORIES.RESISTANCES
    ],
    selectedCategory: 0,
    selectedUpgrade: 0,
    showInfo: false
  },
  evolutions: {
    [EVOLUTION_CATEGORIES.TRANSMISSION]: [],
    [EVOLUTION_CATEGORIES.SYMPTOMS]: [],
    [EVOLUTION_CATEGORIES.RESISTANCES]: []
  },
  framesSinceLastDnaGain: 0,
  lastKeyPressed: null
};

// Function to get game state (for testing)
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;

// Function to set control mode
export function setControlMode(mode) {
  if (Object.values(CONTROL_MODES).includes(mode)) {
    gameState.controlMode = mode;
    
    // Update button states
    const buttons = document.querySelectorAll('.control-button');
    buttons.forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                         document.getElementById(`test_${mode.split('_')[1]}_ModeBtn`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}

// Expose the setControlMode function globally
window.setControlMode = setControlMode;