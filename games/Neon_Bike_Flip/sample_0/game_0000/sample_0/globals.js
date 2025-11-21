// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  currentLevel: 1,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  distanceTraveled: 0,
  flipsInCurrentJump: 0,
  lastKnownBikeAngle: 0,
  isAirborne: false,
  totalFlips: 0,
  levelStartTime: 0,
  lastDistanceCheckpoint: 0,
  hasReachedFinish: false,
  crashPosition: null,
  levelScores: [0, 0, 0, 0, 0],
  totalScore: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}