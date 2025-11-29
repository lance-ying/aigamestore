// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Isometric constants
export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;
export const ISO_ANGLE = Math.PI / 6;

// Water levels
export const WATER_LEVEL_HIGH = 3;
export const WATER_LEVEL_MID = 2;
export const WATER_LEVEL_LOW = 1;
export const WATER_LEVEL_NONE = 0;

// Entity types
export const ENTITY_GIRL = "girl";
export const ENTITY_LANTERN = "lantern";
export const ENTITY_STELE = "stele";
export const ENTITY_CRYSTAL = "crystal";
export const ENTITY_PLATFORM = "platform";
export const ENTITY_SWITCH = "switch";
export const ENTITY_ROBOT = "robot";
export const ENTITY_CORE = "core";
export const ENTITY_EXIT = "exit";

// Game state - single source of truth
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  moves: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  currentLevel: 1,
  maxLevel: 9,
  waterLevel: WATER_LEVEL_HIGH,
  collectedCores: 0,
  activatedRobots: 0,
  totalCores: 3,
  totalRobots: 2,
  selectedInteractiveIndex: 0,
  nearbyInteractives: [],
  levelComplete: false,
  transition: {
    active: false,
    progress: 0,
    duration: 60
  }
};

// Global accessor for game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}