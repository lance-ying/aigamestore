// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  INVENTORY_OPEN: 'INVENTORY_OPEN',
  PUZZLE_ACTIVE: 'PUZZLE_ACTIVE'
};

export const CONTROL_MODES = {
  HUMAN: 'HUMAN',
  TEST_1: 'TEST_1',
  TEST_2: 'TEST_2'
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  currentLevel: 1,
  currentSceneId: null,
  inventory: [],
  hotspotStates: {},
  activePuzzleId: null,
  activeInventoryItemId: null,
  levelTimeRemaining: 0,
  hintsUsedThisLevel: 0,
  selectedHotspotIndex: 0,
  selectedInventoryIndex: 0,
  hintShiftHoldTime: 0,
  levelStartTime: 0,
  phaseBeforePuzzle: null,
  levelScore: 0,
  timeBonus: 0,
  noHintBonus: 0,
  speedRunBonus: 0
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}