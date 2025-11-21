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

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";
export const CONTROL_TEST_3 = "TEST_3";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_Z = 90;

// Game constants
export const NIGHT_DURATION = 360; // 6 hours * 60 seconds (scaled down for gameplay)
export const HOUR_DURATION = NIGHT_DURATION / 6; // Each in-game hour
export const MAX_NIGHTS = 5;

// Camera locations
export const CAMERA_LOCATIONS = [
  { id: 0, name: "CAM 01", x: 100, y: 100 },
  { id: 1, name: "CAM 02", x: 300, y: 100 },
  { id: 2, name: "CAM 03", x: 500, y: 100 },
  { id: 3, name: "CAM 04", x: 100, y: 250 },
  { id: 4, name: "CAM 05", x: 300, y: 250 },
  { id: 5, name: "CAM 06", x: 500, y: 250 }
];

// System types
export const SYSTEM_AUDIO = "AUDIO";
export const SYSTEM_CAMERA = "CAMERA";
export const SYSTEM_VENTILATION = "VENTILATION";

// Springtrap states
export const SPRINGTRAP_IDLE = "IDLE";
export const SPRINGTRAP_MOVING = "MOVING";
export const SPRINGTRAP_AT_VENT = "AT_VENT";
export const SPRINGTRAP_AT_OFFICE = "AT_OFFICE";

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  
  // Night progress
  currentNight: 1,
  timeElapsed: 0,
  currentHour: 0,
  
  // Player state
  player: null,
  tabletOpen: false,
  selectedCamera: 0,
  selectedSystem: null, // 'audio', 'vent', 'maintenance'
  
  // Springtrap state
  springtrap: null,
  
  // Systems
  systems: {
    audio: { working: true, cooldown: 0 },
    camera: { working: true, cooldown: 0 },
    ventilation: { working: true, cooldown: 0 }
  },
  
  // Vents
  vents: {
    left: { sealed: false, cooldown: 0 },
    right: { sealed: false, cooldown: 0 }
  },
  
  // Phantom appearances
  phantomTimer: 0,
  phantomActive: false,
  
  // Entities
  entities: [],
  
  // UI state
  rebootingSystem: null,
  rebootProgress: 0,
  
  // Tracking
  lastSpringtrapCheck: 0,
  audioLureUsed: 0,
  ventSealsUsed: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}