// globals.js - Global game state and constants
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
  TEST_4: "TEST_4"
};

export const gameState = {
  player: null,
  entities: [],
  memoryOrbs: [],
  temporalDistortions: [],
  score: 0,
  orbsCollected: 0,
  currentLayer: 1,
  maxLayers: 5,
  memoryIntegrity: 100,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  storyFragments: [],
  currentStoryIndex: 0,
  temporalStabilizerActive: false,
  temporalStabilizerCooldown: 0,
  framesSinceLastOrb: 0,
  totalGameFrames: 0
};

// Story fragments for each memory layer
export const STORY_DATA = [
  { layer: 1, text: "The lighthouse... where it all began.", orbs: 3 },
  { layer: 2, text: "A promise under the stars with River.", orbs: 4 },
  { layer: 3, text: "The rabbit constellation... Anya.", orbs: 5 },
  { layer: 4, text: "The paper rabbits... always waiting.", orbs: 6 },
  { layer: 5, text: "To the moon... for River, for Anya, for love.", orbs: 7 }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}