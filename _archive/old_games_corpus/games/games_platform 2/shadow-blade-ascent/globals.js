// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LOADING: 'LOADING',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: 'HUMAN',
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  loot: [],
  particles: [],
  platforms: [],
  score: 0,
  currentLevel: 1,
  maxLevel: 5,
  cameraX: 0,
  levelWidth: 2400,
  comboTimer: 0,
  comboCount: 0,
  lastComboBonus: 0,
  loadingTimer: 0,
  loadingDuration: 120 // 2 seconds at 60fps
};

// Make getGameState available globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}