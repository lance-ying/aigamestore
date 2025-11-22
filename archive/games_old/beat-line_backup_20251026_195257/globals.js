// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  currentLevel: 0,
  levelScore: 0,
  perfectStreak: 0,
  cameraOffset: 0,
  trackSegments: [],
  obstacles: [],
  turnPoints: [],
  nextTurnIndex: 0,
  levelStartTime: 0,
  gameTime: 0,
  lastTapTime: 0,
  tapFeedback: [],
  particles: [],
  beatPulse: 0,
  gameOverReason: ""
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}