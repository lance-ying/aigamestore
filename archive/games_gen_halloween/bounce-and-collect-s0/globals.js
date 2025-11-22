// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Arena dimensions
export const ARENA = {
  LEFT: 50,
  RIGHT: 550,
  TOP: 80,
  BOTTOM: 380,
  WIDTH: 500,
  HEIGHT: 300
};

// Ball properties
export const BALL_RADIUS = 8;
export const BALL_COLORS = [
  [255, 100, 100], // Red
  [100, 255, 100], // Green
  [100, 100, 255], // Blue
  [255, 255, 100], // Yellow
  [255, 100, 255], // Magenta
  [100, 255, 255]  // Cyan
];

// Level configurations
export const LEVELS = [
  {
    level: 1,
    targetScore: 100,
    ballsAllowed: 5,
    pegs: generatePegPattern(1),
    multipliers: [
      { x: 150, y: 320, width: 40, height: 60, type: 'x2', value: 2 },
      { x: 300, y: 320, width: 40, height: 60, type: 'x5', value: 5 },
      { x: 450, y: 320, width: 40, height: 60, type: '+10', value: 10 }
    ],
    movingObstacles: []
  },
  {
    level: 2,
    targetScore: 250,
    ballsAllowed: 5,
    pegs: generatePegPattern(2),
    multipliers: [
      { x: 120, y: 300, width: 35, height: 50, type: 'x2', value: 2 },
      { x: 240, y: 300, width: 35, height: 50, type: 'x3', value: 3 },
      { x: 360, y: 300, width: 35, height: 50, type: 'x5', value: 5 },
      { x: 480, y: 300, width: 35, height: 50, type: '+15', value: 15 }
    ],
    movingObstacles: [
      { startX: 150, endX: 250, y: 200, speed: 0.02, width: 60, height: 15 }
    ]
  },
  {
    level: 3,
    targetScore: 500,
    ballsAllowed: 5,
    pegs: generatePegPattern(3),
    multipliers: [
      { x: 100, y: 280, width: 30, height: 45, type: 'x2', value: 2 },
      { x: 200, y: 280, width: 30, height: 45, type: 'x3', value: 3 },
      { x: 300, y: 280, width: 30, height: 45, type: 'x5', value: 5 },
      { x: 400, y: 280, width: 30, height: 45, type: 'x10', value: 10 },
      { x: 500, y: 280, width: 30, height: 45, type: '+20', value: 20 }
    ],
    movingObstacles: [
      { startX: 100, endX: 250, y: 180, speed: 0.025, width: 70, height: 15 },
      { startX: 350, endX: 500, y: 220, speed: 0.03, width: 70, height: 15 }
    ]
  }
];

function generatePegPattern(level) {
  const pegs = [];
  const rows = 5 + level;
  const cols = 8 + level;
  const spacing = ARENA.WIDTH / (cols + 1);
  const verticalSpacing = (ARENA.HEIGHT - 100) / (rows + 1);
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const offsetX = (row % 2 === 0) ? spacing / 2 : 0;
      pegs.push({
        x: ARENA.LEFT + col * spacing + offsetX,
        y: ARENA.TOP + row * verticalSpacing,
        radius: 6
      });
    }
  }
  
  return pegs;
}

// Game state
export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Matter.js
  engine: null,
  world: null,
  
  // Game entities
  balls: [],
  pegs: [],
  walls: [],
  multipliers: [],
  movingObstacles: [],
  bins: [],
  
  // Game progress
  currentLevel: 1,
  score: 0,
  ballsRemaining: 5,
  ballsInPlay: 0,
  
  // Drop position
  dropX: CANVAS_WIDTH / 2,
  
  // Visual effects
  particles: [],
  
  // Input tracking
  keys: {},
  
  // Ball skin
  currentBallColor: 0,
  
  // Testing
  testState: {
    actionQueue: [],
    currentActionIndex: 0,
    frameCounter: 0
  }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}