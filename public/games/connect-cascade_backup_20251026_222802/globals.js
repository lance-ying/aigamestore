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
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  score: 0,
  totalScore: 0,
  highScore: 0,
  currentLevel: 1,
  currentMoves: 0,
  maxMoves: 0,
  grid: [],
  gridRows: 6,
  gridCols: 6,
  cursorX: 0,
  cursorY: 0,
  currentSelectedDot: null,
  currentPath: [],
  levelObjectives: {},
  animationQueue: [],
  isAnimating: false,
  colors: [],
  levelConfig: null
};

export const DOT_COLORS = {
  RED: [255, 50, 50],
  BLUE: [50, 100, 255],
  GREEN: [50, 255, 100],
  YELLOW: [255, 220, 50],
  PURPLE: [200, 80, 255],
  ORANGE: [255, 150, 50]
};

export const SCORE_VALUES = {
  REGULAR_DOT: 10,
  SQUARE_DOT: 50,
  ANCHOR_DROP: 50,
  LEVEL_COMPLETE: 200,
  MOVES_REMAINING: 25
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}