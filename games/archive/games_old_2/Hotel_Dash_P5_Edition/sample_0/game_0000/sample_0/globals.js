// Global game state and constants
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

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2",
  TEST_3: "TEST_3"
};

export const SELECTION_STATES = {
  NEUTRAL: "NEUTRAL",
  GUEST_SELECTED: "GUEST_SELECTED",
  STAFF_SELECTED: "STAFF_SELECTED"
};

export const GUEST_NEEDS = {
  CHECKIN: "CHECKIN",
  FOOD: "FOOD",
  CLEANING: "CLEANING"
};

export const ROOM_STATES = {
  EMPTY: "EMPTY",
  OCCUPIED: "OCCUPIED",
  DIRTY: "DIRTY",
  CLEANING: "CLEANING"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  currentLevel: 1,
  levelTimer: 0,
  levelTimeLimit: 0,
  dissatisfiedCount: 0,
  maxDissatisfied: 0,
  targetCoins: 0,
  guests: [],
  rooms: [],
  kitchen: null,
  reception: null,
  staff: {
    ted: null,
    monica: null
  },
  selectables: [],
  cursorIndex: 0,
  selectionState: SELECTION_STATES.NEUTRAL,
  selectedEntity: null,
  guestSpawnTimer: 0,
  guestSpawnInterval: 5000,
  floatingTexts: [],
  satisfiedCount: 0
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}