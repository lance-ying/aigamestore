// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  currentLevel: 0,
  starsCollected: [false, false, false],
  totalStarsCollected: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN",
  engine: null,
  world: null,
  candy: null,
  omNom: null,
  ropes: [],
  stars: [],
  airCushions: [],
  bubbles: [],
  hazards: [],
  walls: [],
  magicFingerUsed: false,
  levelStartTime: 0,
  levelCompleteTime: 0,
  highScores: [],
  bestStars: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const POINTS = {
  STAR: 100,
  WIN: 500,
  THREE_STAR_BONUS: 50,
  TIME_BONUS_FAST: 100,
  TIME_BONUS_MEDIUM: 50
};