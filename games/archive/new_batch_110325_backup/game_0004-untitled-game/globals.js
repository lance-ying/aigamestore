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

export const PLAY_PHASES = {
  RESEARCH: "RESEARCH",
  ACTION: "ACTION",
  PRODUCTION: "PRODUCTION"
};

// Global parameters targets
export const GLOBAL_TARGETS = {
  TEMPERATURE: 8, // +8°C
  OXYGEN: 14, // 14%
  OCEANS: 9 // 9 ocean tiles
};

export const INITIAL_VALUES = {
  TEMPERATURE: -30,
  OXYGEN: 0,
  OCEANS: 0,
  MC: 42, // Starting MegaCredits
  TR: 20, // Starting Terraform Rating
  GENERATION: 1
};

// Card costs
export const STANDARD_PROJECTS = {
  OCEAN: { cost: 18, type: "ocean" },
  FOREST: { cost: 23, type: "forest" },
  CITY: { cost: 25, type: "city" },
  TEMP: { cost: 14, type: "temp" },
  OXYGEN: { cost: 17, type: "oxygen" }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  playPhase: PLAY_PHASES.RESEARCH,
  controlMode: "HUMAN",
  generation: INITIAL_VALUES.GENERATION,
  mc: INITIAL_VALUES.MC,
  tr: INITIAL_VALUES.TR,
  mcProduction: 0,
  temperature: INITIAL_VALUES.TEMPERATURE,
  oxygen: INITIAL_VALUES.OXYGEN,
  oceans: INITIAL_VALUES.OCEANS,
  hand: [],
  playedCards: [],
  selectedCardIndex: -1,
  menuSelection: 0,
  actionType: null, // "card", "standard_project", null
  cities: 0,
  forests: 0,
  milestonesAchieved: [],
  vp: 0,
  cardsThisGeneration: 0,
  maxCardsPerGeneration: 3
};

// Export function to access game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}