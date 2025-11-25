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
  TEST_2: "TEST_2"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  npcs: [],
  glyphObjects: [],
  collectedGlyphs: [],
  translatedGlyphs: [],
  score: 0,
  currentFloor: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  notebookOpen: false,
  selectedGlyph: null,
  selectedMeaning: null,
  floors: [],
  cameraOffsetY: 0,
  interactionPrompt: null,
  peopleUnited: 0,
  totalPeoples: 3
};

// Language data - 3 peoples with unique glyphs
export const LANGUAGES = [
  {
    name: "Watchers",
    floor: 0,
    color: [100, 150, 255],
    glyphs: [
      { symbol: "◐", meaning: "sun", context: "light" },
      { symbol: "◑", meaning: "moon", context: "night" },
      { symbol: "⚘", meaning: "water", context: "flow" },
      { symbol: "△", meaning: "mountain", context: "high" }
    ]
  },
  {
    name: "Builders",
    floor: 1,
    color: [255, 150, 100],
    glyphs: [
      { symbol: "⌂", meaning: "home", context: "shelter" },
      { symbol: "⚒", meaning: "tool", context: "build" },
      { symbol: "⊞", meaning: "stone", context: "solid" },
      { symbol: "⚡", meaning: "power", context: "energy" }
    ]
  },
  {
    name: "Seekers",
    floor: 2,
    color: [150, 255, 150],
    glyphs: [
      { symbol: "◈", meaning: "truth", context: "wisdom" },
      { symbol: "⊕", meaning: "unity", context: "together" },
      { symbol: "⟡", meaning: "star", context: "guide" },
      { symbol: "∞", meaning: "eternal", context: "forever" }
    ]
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}