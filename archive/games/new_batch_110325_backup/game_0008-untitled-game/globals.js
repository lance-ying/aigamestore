// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Mission parameters
export const MISSION_TIME_LIMIT = 120; // 120 seconds (2 minutes for playability)
export const PRIMARY_TARGETS_COUNT = 3;
export const GUARDS_COUNT = 5;
export const EXPLOSIVE_BARRELS_COUNT = 3;

// Weapon stats
export const WEAPON_DAMAGE = 100;
export const WEAPON_CLIP_SIZE = 5;
export const WEAPON_RELOAD_TIME = 120; // frames (2 seconds)

// Score values
export const SCORE_PRIMARY_TARGET = 1000;
export const SCORE_GUARD = 200;
export const SCORE_ENVIRONMENTAL_KILL = 500;
export const SCORE_HEADSHOT_BONUS = 300;
export const SCORE_STEALTH_MULTIPLIER = 1.5;

// Detection parameters
export const ALERT_THRESHOLD_LOW = 20;
export const ALERT_THRESHOLD_MEDIUM = 50;
export const ALERT_THRESHOLD_HIGH = 100;

// Zoom levels
export const ZOOM_NORMAL = 1;
export const ZOOM_2X = 2;
export const ZOOM_4X = 4;

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  
  // Player/Crosshair
  crosshair: null,
  
  // Mission data
  missionTimer: MISSION_TIME_LIMIT * FPS,
  score: 0,
  multiplier: 1,
  alertLevel: 0,
  
  // Targets and entities
  primaryTargets: [],
  guards: [],
  explosiveBarrels: [],
  bullets: [],
  effects: [],
  
  // Weapon state
  currentAmmo: WEAPON_CLIP_SIZE,
  isReloading: false,
  reloadTimer: 0,
  
  // Zoom state
  zoomLevel: ZOOM_NORMAL,
  
  // Stats
  targetsEliminated: 0,
  guardsEliminated: 0,
  environmentalKills: 0,
  headshotCount: 0,
  shotsAttempted: 0,
  
  // Input state
  keys: {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    shift: false,
    z: false
  }
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}