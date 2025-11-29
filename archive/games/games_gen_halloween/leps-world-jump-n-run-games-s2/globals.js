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
  enemies: [],
  coins: [],
  powerups: [],
  platforms: [],
  decorations: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  camera: { x: 0, y: 0 },
  levelComplete: false,
  worldTheme: "forest", // forest, desert, cave, snow, castle, sky
  particleEffects: [],
  backgroundElements: []
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.entities = [];
  gameState.enemies = [];
  gameState.coins = [];
  gameState.powerups = [];
  gameState.platforms = [];
  gameState.decorations = [];
  gameState.particleEffects = [];
  gameState.backgroundElements = [];
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.camera = { x: 0, y: 0 };
  gameState.levelComplete = false;
  gameState.player = null;
}