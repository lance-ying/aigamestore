// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_UP_MENU: "LEVEL_UP_MENU",
  WAVE_COMPLETE: "WAVE_COMPLETE",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  items: [],
  enemies: [],
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  score: 0,
  currentLevel: 1,
  currentWave: 1,
  waveTimer: 0,
  enemiesRemainingInWave: 0,
  totalWaveDuration: 30,
  selectedUpgradeIndex: 0,
  availableUpgrades: [],
  materials: 0,
  gameTimeElapsed: 0,
  highScores: []
};

// Load high scores from localStorage
export function loadHighScores() {
  const stored = localStorage.getItem('spudSurvivorHighScores');
  if (stored) {
    try {
      gameState.highScores = JSON.parse(stored);
    } catch (e) {
      gameState.highScores = [];
    }
  }
  // Ensure we have at least 5 placeholder scores
  while (gameState.highScores.length < 5) {
    gameState.highScores.push({ name: 'Player', score: 0 });
  }
}

export function saveHighScores() {
  localStorage.setItem('spudSurvivorHighScores', JSON.stringify(gameState.highScores));
}

export function addHighScore(score) {
  gameState.highScores.push({ name: 'Player', score: score });
  gameState.highScores.sort((a, b) => b.score - a.score);
  gameState.highScores = gameState.highScores.slice(0, 5);
  saveHighScores();
}
// Expose gameState to window for debugging and recording scripts
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}
