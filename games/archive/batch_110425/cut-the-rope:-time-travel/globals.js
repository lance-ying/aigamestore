export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

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

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  player: null,
  entities: [],
  ropes: [],
  devices: [],
  candy: null,
  monsters: [],
  stars: [],
  score: 0,
  starsCollected: 0,
  monstersEaten: 0,
  currentLevel: 1,
  selectedIndex: 0,
  selectableItems: [],
  timeElapsed: 0,
  levelStartTime: 0,
  testActionTimer: 0,
  testPhase: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;