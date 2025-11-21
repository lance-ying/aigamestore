// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const LANE_WIDTH = CANVAS_WIDTH / 3;
export const LANE_POSITIONS = [LANE_WIDTH / 2, LANE_WIDTH * 1.5, LANE_WIDTH * 2.5];
export const PLAYER_SIZE = 40;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -15;
export const OBSTACLE_SPEED_INITIAL = 5;
export const OBSTACLE_SPEED_INCREMENT = 0.0005;
export const OBSTACLE_SPAWN_INITIAL = 90;
export const OBSTACLE_SPAWN_MIN = 30;
export const COIN_VALUE = 10;
export const WIN_SCORE = 5000;

// Game state object
export const gameState = {
  player: null,
  obstacles: [],
  coins: [],
  score: 0,
  distance: 0,
  speed: OBSTACLE_SPEED_INITIAL,
  spawnRate: OBSTACLE_SPAWN_INITIAL,
  lastSpawn: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  lastFrameCount: 0
};

// Get game state function for external access
export function getGameState() {
  return gameState;
}