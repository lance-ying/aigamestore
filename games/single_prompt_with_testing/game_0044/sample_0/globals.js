// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const EXPRESSIONS = ["NEUTRAL", "HAPPY", "SAD", "SURPRISED"];

export const REQUEST_TYPES = {
  MOVE_UP: "MOVE_UP",
  MOVE_DOWN: "MOVE_DOWN",
  MOVE_LEFT: "MOVE_LEFT",
  MOVE_RIGHT: "MOVE_RIGHT",
  EXPRESSION_HAPPY: "EXPRESSION_HAPPY",
  EXPRESSION_SAD: "EXPRESSION_SAD",
  EXPRESSION_SURPRISED: "EXPRESSION_SURPRISED",
  ACTION: "ACTION"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  followers: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  requests: [],
  missedRequests: 0,
  completedRequests: 0,
  maxMissed: 10,
  targetFollowers: 1000,
  frameCount: 0,
  lastRequestTime: 0,
  requestInterval: 180, // frames between requests
  paused: false
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};