// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 360;
export const GRAVITY = 0.3;
export const SLINGSHOT_X = 100;
export const SLINGSHOT_Y = GROUND_Y - 30;

export const BIRD_TYPES = {
  RED: { name: 'Red', color: [220, 50, 50], unlocked: true, cost: 0, ability: 'none' },
  BLUE: { name: 'Blue', color: [50, 120, 220], unlocked: false, cost: 50, ability: 'split' },
  YELLOW: { name: 'Yellow', color: [240, 220, 50], unlocked: false, cost: 100, ability: 'speed' },
  BLACK: { name: 'Black', color: [40, 40, 40], unlocked: false, cost: 150, ability: 'bomb' }
};

export const gameState = {
  player: null,
  entities: [],
  birds: [],
  pigs: [],
  structures: [],
  particles: [],
  projectiles: [],
  score: 0,
  gems: 100,
  level: 1,
  birdsRemaining: 3,
  currentBirdType: 'RED',
  gamePhase: "START",
  controlMode: "HUMAN",
  slingshotAngle: -45,
  slingshotPower: 5,
  launchedBird: null,
  abilityUsed: false,
  positionHistory: []
};

// Function to expose game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}