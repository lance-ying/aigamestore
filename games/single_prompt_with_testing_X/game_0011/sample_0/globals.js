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

// Game state object
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  player: null,
  entities: [],
  balls: [],
  glasses: [],
  platforms: [],
  currentLevel: 1,
  maxLevel: 5,
  ballsRemaining: 0,
  totalBalls: 0,
  lastBallDropTime: 0,
  ballDropCooldown: 200, // milliseconds
  coins: 0,
  totalCoins: 0,
  glassesToppledCount: 0,
  testFrameCounter: 0,
  testActionQueue: []
};

// Level definitions
export const LEVELS = [
  {
    level: 1,
    ballsAllowed: 8,
    glasses: [
      { x: 200, y: 300, width: 20, height: 40 },
      { x: 250, y: 300, width: 20, height: 40 },
      { x: 350, y: 300, width: 20, height: 40 },
      { x: 400, y: 300, width: 20, height: 40 }
    ],
    platforms: [
      { x: 300, y: 340, width: 500, height: 20, isStatic: true }
    ]
  },
  {
    level: 2,
    ballsAllowed: 7,
    glasses: [
      { x: 150, y: 200, width: 20, height: 40 },
      { x: 200, y: 200, width: 20, height: 40 },
      { x: 400, y: 280, width: 20, height: 40 },
      { x: 450, y: 280, width: 20, height: 40 },
      { x: 500, y: 280, width: 20, height: 40 }
    ],
    platforms: [
      { x: 175, y: 240, width: 150, height: 15, isStatic: true },
      { x: 450, y: 320, width: 200, height: 15, isStatic: true }
    ]
  },
  {
    level: 3,
    ballsAllowed: 6,
    glasses: [
      { x: 100, y: 150, width: 20, height: 40 },
      { x: 300, y: 250, width: 20, height: 40 },
      { x: 350, y: 250, width: 20, height: 40 },
      { x: 500, y: 150, width: 20, height: 40 },
      { x: 300, y: 330, width: 20, height: 40 },
      { x: 350, y: 330, width: 20, height: 40 }
    ],
    platforms: [
      { x: 100, y: 190, width: 100, height: 15, isStatic: true },
      { x: 325, y: 290, width: 150, height: 15, isStatic: true },
      { x: 500, y: 190, width: 100, height: 15, isStatic: true },
      { x: 325, y: 370, width: 200, height: 15, isStatic: true }
    ]
  },
  {
    level: 4,
    ballsAllowed: 5,
    glasses: [
      { x: 150, y: 180, width: 20, height: 40 },
      { x: 200, y: 180, width: 20, height: 40 },
      { x: 250, y: 280, width: 20, height: 40 },
      { x: 350, y: 280, width: 20, height: 40 },
      { x: 400, y: 180, width: 20, height: 40 },
      { x: 450, y: 180, width: 20, height: 40 },
      { x: 300, y: 330, width: 20, height: 40 }
    ],
    platforms: [
      { x: 175, y: 220, width: 150, height: 15, isStatic: true, angle: -0.1 },
      { x: 300, y: 320, width: 200, height: 15, isStatic: true },
      { x: 425, y: 220, width: 150, height: 15, isStatic: true, angle: 0.1 },
      { x: 300, y: 370, width: 250, height: 15, isStatic: true }
    ]
  },
  {
    level: 5,
    ballsAllowed: 5,
    glasses: [
      { x: 100, y: 120, width: 20, height: 40 },
      { x: 150, y: 200, width: 20, height: 40 },
      { x: 250, y: 250, width: 20, height: 40 },
      { x: 300, y: 250, width: 20, height: 40 },
      { x: 350, y: 250, width: 20, height: 40 },
      { x: 450, y: 200, width: 20, height: 40 },
      { x: 500, y: 120, width: 20, height: 40 },
      { x: 300, y: 330, width: 20, height: 40 }
    ],
    platforms: [
      { x: 100, y: 160, width: 80, height: 15, isStatic: true, angle: -0.15 },
      { x: 150, y: 240, width: 100, height: 15, isStatic: true, angle: -0.1 },
      { x: 300, y: 290, width: 200, height: 15, isStatic: true },
      { x: 450, y: 240, width: 100, height: 15, isStatic: true, angle: 0.1 },
      { x: 500, y: 160, width: 80, height: 15, isStatic: true, angle: 0.15 },
      { x: 300, y: 370, width: 300, height: 15, isStatic: true }
    ]
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}