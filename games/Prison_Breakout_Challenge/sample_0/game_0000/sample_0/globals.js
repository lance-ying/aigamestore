// globals.js - Global state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  guards: [],
  objectives: [],
  platforms: [],
  timer: 180, // 3 minutes in seconds
  score: 0,
  level: 1,
  maxLevel: 3,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER, LEVEL_COMPLETE
  gameOverReason: "",
  controlMode: "HUMAN",
  keysCollected: 0,
  objectivesCompleted: 0,
  totalObjectives: 0,
  lastFrameTime: 0,
  highScore: 0,
  levelStartTime: 0
};

// Physics constants
export const GRAVITY = 0.6;
export const PLAYER_SPEED = 4;
export const PLAYER_JUMP_FORCE = -12;
export const GUARD_PATROL_SPEED = 1.5;
export const GUARD_CHASE_SPEED = 3.5;
export const GUARD_DETECTION_RANGE = 150;
export const GUARD_DETECTION_ANGLE = 60;

// Load high score from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const saved = localStorage.getItem('prisonBreakoutHighScore');
  if (saved) {
    gameState.highScore = parseInt(saved, 10);
  }
}

export function saveHighScore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('prisonBreakoutHighScore', gameState.highScore.toString());
  }
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}