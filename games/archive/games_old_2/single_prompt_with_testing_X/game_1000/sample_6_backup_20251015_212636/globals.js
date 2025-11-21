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

export const BIRD_TYPES = {
  RED: { name: "Red", ability: "speed_boost", color: [220, 20, 20] },
  BLUE: { name: "Blue", ability: "split", color: [30, 100, 220] },
  YELLOW: { name: "Yellow", ability: "speed_boost", color: [240, 220, 30] },
  BLACK: { name: "Black", ability: "explode", color: [40, 40, 40] }
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  engine: null,
  world: null,
  player: null,
  entities: [],
  birds: [],
  pigs: [],
  structures: [],
  currentBird: null,
  currentBirdIndex: 0,
  birdsRemaining: 3,
  slingshotAngle: -45,
  slingshotPower: 50,
  isAiming: true,
  birdInFlight: false,
  abilityUsed: false,
  score: 0,
  gems: 0,
  levelComplete: false,
  groundBody: null,
  slingshotBase: { x: 100, y: 320 },
  cameraOffsetX: 0,
  
  // Test automation state
  testFrameCount: 0,
  testState: "init",
  testBirdLaunched: false,
  testWaitFrames: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;