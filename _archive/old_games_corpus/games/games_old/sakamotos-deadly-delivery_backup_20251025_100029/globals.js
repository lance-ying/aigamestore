// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER", "PAUSED"
  controlMode: "HUMAN",
  currentLevel: 0,
  designPhase: true,
  simulationRunning: false,
  packageInGoal: false,
  packageInGoalTime: 0,
  timeRemaining: 0,
  objectsPlaced: {
    block: 0,
    ramp: 0,
    spring: 0
  },
  selectedObject: 'block',
  rotationAngle: 0,
  levelStartTime: 0,
  firstAttempt: true,
  resetCount: 0,
  levelComplete: false,
  levelFailed: false,
  totalScore: 0,
  highScores: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}