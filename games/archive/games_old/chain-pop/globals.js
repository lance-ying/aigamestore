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

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const BALL_COLORS = {
  RED: [220, 50, 50],
  GREEN: [50, 200, 80],
  BLUE: [50, 120, 220],
  YELLOW: [240, 200, 50],
  PURPLE: [180, 50, 200]
};

export const COLOR_NAMES = ["RED", "GREEN", "BLUE", "YELLOW", "PURPLE"];

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null,
  entities: [],
  score: 0,
  totalScore: 0,
  highScore: 0,
  currentLevel: 1,
  movesLeft: 0,
  grid: [],
  gridRows: 0,
  gridCols: 0,
  cellSize: 0,
  gridOffsetX: 0,
  gridOffsetY: 0,
  currentChain: [],
  selectedBall: null,
  cursorX: 0,
  cursorY: 0,
  objectives: {},
  clearedBalls: {},
  boostersAvailable: 0,
  isAnimating: false,
  animationQueue: [],
  fallingBalls: [],
  particles: [],
  levelTransitionTimer: 0,
  showLevelTransition: false
};

export const LEVELS = [
  {
    level: 1,
    gridRows: 8,
    gridCols: 8,
    colors: 3,
    moves: 15,
    objectives: {
      totalBalls: 20,
      targetScore: 200
    }
  },
  {
    level: 2,
    gridRows: 8,
    gridCols: 8,
    colors: 4,
    moves: 20,
    objectives: {
      RED: 10,
      GREEN: 10,
      targetScore: 400
    }
  },
  {
    level: 3,
    gridRows: 9,
    gridCols: 9,
    colors: 5,
    moves: 25,
    objectives: {
      totalBalls: 25,
      targetScore: 750
    }
  },
  {
    level: 4,
    gridRows: 9,
    gridCols: 9,
    colors: 5,
    moves: 28,
    objectives: {
      YELLOW: 15,
      PURPLE: 15,
      targetScore: 1000
    },
    obstacles: 3
  },
  {
    level: 5,
    gridRows: 10,
    gridCols: 10,
    colors: 5,
    moves: 30,
    objectives: {
      RED: 5,
      GREEN: 5,
      BLUE: 5,
      YELLOW: 5,
      PURPLE: 5,
      totalBalls: 30,
      targetScore: 1500
    }
  }
];