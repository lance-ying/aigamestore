// Game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_HEIGHT = 40;
export const PLAYER_SIZE = 30;
export const GRAVITY = 0.7;
export const JUMP_FORCE = 12;
export const SCROLL_SPEED = 5;

export const gameState = {
  player: null,
  entities: [],
  obstacles: [],
  stars: [],
  score: 0,
  distanceTraveled: 0,
  levelLength: 6000, // Level ends after this distance
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", etc.
  lastJumpFrame: 0,
  keyPressed: {}
};

// Utility functions
export function getGameState() {
  return gameState;
}

// Colors
export const COLORS = {
  background: [25, 25, 35],
  ground: [50, 50, 60],
  player: [255, 105, 180],
  obstacle: [220, 20, 60],
  star: [255, 255, 0],
  text: [255, 255, 255],
  titleText: [0, 255, 255]
};