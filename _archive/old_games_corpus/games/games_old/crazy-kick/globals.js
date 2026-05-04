// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null, // The ball entity
  entities: [], // All entities including player
  opponents: [],
  obstacles: [],
  goal: null,
  score: 0,
  highScore: 0,
  currentLevel: 1,
  tacklesRemaining: 3,
  maxTackles: 3,
  timeRemaining: 90,
  levelStartTime: 0,
  lastDashTime: 0,
  dashCooldown: 1000, // milliseconds
  lastForceDirection: { x: 0, y: 0 }
};

export const BALL_RADIUS = 15;
export const OPPONENT_RADIUS = 20;
export const DASH_FORCE_MULTIPLIER = 3;
export const MOVE_FORCE = 0.0008;
export const FRICTION = 0.95;

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "Training Pitch",
    opponents: 1,
    opponentSpeed: 1,
    tacklesAllowed: 3,
    timeLimit: 90,
    obstacleCount: 0,
    movingObstacles: 0
  },
  {
    level: 2,
    name: "Practice Match",
    opponents: 2,
    opponentSpeed: 1.3,
    tacklesAllowed: 3,
    timeLimit: 80,
    obstacleCount: 3,
    movingObstacles: 0
  },
  {
    level: 3,
    name: "Stadium Qualifier",
    opponents: 3,
    opponentSpeed: 1.6,
    tacklesAllowed: 2,
    timeLimit: 70,
    obstacleCount: 4,
    movingObstacles: 2
  },
  {
    level: 4,
    name: "Semi-Final Showdown",
    opponents: 4,
    opponentSpeed: 2,
    tacklesAllowed: 2,
    timeLimit: 60,
    obstacleCount: 6,
    movingObstacles: 3
  },
  {
    level: 5,
    name: "World Cup Final",
    opponents: 5,
    opponentSpeed: 2.5,
    tacklesAllowed: 1,
    timeLimit: 50,
    obstacleCount: 8,
    movingObstacles: 4
  }
];