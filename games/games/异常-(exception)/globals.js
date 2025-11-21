// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GRID_SIZE = 40;
export const GRID_COLS = 10;
export const GRID_ROWS = 6;

export const COMMAND_TYPES = {
  MOVE_FORWARD: 'MOVE_FORWARD',
  TURN_LEFT: 'TURN_LEFT',
  TURN_RIGHT: 'TURN_RIGHT',
  ATTACK: 'ATTACK',
  WAIT: 'WAIT'
};

export const DIRECTIONS = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START",
  controlMode: "HUMAN",
  currentLevel: 0,
  robots: [],
  enemies: [],
  exits: [],
  obstacles: [],
  selectedCommandIndex: 0,
  currentProgram: [],
  isExecuting: false,
  executionStep: 0,
  executionTimer: 0,
  executionDelay: 30,
  currentRobotIndex: 0,
  levelComplete: false,
  levelFailed: false,
  programUI: {
    x: 410,
    y: 50,
    width: 180,
    height: 300
  }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;