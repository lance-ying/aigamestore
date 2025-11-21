// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 40;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

export const PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const COMMAND_TYPES = {
  MOVE_FORWARD: "MOVE_FORWARD",
  TURN_LEFT: "TURN_LEFT",
  TURN_RIGHT: "TURN_RIGHT",
  ATTACK: "ATTACK",
  WAIT: "WAIT"
};

export const DIRECTION = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: PHASE.START,
  controlMode: "HUMAN",
  currentLevel: 0,
  robots: [],
  enemies: [],
  exit: null,
  programming: {
    selectedRobot: 0,
    commandMenu: Object.values(COMMAND_TYPES),
    selectedCommand: 0,
    isInMenu: true
  },
  simulation: {
    running: false,
    timeElapsed: 0,
    maxTime: 300 // 5 seconds at 60fps
  },
  levels: []
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;