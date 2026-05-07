// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

export const CONTROL_MODES = {
  HUMAN: 'HUMAN',
  TEST_1: 'TEST_1',
  TEST_2: 'TEST_2'
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  walls: [],
  vents: [],
  barrels: [],
  primaryTargets: [],
  score: 0,
  currentLevel: 1,
  maxLevel: 3,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  detectionProgress: 0,
  detectingEnemy: null,
  levelStartTime: 0,
  levelCompleteTime: 0,
  stealthBonusEligible: true,
  levelMaxTime: [120, 180, 240], // max time per level in seconds
  frameCount: 0
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}