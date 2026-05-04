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
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  totalLevels: 5,
  targetsEliminated: 0,
  targetsRequired: 0,
  shotsHit: 0,
  shotsFired: 0,
  timeRemaining: 0,
  ammoInClip: 0,
  ammoReserve: 0,
  isReloading: false,
  reloadStartFrame: 0,
  zoomLevel: 1,
  cameraX: 0,
  cameraY: 0,
  missionStarted: false,
  levelDefinitions: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}