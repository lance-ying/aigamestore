// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const BIRD_TYPES = {
  RED: { name: "Red", color: [220, 40, 40], ability: "NONE", cost: 0 },
  BLUE: { name: "Blue", color: [40, 120, 220], ability: "SPLIT", cost: 50 },
  YELLOW: { name: "Yellow", color: [240, 220, 40], ability: "SPEED_BOOST", cost: 100 },
  BLACK: { name: "Black", color: [40, 40, 40], ability: "EXPLODE", cost: 150 }
};

export const gameState = {
  player: null,
  entities: [],
  birds: [],
  pigs: [],
  structures: [],
  projectiles: [],
  particles: [],
  score: 0,
  gems: 100,
  level: 1,
  birdsRemaining: 3,
  currentBird: null,
  slingshotAngle: -45,
  slingshotPower: 50,
  isAiming: true,
  birdLaunched: false,
  abilityUsed: false,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  frameCount: 0,
  unlockedBirds: ["RED"],
  selectedBirdType: "RED",
  powerUps: [],
  camera: { x: 0, y: 0 }
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;