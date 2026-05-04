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

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;

// Game timing - each hour is 60 seconds / 6 = 10 seconds real time
export const SECONDS_PER_HOUR = 10;
export const START_HOUR = 0; // 12 AM = 0
export const END_HOUR = 6; // 6 AM = 6

// Power settings
export const INITIAL_POWER = 100;
export const POWER_DRAIN_BASE = 0.08; // per frame at 60fps
export const POWER_PER_DOOR = 0.05;
export const POWER_PER_VENT = 0.03;
export const POWER_PER_HOSE = 0.02;
export const POWER_GENERATOR_COST = 15;
export const POWER_GENERATOR_GAIN = 25;
export const POWER_BOOST_GAIN = 10;

// UI positions for interactive elements
export const UI_ELEMENTS = {
  LEFT_DOOR: { x: 50, y: 200, w: 60, h: 80, label: "L Door" },
  RIGHT_DOOR: { x: 490, y: 200, w: 60, h: 80, label: "R Door" },
  LEFT_VENT: { x: 100, y: 350, w: 50, h: 40, label: "L Vent" },
  RIGHT_VENT: { x: 450, y: 350, w: 50, h: 40, label: "R Vent" },
  LEFT_HOSE: { x: 150, y: 50, w: 50, h: 40, label: "L Hose" },
  RIGHT_HOSE: { x: 400, y: 50, w: 50, h: 40, label: "R Hose" },
  GENERATOR: { x: 280, y: 350, w: 40, h: 40, label: "Gen" },
  MUSIC_BOX: { x: 500, y: 50, w: 50, h: 40, label: "Music" },
  LEFT_CAMERA: { x: 50, y: 50, w: 50, h: 40, label: "L Cam" },
  RIGHT_CAMERA: { x: 100, y: 50, w: 50, h: 40, label: "R Cam" }
};

// Animatronic types
export const ANIMATRONIC_TYPES = [
  "DOOR_LEFT",
  "DOOR_RIGHT", 
  "VENT_LEFT",
  "VENT_RIGHT",
  "HOSE_LEFT",
  "HOSE_RIGHT",
  "MUSIC_BOX",
  "CAMERA_LEFT",
  "CAMERA_RIGHT"
];

// Prize counter items
export const PRIZE_ITEMS = [
  { name: "Power Boost", cost: 10, effect: "power_boost" },
  { name: "Door Lock", cost: 15, effect: "door_lock" },
  { name: "Vent Seal", cost: 12, effect: "vent_seal" }
];

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  player: null,
  
  // Time tracking
  currentHour: START_HOUR,
  framesSinceHourStart: 0,
  
  // Power management
  power: INITIAL_POWER,
  powerDrainRate: POWER_DRAIN_BASE,
  
  // UI system states
  systems: {
    leftDoor: false,
    rightDoor: false,
    leftVent: false,
    rightVent: false,
    leftHose: false,
    rightHose: false,
    generator: false,
    musicBox: 100, // 0-100, drains over time
    leftCamera: false,
    rightCamera: false
  },
  
  // Selected UI element
  selectedElement: "LEFT_DOOR",
  
  // Animatronics
  animatronics: [],
  
  // Economy
  fazCoins: 0,
  inventory: [],
  prizeCounterOpen: false,
  selectedPrizeIndex: 0,
  
  // Active effects
  activeEffects: {
    doorLockTimer: 0,
    ventSealTimer: 0
  },
  
  // Statistics
  score: 0,
  jumpscaresAvoided: 0,
  coinsCollected: 0,
  
  // Testing
  testingData: {
    framesSurvived: 0,
    lastActionFrame: 0,
    positionHistory: []
  }
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}