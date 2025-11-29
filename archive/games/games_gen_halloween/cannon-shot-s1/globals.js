export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLACEMENT_STATE = {
  PLACING: "PLACING",
  READY: "READY",
  FIRING: "FIRING",
  COMPLETE: "COMPLETE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  
  // Game specific
  currentLevel: 1,
  placementState: PLACEMENT_STATE.PLACING,
  placedObjects: [],
  availableObjects: [],
  selectedObjectIndex: 0,
  previewObject: null,
  cannon: null,
  balls: [],
  buckets: [],
  ballsToFire: 20,
  ballsFired: 0,
  cannonCooldown: 0,
  levelComplete: false,
  levelFailed: false,
  
  // Unlockables
  unlockedCannons: [0], // Start with basic cannon
  currentCannonSkin: 0,
  
  // Testing
  testFrameCount: 0,
  testPhase: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}