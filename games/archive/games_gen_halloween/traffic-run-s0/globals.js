// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Player constants
export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 50;
export const PLAYER_ACCELERATION = 0.15;
export const PLAYER_MAX_SPEED = 8;
export const PLAYER_FRICTION = 0.98;

// Intersection constants
export const INTERSECTION_HEIGHT = 150;
export const INTERSECTION_Y_START = 150;
export const LANES_PER_INTERSECTION = 3;
export const LANE_HEIGHT = INTERSECTION_HEIGHT / LANES_PER_INTERSECTION;

// Traffic constants
export const TRAFFIC_CAR_WIDTH = 50;
export const TRAFFIC_CAR_HEIGHT = 30;
export const BASE_TRAFFIC_SPEED = 3;
export const BASE_SPAWN_INTERVAL = 90; // frames between spawns

// Coin constants
export const COIN_RADIUS = 12;
export const COIN_SPAWN_CHANCE = 0.4; // 40% chance per intersection

// Difficulty scaling
export const SPEED_INCREASE_PER_LEVEL = 0.3;
export const SPAWN_DECREASE_PER_LEVEL = 10; // frames
export const MIN_SPAWN_INTERVAL = 30;

// Scoring
export const POINTS_PER_CROSSING = 100;
export const POINTS_PER_COIN = 50;

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  player: null,
  entities: [],
  trafficCars: [],
  coins: [],
  score: 0,
  crossingsCompleted: 0,
  currentDifficulty: 1,
  isAccelerating: false,
  canAccelerate: true,
  intersectionY: INTERSECTION_Y_START,
  trafficSpawnTimer: 0,
  currentSpawnInterval: BASE_SPAWN_INTERVAL,
  currentTrafficSpeed: BASE_TRAFFIC_SPEED,
  lastLoggedPlayerY: 0,
  framesSinceLastCrossing: 0
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;