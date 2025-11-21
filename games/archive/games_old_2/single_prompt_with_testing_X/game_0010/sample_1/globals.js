// globals.js
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
export const PLAYER_SIZE = 20;
export const PLAYER_START_X = 300;
export const PLAYER_START_Y = 320;
export const PLAYER_SPEED = 4;
export const INITIAL_NECK_LENGTH = 5;
export const MIN_NECK_LENGTH = 1;
export const MAX_NECK_LENGTH = 50;

// Course constants
export const COURSE_SPEED = 2;
export const COURSE_WIDTH = 400;
export const COURSE_X_OFFSET = 100;

// Ring constants
export const RING_RADIUS = 15;
export const RING_SPAWN_INTERVAL = 90; // frames
export const CORRECT_RING_BONUS = 1;
export const WRONG_RING_PENALTY = 2;

// Obstacle constants
export const OBSTACLE_HEIGHT = 60;
export const ZIPLINE_MIN_NECK = 15;
export const POOL_MIN_NECK = 10;
export const HURDLE_MIN_NECK = 8;

// Color system
export const COLORS = {
  RED: { name: 'RED', rgb: [255, 80, 80], display: 'Red' },
  BLUE: { name: 'BLUE', rgb: [80, 150, 255], display: 'Blue' },
  GREEN: { name: 'GREEN', rgb: [80, 255, 120], display: 'Green' },
  YELLOW: { name: 'YELLOW', rgb: [255, 220, 80], display: 'Yellow' }
};

export const COLOR_KEYS = Object.keys(COLORS);

// Game state object
export const gameState = {
  player: null,
  entities: [],
  rings: [],
  obstacles: [],
  particles: [],
  score: 0,
  distance: 0,
  gems: 0,
  totalGems: 0,
  neckLength: INITIAL_NECK_LENGTH,
  currentColor: 'RED',
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  frameCounter: 0,
  lastRingSpawn: 0,
  lastObstacleSpawn: 0,
  difficulty: 1,
  courseSpeed: COURSE_SPEED,
  positionHistory: []
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}