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
      // Top row - blocking center
      { x: 280, y: 80, radius: 8 },
      { x: 320, y: 80, radius: 8 },
      // Second row - wide spread
      { x: 150, y: 120, radius: 8 },
      { x: 250, y: 120, radius: 8 },
      { x: 350, y: 120, radius: 8 },
      { x: 450, y: 120, radius: 8 },
      // Third row - offset
      { x: 200, y: 170, radius: 8 },
      { x: 300, y: 170, radius: 8 },
      { x: 400, y: 170, radius: 8 },
      // Fourth row - blocking straight paths
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
    targetScore: 300,
    drops: 6,
    pegs: [
      // Dense top section - blocks straight drops
      { x: 180, y: 80, radius: 8 },
      { x: 240, y: 80, radius: 8 },
      { x: 300, y: 80, radius: 8 },
      { x: 360, y: 80, radius: 8 },
      { x: 420, y: 80, radius: 8 },
      // Second row - offset
      { x: 150, y: 120, radius: 8 },
      { x: 210, y: 120, radius: 8 },
      { x: 270, y: 120, radius: 8 },
      { x: 330, y: 120, radius: 8 },
      { x: 390, y: 120, radius: 8 },
      { x: 450, y: 120, radius: 8 },
      // Third row - blocking
      { x: 180, y: 160, radius: 8 },
      { x: 240, y: 160, radius: 8 },
      { x: 300, y: 160, radius: 8 },
      { x: 360, y: 160, radius: 8 },
      { x: 420, y: 160, radius: 8 },
      // Fourth row - more obstacles
      { x: 200, y: 200, radius: 8 },
      { x: 280, y: 200, radius: 8 },
      { x: 320, y: 200, radius: 8 },
      { x: 400, y: 200, radius: 8 }
    ],
    multipliers: [
      { x: 220, y: 250, width: 50, height: 10, value: 2 },
      { x: 380, y: 250, width: 50, height: 10, value: 3 }
    ]
  },
  {
    level: 3,
    targetScore: 600,
    drops: 6,
    pegs: [
      // Very dense top - forces bouncing
      { x: 120, y: 70, radius: 8 },
      { x: 180, y: 70, radius: 8 },
      { x: 240, y: 70, radius: 8 },
      { x: 300, y: 70, radius: 8 },
      { x: 360, y: 70, radius: 8 },
      { x: 420, y: 70, radius: 8 },
      { x: 480, y: 70, radius: 8 },
      // Second row
      { x: 150, y: 110, radius: 8 },
      { x: 210, y: 110, radius: 8 },
      { x: 270, y: 110, radius: 8 },
      { x: 330, y: 110, radius: 8 },
      { x: 390, y: 110, radius: 8 },
      { x: 450, y: 110, radius: 8 },
      // Third row - zigzag pattern
      { x: 120, y: 150, radius: 8 },
      { x: 200, y: 150, radius: 8 },
      { x: 280, y: 150, radius: 8 },
      { x: 320, y: 150, radius: 8 },
      { x: 400, y: 150, radius: 8 },
      { x: 480, y: 150, radius: 8 },
      // Fourth row - tight spacing
      { x: 160, y: 190, radius: 8 },
      { x: 220, y: 190, radius: 8 },
      { x: 280, y: 190, radius: 8 },
      { x: 340, y: 190, radius: 8 },
      { x: 400, y: 190, radius: 8 },
      { x: 460, y: 190, radius: 8 }
    ],
    multipliers: [
      { x: 150, y: 240, width: 50, height: 10, value: 2 },
      { x: 300, y: 240, width: 50, height: 10, value: 4 },
      { x: 450, y: 240, width: 50, height: 10, value: 2 }
    ]
  },
  {
    level: 4,
    targetScore: 1000,
    drops: 7,
    pegs: [
      // Center blockade
      { x: 280, y: 75, radius: 8 },
      { x: 320, y: 75, radius: 8 },
      { x: 300, y: 95, radius: 8 },
      // Wide spread
      { x: 120, y: 95, radius: 8 },
      { x: 180, y: 95, radius: 8 },
      { x: 240, y: 95, radius: 8 },
      { x: 360, y: 95, radius: 8 },
      { x: 420, y: 95, radius: 8 },
      { x: 480, y: 95, radius: 8 },
      // Diamond pattern
      { x: 150, y: 135, radius: 8 },
      { x: 225, y: 135, radius: 8 },
      { x: 300, y: 135, radius: 8 },
      { x: 375, y: 135, radius: 8 },
      { x: 450, y: 135, radius: 8 },
      // Lower obstacles
      { x: 120, y: 175, radius: 8 },
      { x: 200, y: 175, radius: 8 },
      { x: 280, y: 175, radius: 8 },
      { x: 320, y: 175, radius: 8 },
      { x: 400, y: 175, radius: 8 },
      { x: 480, y: 175, radius: 8 },
      // Final row
      { x: 160, y: 215, radius: 8 },
      { x: 240, y: 215, radius: 8 },
      { x: 360, y: 215, radius: 8 },
      { x: 440, y: 215, radius: 8 }
    ],
    multipliers: [
      { x: 180, y: 255, width: 45, height: 10, value: 3 },
      { x: 420, y: 255, width: 45, height: 10, value: 3 }
    ]
  },
  {
    level: 5,
    targetScore: 1500,
    drops: 7,
    pegs: [
      // Very tight top section
      { x: 140, y: 70, radius: 8 },
      { x: 190, y: 70, radius: 8 },
      { x: 240, y: 70, radius: 8 },
      { x: 290, y: 70, radius: 8 },
      { x: 340, y: 70, radius: 8 },
      { x: 390, y: 70, radius: 8 },
      { x: 440, y: 70, radius: 8 },
      { x: 490, y: 70, radius: 8 },
      // Offset second row
      { x: 115, y: 105, radius: 8 },
      { x: 165, y: 105, radius: 8 },
      { x: 215, y: 105, radius: 8 },
      { x: 265, y: 105, radius: 8 },
      { x: 315, y: 105, radius: 8 },
      { x: 365, y: 105, radius: 8 },
      { x: 415, y: 105, radius: 8 },
      { x: 465, y: 105, radius: 8 },
      // Third row - very dense
      { x: 140, y: 140, radius: 8 },
      { x: 190, y: 140, radius: 8 },
      { x: 240, y: 140, radius: 8 },
      { x: 290, y: 140, radius: 8 },
      { x: 340, y: 140, radius: 8 },
      { x: 390, y: 140, radius: 8 },
      { x: 440, y: 140, radius: 8 },
      // Lower section
      { x: 165, y: 180, radius: 8 },
      { x: 240, y: 180, radius: 8 },
      { x: 315, y: 180, radius: 8 },
      { x: 390, y: 180, radius: 8 },
      { x: 465, y: 180, radius: 8 },
      // Bottom guards
      { x: 200, y: 220, radius: 8 },
      { x: 300, y: 220, radius: 8 },
      { x: 400, y: 220, radius: 8 }
    ],
    multipliers: [
      { x: 250, y: 260, width: 50, height: 10, value: 5 }
    ]
  },
  {
    level: 6,
    targetScore: 2200,
    drops: 8,
    pegs: [
      // Wall formation left
      { x: 140, y: 80, radius: 8 },
      { x: 140, y: 120, radius: 8 },
      { x: 140, y: 160, radius: 8 },
      // Wall formation right
      { x: 460, y: 80, radius: 8 },
      { x: 460, y: 120, radius: 8 },
      { x: 460, y: 160, radius: 8 },
      // Center maze
      { x: 220, y: 90, radius: 8 },
      { x: 280, y: 90, radius: 8 },
      { x: 320, y: 90, radius: 8 },
      { x: 380, y: 90, radius: 8 },
      { x: 200, y: 130, radius: 8 },
      { x: 250, y: 130, radius: 8 },
      { x: 300, y: 130, radius: 8 },
      { x: 350, y: 130, radius: 8 },
      { x: 400, y: 130, radius: 8 },
      { x: 180, y: 170, radius: 8 },
      { x: 240, y: 170, radius: 8 },
      { x: 300, y: 170, radius: 8 },
      { x: 360, y: 170, radius: 8 },
      { x: 420, y: 170, radius: 8 },
      // Lower obstacles
      { x: 200, y: 210, radius: 8 },
      { x: 270, y: 210, radius: 8 },
      { x: 330, y: 210, radius: 8 },
      { x: 400, y: 210, radius: 8 }
    ],
    multipliers: [
      { x: 200, y: 250, width: 45, height: 10, value: 2 },
      { x: 300, y: 250, width: 45, height: 10, value: 4 },
      { x: 400, y: 250, width: 45, height: 10, value: 2 }
    ]
  },
  {
    level: 7,
    targetScore: 3000,
    drops: 8,
    pegs: [
      // Extreme density top
      { x: 120, y: 65, radius: 8 },
      { x: 160, y: 65, radius: 8 },
      { x: 200, y: 65, radius: 8 },
      { x: 240, y: 65, radius: 8 },
      { x: 280, y: 65, radius: 8 },
      { x: 320, y: 65, radius: 8 },
      { x: 360, y: 65, radius: 8 },
      { x: 400, y: 65, radius: 8 },
      { x: 440, y: 65, radius: 8 },
      { x: 480, y: 65, radius: 8 },
      // Second layer
      { x: 140, y: 100, radius: 8 },
      { x: 180, y: 100, radius: 8 },
      { x: 220, y: 100, radius: 8 },
      { x: 260, y: 100, radius: 8 },
      { x: 300, y: 100, radius: 8 },
      { x: 340, y: 100, radius: 8 },
      { x: 380, y: 100, radius: 8 },
      { x: 420, y: 100, radius: 8 },
      { x: 460, y: 100, radius: 8 },
      // Third layer
      { x: 120, y: 140, radius: 8 },
      { x: 170, y: 140, radius: 8 },
      { x: 230, y: 140, radius: 8 },
      { x: 290, y: 140, radius: 8 },
      { x: 350, y: 140, radius: 8 },
      { x: 410, y: 140, radius: 8 },
      { x: 470, y: 140, radius: 8 },
      // Fourth layer
      { x: 150, y: 180, radius: 8 },
      { x: 210, y: 180, radius: 8 },
      { x: 270, y: 180, radius: 8 },
      { x: 330, y: 180, radius: 8 },
      { x: 390, y: 180, radius: 8 },
      { x: 450, y: 180, radius: 8 },
      // Final guards
      { x: 180, y: 220, radius: 8 },
      { x: 260, y: 220, radius: 8 },
      { x: 340, y: 220, radius: 8 },
      { x: 420, y: 220, radius: 8 }
    ],
    multipliers: [
      { x: 300, y: 260, width: 50, height: 10, value: 6 }
    ]
  },
  {
    level: 8,
    targetScore: 4000,
    drops: 9,
    pegs: [
      // Fortress pattern
      { x: 150, y: 70, radius: 8 },
      { x: 200, y: 70, radius: 8 },
      { x: 250, y: 70, radius: 8 },
      { x: 350, y: 70, radius: 8 },
      { x: 400, y: 70, radius: 8 },
      { x: 450, y: 70, radius: 8 },
      { x: 120, y: 105, radius: 8 },
      { x: 180, y: 105, radius: 8 },
      { x: 240, y: 105, radius: 8 },
      { x: 300, y: 105, radius: 8 },
      { x: 360, y: 105, radius: 8 },
      { x: 420, y: 105, radius: 8 },
      { x: 480, y: 105, radius: 8 },
      { x: 150, y: 140, radius: 8 },
      { x: 210, y: 140, radius: 8 },
      { x: 270, y: 140, radius: 8 },
      { x: 330, y: 140, radius: 8 },
      { x: 390, y: 140, radius: 8 },
      { x: 450, y: 140, radius: 8 },
      { x: 120, y: 175, radius: 8 },
      { x: 190, y: 175, radius: 8 },
      { x: 260, y: 175, radius: 8 },
      { x: 340, y: 175, radius: 8 },
      { x: 410, y: 175, radius: 8 },
      { x: 480, y: 175, radius: 8 },
      { x: 160, y: 215, radius: 8 },
      { x: 240, y: 215, radius: 8 },
      { x: 320, y: 215, radius: 8 },
      { x: 400, y: 215, radius: 8 },
      { x: 480, y: 215, radius: 8 }
    ],
    multipliers: [
      { x: 220, y: 255, width: 45, height: 10, value: 3 },
      { x: 380, y: 255, width: 45, height: 10, value: 5 }
    ]
  },
  {
    level: 9,
    targetScore: 5500,
    drops: 10,
    pegs: [
      // Maximum density pattern
      { x: 110, y: 65, radius: 7 },
      { x: 150, y: 65, radius: 7 },
      { x: 190, y: 65, radius: 7 },
      { x: 230, y: 65, radius: 7 },
      { x: 270, y: 65, radius: 7 },
      { x: 310, y: 65, radius: 7 },
      { x: 350, y: 65, radius: 7 },
      { x: 390, y: 65, radius: 7 },
      { x: 430, y: 65, radius: 7 },
      { x: 470, y: 65, radius: 7 },
      { x: 130, y: 95, radius: 7 },
      { x: 170, y: 95, radius: 7 },
      { x: 210, y: 95, radius: 7 },
      { x: 250, y: 95, radius: 7 },
      { x: 290, y: 95, radius: 7 },
      { x: 330, y: 95, radius: 7 },
      { x: 370, y: 95, radius: 7 },
      { x: 410, y: 95, radius: 7 },
      { x: 450, y: 95, radius: 7 },
      { x: 110, y: 130, radius: 7 },
      { x: 155, y: 130, radius: 7 },
      { x: 200, y: 130, radius: 7 },
      { x: 245, y: 130, radius: 7 },
      { x: 290, y: 130, radius: 7 },
      { x: 335, y: 130, radius: 7 },
      { x: 380, y: 130, radius: 7 },
      { x: 425, y: 130, radius: 7 },
      { x: 470, y: 130, radius: 7 },
      { x: 130, y: 165, radius: 7 },
      { x: 180, y: 165, radius: 7 },
      { x: 230, y: 165, radius: 7 },
      { x: 280, y: 165, radius: 7 },
      { x: 330, y: 165, radius: 7 },
      { x: 380, y: 165, radius: 7 },
      { x: 430, y: 165, radius: 7 },
      { x: 480, y: 165, radius: 7 },
      { x: 155, y: 200, radius: 7 },
      { x: 215, y: 200, radius: 7 },
      { x: 275, y: 200, radius: 7 },
      { x: 335, y: 200, radius: 7 },
      { x: 395, y: 200, radius: 7 },
      { x: 455, y: 200, radius: 7 }
    ],
    multipliers: [
      { x: 200, y: 245, width: 45, height: 10, value: 4 },
      { x: 400, y: 245, width: 45, height: 10, value: 4 }
    ]
  },
  {
    level: 10,
    targetScore: 7500,
    drops: 10,
    pegs: [
      // Final challenge - chaotic but strategic
      { x: 120, y: 60, radius: 7 },
      { x: 165, y: 60, radius: 7 },
      { x: 210, y: 60, radius: 7 },
      { x: 255, y: 60, radius: 7 },
      { x: 300, y: 60, radius: 7 },
      { x: 345, y: 60, radius: 7 },
      { x: 390, y: 60, radius: 7 },
      { x: 435, y: 60, radius: 7 },
      { x: 480, y: 60, radius: 7 },
      { x: 142, y: 88, radius: 7 },
      { x: 187, y: 88, radius: 7 },
      { x: 232, y: 88, radius: 7 },
      { x: 277, y: 88, radius: 7 },
      { x: 322, y: 88, radius: 7 },
      { x: 367, y: 88, radius: 7 },
      { x: 412, y: 88, radius: 7 },
      { x: 457, y: 88, radius: 7 },
      { x: 120, y: 118, radius: 7 },
      { x: 170, y: 118, radius: 7 },
      { x: 220, y: 118, radius: 7 },
      { x: 270, y: 118, radius: 7 },
      { x: 320, y: 118, radius: 7 },
      { x: 370, y: 118, radius: 7 },
      { x: 420, y: 118, radius: 7 },
      { x: 470, y: 118, radius: 7 },
      { x: 145, y: 150, radius: 7 },
      { x: 195, y: 150, radius: 7 },
      { x: 245, y: 150, radius: 7 },
      { x: 295, y: 150, radius: 7 },
      { x: 345, y: 150, radius: 7 },
      { x: 395, y: 150, radius: 7 },
      { x: 445, y: 150, radius: 7 },
      { x: 120, y: 185, radius: 7 },
      { x: 175, y: 185, radius: 7 },
      { x: 230, y: 185, radius: 7 },
      { x: 285, y: 185, radius: 7 },
      { x: 340, y: 185, radius: 7 },
      { x: 395, y: 185, radius: 7 },
      { x: 450, y: 185, radius: 7 },
      { x: 150, y: 220, radius: 7 },
      { x: 220, y: 220, radius: 7 },
      { x: 290, y: 220, radius: 7 },
      { x: 360, y: 220, radius: 7 },
      { x: 430, y: 220, radius: 7 }
    ],
    multipliers: [
      { x: 180, y: 258, width: 40, height: 10, value: 3 },
      { x: 300, y: 258, width: 40, height: 10, value: 8 },
      { x: 420, y: 258, width: 40, height: 10, value: 3 }
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