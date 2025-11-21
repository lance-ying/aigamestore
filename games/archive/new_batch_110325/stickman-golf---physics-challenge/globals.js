// globals.js
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
  TEST_2: "TEST_2",
  TEST_3: "TEST_3",
  TEST_4: "TEST_4",
  TEST_5: "TEST_5"
};

export const POWER_UPS = {
  STICKY: "STICKY",
  BOOST: "BOOST"
};

export const gameState = {
  player: null,
  ball: null,
  entities: [],
  obstacles: [],
  currentCourse: 0,
  strokes: 0,
  maxStrokes: 15,
  score: 0,
  currency: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  shotAngle: -45,
  shotPower: 50,
  ballInMotion: false,
  powerUps: {
    sticky: 3,
    boost: 3
  },
  activePowerUp: null,
  coursesCompleted: 0,
  holePosition: null,
  startPosition: null,
  aimingVisuals: {
    angle: -45,
    power: 50
  },
  testState: {
    shotCount: 0,
    lastShotTime: 0,
    testPhase: 0
  }
};

// Expose globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;