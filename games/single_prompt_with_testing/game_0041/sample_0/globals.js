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

export const gameState = {
  player: null,
  entities: [],
  gems: [],
  fuelStations: [],
  caveSegments: [],
  score: 0,
  gemsCollected: 0,
  fuel: 100,
  maxFuel: 100,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  framesSinceStart: 0,
  isLanded: false,
  cameraY: 0,
  surfaceY: 100,
  returnedToSurface: false,
  difficulty: 1
};

// Expose gameState getter
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.gems = [];
  gameState.fuelStations = [];
  gameState.caveSegments = [];
  gameState.score = 0;
  gameState.gemsCollected = 0;
  gameState.fuel = 100;
  gameState.maxFuel = 100;
  gameState.framesSinceStart = 0;
  gameState.isLanded = false;
  gameState.cameraY = 0;
  gameState.returnedToSurface = false;
  gameState.difficulty = 1;
}