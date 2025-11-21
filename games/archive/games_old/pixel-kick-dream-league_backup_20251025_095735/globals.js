// globals.js - Global state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  currentLevel: 1,
  totalLevels: 5,
  ballPosition: { x: 0, y: 0 },
  ballVelocity: { x: 0, y: 0 },
  aimAngle: 0,
  shotPower: 50,
  shotCurveDirection: 'NONE',
  isShotTaken: false,
  isGoal: false,
  levelStartTime: 0,
  shotPhase: 'AIMING', // 'AIMING', 'FLYING', 'COMPLETE'
  defenderCollisions: 0,
  ballStopped: false,
  levelData: null,
  goalKeeperPosition: 0
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    name: "The Opener",
    ballStart: { x: 300, y: 350 },
    defenders: [
      { type: 'static', shape: 'rect', x: 300, y: 200, width: 40, height: 40 }
    ],
    goalkeeper: { speed: 1, coverage: 0.33 },
    goalWidth: 120
  },
  {
    level: 2,
    name: "Defensive Wall",
    ballStart: { x: 300, y: 370 },
    defenders: [
      { type: 'static', shape: 'circle', x: 280, y: 180, radius: 25 },
      { type: 'static', shape: 'circle', x: 320, y: 180, radius: 25 }
    ],
    goalkeeper: { speed: 1.5, coverage: 0.5 },
    goalWidth: 100
  },
  {
    level: 3,
    name: "Dynamic Defense",
    ballStart: { x: 300, y: 380 },
    defenders: [
      { type: 'moving', shape: 'rect', x: 250, y: 250, width: 40, height: 40, 
        path: { type: 'horizontal', min: 200, max: 300, speed: 1 } },
      { type: 'moving', shape: 'rect', x: 350, y: 200, width: 40, height: 40,
        path: { type: 'vertical', min: 150, max: 250, speed: 0.8 } },
      { type: 'static', shape: 'circle', x: 300, y: 230, radius: 20 }
    ],
    goalkeeper: { speed: 2, coverage: 0.67 },
    goalWidth: 100
  },
  {
    level: 4,
    name: "Curve Challenge",
    ballStart: { x: 300, y: 390 },
    defenders: [
      { type: 'static', shape: 'rect', x: 270, y: 200, width: 35, height: 50 },
      { type: 'static', shape: 'rect', x: 300, y: 240, width: 35, height: 50 },
      { type: 'static', shape: 'rect', x: 330, y: 200, width: 35, height: 50 }
    ],
    goalkeeper: { speed: 2.5, coverage: 0.8 },
    goalWidth: 90
  },
  {
    level: 5,
    name: "Superstar Showdown",
    ballStart: { x: 300, y: 395 },
    defenders: [
      { type: 'moving', shape: 'circle', x: 250, y: 280, radius: 25,
        path: { type: 'horizontal', min: 200, max: 300, speed: 1.2 } },
      { type: 'moving', shape: 'circle', x: 300, y: 220, radius: 25,
        path: { type: 'circular', centerX: 300, centerY: 220, radius: 40, speed: 0.02 } },
      { type: 'moving', shape: 'circle', x: 350, y: 280, radius: 25,
        path: { type: 'horizontal', min: 300, max: 400, speed: 1.2 } }
    ],
    goalkeeper: { speed: 3, coverage: 0.9 },
    goalWidth: 80
  }
];