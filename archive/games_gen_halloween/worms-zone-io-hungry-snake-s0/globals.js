// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const ARENA_RADIUS = 180;
export const ARENA_CENTER_X = CANVAS_WIDTH / 2;
export const ARENA_CENTER_Y = CANVAS_HEIGHT / 2;

export const WORM_SEGMENT_SIZE = 8;
export const INITIAL_WORM_LENGTH = 10;
export const FOOD_SIZE = 6;
export const FOOD_MASS_VALUE = 5;
export const POWERUP_SIZE = 12;
export const BOOST_MASS_COST = 0.167; // 10 mass per second at 60fps
export const BOOST_SPEED_MULTIPLIER = 1.8;
export const NORMAL_SPEED = 2.5;

export const GAME_DURATION = 180; // 3 minutes in seconds
export const AI_WORM_COUNT = 3;
export const FOOD_COUNT = 80;
export const POWERUP_SPAWN_INTERVAL = 300; // frames

export const gameState = {
  player: null,
  entities: [],
  aiWorms: [],
  foods: [],
  powerups: [],
  score: 0,
  mass: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  gameStartTime: 0,
  elapsedTime: 0,
  leaderboard: [],
  frameCounter: 0,
  nextPowerupSpawn: POWERUP_SPAWN_INTERVAL,
  activePowerups: {
    magnet: 0,
    shield: 0
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;