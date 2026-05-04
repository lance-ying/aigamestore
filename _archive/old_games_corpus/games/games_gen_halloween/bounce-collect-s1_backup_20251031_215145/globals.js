// globals.js - Global constants and game state

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
  TEST_5: "TEST_5",
  TEST_6: "TEST_6",
  TEST_7: "TEST_7"
};

export const gameState = {
  player: null,
  entities: [],
  balls: [],
  pegs: [],
  multiplierGates: [],
  bins: [],
  score: 0,
  dropsRemaining: 5,
  currentLevel: 1,
  targetScore: 100,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  dropperX: CANVAS_WIDTH / 2,
  ballsInPlay: 0,
  levelComplete: false,
  testFrameCounter: 0,
  pauseTestFrames: 0
};

export const LEVELS = [
  {
    level: 1,
    targetScore: 100,
    drops: 5,
    pegs: [
      { x: 150, y: 120, radius: 8 },
      { x: 250, y: 120, radius: 8 },
      { x: 350, y: 120, radius: 8 },
      { x: 450, y: 120, radius: 8 },
      { x: 200, y: 170, radius: 8 },
      { x: 300, y: 170, radius: 8 },
      { x: 400, y: 170, radius: 8 },
      { x: 150, y: 220, radius: 8 },
      { x: 250, y: 220, radius: 8 },
      { x: 350, y: 220, radius: 8 },
      { x: 450, y: 220, radius: 8 }
    ],
    multipliers: [
      { x: 200, y: 270, width: 60, height: 10, value: 2 },
      { x: 400, y: 270, width: 60, height: 10, value: 2 }
    ]
  },
  {
    level: 2,
    targetScore: 250,
    drops: 5,
    pegs: [
      { x: 120, y: 100, radius: 8 },
      { x: 200, y: 100, radius: 8 },
      { x: 280, y: 100, radius: 8 },
      { x: 360, y: 100, radius: 8 },
      { x: 440, y: 100, radius: 8 },
      { x: 160, y: 150, radius: 8 },
      { x: 240, y: 150, radius: 8 },
      { x: 320, y: 150, radius: 8 },
      { x: 400, y: 150, radius: 8 },
      { x: 480, y: 150, radius: 8 },
      { x: 200, y: 200, radius: 8 },
      { x: 300, y: 200, radius: 8 },
      { x: 400, y: 200, radius: 8 }
    ],
    multipliers: [
      { x: 250, y: 250, width: 50, height: 10, value: 3 },
      { x: 350, y: 250, width: 50, height: 10, value: 2 }
    ]
  },
  {
    level: 3,
    targetScore: 500,
    drops: 6,
    pegs: [
      { x: 100, y: 90, radius: 8 },
      { x: 180, y: 90, radius: 8 },
      { x: 260, y: 90, radius: 8 },
      { x: 340, y: 90, radius: 8 },
      { x: 420, y: 90, radius: 8 },
      { x: 500, y: 90, radius: 8 },
      { x: 140, y: 140, radius: 8 },
      { x: 220, y: 140, radius: 8 },
      { x: 300, y: 140, radius: 8 },
      { x: 380, y: 140, radius: 8 },
      { x: 460, y: 140, radius: 8 },
      { x: 180, y: 190, radius: 8 },
      { x: 260, y: 190, radius: 8 },
      { x: 340, y: 190, radius: 8 },
      { x: 420, y: 190, radius: 8 }
    ],
    multipliers: [
      { x: 150, y: 240, width: 50, height: 10, value: 2 },
      { x: 300, y: 240, width: 50, height: 10, value: 5 },
      { x: 450, y: 240, width: 50, height: 10, value: 2 }
    ]
  }
];

export const BIN_CONFIG = [
  { x: 60, width: 80, value: 10, color: [100, 150, 255] },
  { x: 150, width: 80, value: 20, color: [120, 200, 255] },
  { x: 240, width: 80, value: 50, color: [150, 220, 255] },
  { x: 330, width: 80, value: 20, color: [120, 200, 255] },
  { x: 420, width: 80, value: 10, color: [100, 150, 255] }
];