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

// Player constants
export const PLAYER_SIZE = 16;
export const PLAYER_SPEED = 2.5;
export const PLAYER_SPRINT_SPEED = 4.5;
export const PLAYER_MAX_STAMINA = 100;
export const PLAYER_STAMINA_DRAIN = 0.8;
export const PLAYER_STAMINA_REGEN = 0.4;
export const PLAYER_MAX_BATTERY = 100;
export const PLAYER_BATTERY_DRAIN = 0.3;
export const PLAYER_BATTERY_REGEN = 0.15;

// Spirit constants
export const SPIRIT_SIZE = 20;
export const SPIRIT_SPEED = 1.2;
export const SPIRIT_CHASE_SPEED = 2.8;
export const SPIRIT_DETECTION_RANGE = 100;
export const SPIRIT_FLASHLIGHT_STUN_TIME = 120; // frames

// Evidence constants
export const EVIDENCE_SIZE = 12;
export const EVIDENCE_COLLECT_RANGE = 30;
export const TOTAL_EVIDENCE = 8;

// Flashlight constants
export const FLASHLIGHT_RANGE = 120;
export const FLASHLIGHT_ANGLE = Math.PI / 3;

// Game state object
export const gameState = {
  player: null,
  spirits: [],
  evidence: [],
  walls: [],
  entities: [],
  score: 0,
  evidenceCollected: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  frameCount: 0,
  camera: { x: 0, y: 0 },
  worldWidth: 1200,
  worldHeight: 800
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}