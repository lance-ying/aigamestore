// Global constants and state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  cannonAngle: -Math.PI / 2, // Start pointing up
  projectiles: [],
  mobUnits: [],
  champions: [],
  enemyBase: null,
  gates: [],
  obstacles: [],
  speedBoostZones: [],
  currentLevel: 1,
  levelTimer: 0,
  championCooldowns: {
    tank: 0,
    speed: 0
  },
  levelStartTime: 0,
  totalFrames: 0,
  levelConfig: null
};

// Level configurations
export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "The Gauntlet",
    timeLimit: 120,
    baseHealth: 500,
    gates: [
      { x: 200, y: 150, width: 60, height: 80, multiplier: 2 },
      { x: 400, y: 150, width: 60, height: 80, multiplier: 2 },
      { x: 300, y: 80, width: 60, height: 80, multiplier: 3 }
    ],
    obstacles: [
      { x: 150, y: 250, width: 80, height: 20 },
      { x: 370, y: 250, width: 80, height: 20 }
    ],
    speedBoostZones: [
      { x: 250, y: 300, width: 100, height: 40 }
    ],
    championAvailable: { tank: true, speed: false },
    championCooldowns: { tank: 15, speed: 0 }
  },
  {
    level: 2,
    name: "Split Paths",
    timeLimit: 100,
    baseHealth: 800,
    gates: [
      { x: 150, y: 120, width: 60, height: 80, multiplier: 3 },
      { x: 450, y: 120, width: 60, height: 80, multiplier: 3 },
      { x: 300, y: 60, width: 60, height: 80, multiplier: 5 },
      { x: 500, y: 200, width: 60, height: 80, multiplier: 2 }
    ],
    obstacles: [
      { x: 250, y: 200, width: 100, height: 20 },
      { x: 200, y: 280, width: 20, height: 80 },
      { x: 380, y: 280, width: 20, height: 80 },
      { x: 450, y: 250, width: 60, height: 20, destructible: true }
    ],
    speedBoostZones: [
      { x: 100, y: 300, width: 80, height: 40 },
      { x: 420, y: 300, width: 80, height: 40 }
    ],
    championAvailable: { tank: true, speed: true },
    championCooldowns: { tank: 18, speed: 12 }
  },
  {
    level: 3,
    name: "Fortress Breach",
    timeLimit: 80,
    baseHealth: 1500,
    gates: [
      { x: 120, y: 150, width: 60, height: 80, multiplier: 3 },
      { x: 280, y: 100, width: 60, height: 80, multiplier: 5 },
      { x: 480, y: 150, width: 60, height: 80, multiplier: 5 },
      { x: 380, y: 60, width: 60, height: 80, multiplier: 7 },
      { x: 520, y: 80, width: 50, height: 60, multiplier: 10 }
    ],
    obstacles: [
      { x: 100, y: 220, width: 120, height: 20 },
      { x: 380, y: 220, width: 120, height: 20 },
      { x: 250, y: 180, width: 20, height: 100, destructible: true },
      { x: 330, y: 180, width: 20, height: 100, destructible: true },
      { x: 150, y: 290, width: 80, height: 20 },
      { x: 370, y: 290, width: 80, height: 20 },
      { x: 480, y: 250, width: 20, height: 80 }
    ],
    speedBoostZones: [
      { x: 50, y: 320, width: 100, height: 40 },
      { x: 250, y: 280, width: 80, height: 40 },
      { x: 450, y: 320, width: 100, height: 40 }
    ],
    championAvailable: { tank: true, speed: true },
    championCooldowns: { tank: 20, speed: 15 }
  }
];

export const CANNON_CONFIG = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT - 30,
  length: 30,
  width: 20,
  rotationSpeed: 0.03,
  minAngle: -Math.PI * 0.75,
  maxAngle: -Math.PI * 0.25
};

export const PROJECTILE_CONFIG = {
  radius: 5,
  speed: 4,
  color: [255, 255, 100]
};

export const MOB_CONFIG = {
  radius: 3,
  speed: 1.5,
  damage: 10,
  color: [0, 200, 255]
};

export const CHAMPION_CONFIG = {
  tank: {
    radius: 8,
    speed: 1,
    damage: 30,
    health: 100,
    color: [200, 50, 50],
    label: "T"
  },
  speed: {
    radius: 7,
    speed: 2.5,
    damage: 15,
    health: 50,
    color: [50, 200, 50],
    label: "S"
  }
};

export const BASE_CONFIG = {
  x: CANVAS_WIDTH / 2,
  y: 30,
  width: 100,
  height: 40,
  color: [200, 50, 50]
};