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

export const FACTIONS = {
  MARQUISE: "MARQUISE",
  ALLIANCE: "ALLIANCE",
  EYRIE: "EYRIE",
  VAGABOND: "VAGABOND"
};

export const CLEARING_SUITS = {
  FOX: "FOX",
  MOUSE: "MOUSE",
  RABBIT: "RABBIT"
};

export const BUILDING_TYPES = {
  WORKSHOP: "WORKSHOP",
  SAWMILL: "SAWMILL",
  RECRUITER: "RECRUITER",
  BASE: "BASE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  clearings: [],
  factions: [],
  currentFactionIndex: 0,
  selectedClearing: null,
  selectedUnit: null,
  actionMode: null,
  turnPhase: "MOVE",
  combatQueue: [],
  victoryCounts: {},
  gameTime: 0,
  aiDelay: 0,
  movementHistory: []
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export function resetGameState() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.clearings = [];
  gameState.factions = [];
  gameState.currentFactionIndex = 0;
  gameState.selectedClearing = null;
  gameState.selectedUnit = null;
  gameState.actionMode = null;
  gameState.turnPhase = "MOVE";
  gameState.combatQueue = [];
  gameState.victoryCounts = {};
  gameState.gameTime = 0;
  gameState.aiDelay = 0;
  gameState.movementHistory = [];
}