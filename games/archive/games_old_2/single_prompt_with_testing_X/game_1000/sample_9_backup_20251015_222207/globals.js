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

export const COLORS = {
  SKY: [135, 206, 250],
  GROUND: [100, 150, 100],
  ROAD: [60, 60, 60],
  ROAD_LINE: [255, 255, 100],
  PLAYER_CAR: [50, 150, 255],
  POLICE_CAR: [255, 50, 50],
  OBSTACLE: [139, 69, 19],
  TEXT: [255, 255, 255],
  SHADOW: [0, 0, 0, 100]
};

export const PHYSICS = {
  GRAVITY: 1.5,
  ROAD_SEGMENT_WIDTH: 80,
  ROAD_SEGMENT_HEIGHT: 20,
  PLAYER_SIZE: 20,
  POLICE_SIZE: 18,
  OBSTACLE_SIZE: 15,
  INITIAL_SPEED: 2,
  MAX_SPEED: 8,
  SPEED_INCREMENT: 0.002,
  POLICE_SPAWN_RATE: 180, // frames
  OBSTACLE_SPAWN_RATE: 120
};

export const gameState = {
  player: null,
  entities: [],
  roadSegments: [],
  policeCars: [],
  obstacles: [],
  score: 0,
  distance: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  scrollOffset: 0,
  gameSpeed: PHYSICS.INITIAL_SPEED,
  roadDrawAngle: 0,
  lastRoadX: CANVAS_WIDTH / 2,
  lastRoadY: CANVAS_HEIGHT - 100,
  isDrawingRoad: false,
  framesSincePoliceSpawn: 0,
  framesSinceObstacleSpawn: 0,
  gameDuration: 0,
  lastPlayerLogFrame: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}