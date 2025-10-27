// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

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
  knives: [],
  enemies: [],
  barrels: [],
  boxes: [],
  hostages: [],
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  score: 0,
  currentLevel: 1,
  maxLevel: 5,
  playerAngle: -Math.PI / 2, // Start aiming upward
  knifeCooldown: 0,
  knifeCooldownTime: 250, // Reduced from 500 for faster action
  lastKnifeTime: 0,
  enemiesRemaining: 0,
  hostagesAlive: 0,
  levelTransitionTimer: 0,
  levelTransitionDuration: 180, // 3 seconds at 60 FPS
  showLevelComplete: false
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}