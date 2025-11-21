// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const GROUND_Y = 350;

export const gameState = {
  player: null,
  entities: [],
  coins: [],
  enemies: [],
  platforms: [],
  pickups: [],
  camera: { x: 0, y: 0 },
  score: 0,
  timeElapsed: 0,
  parTime: 30, // seconds
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3"
  currentStage: 1,
  currentWorld: 1,
  stageProgress: {}, // tracks ranks achieved per stage
  damageStreak: 0,
  totalCoins: 0,
  coinsCollected: 0,
  hitsTaken: 0,
  goalReached: false,
  stageStartTime: 0,
  health: 3,
  maxHealth: 3,
  positionHistory: []
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;