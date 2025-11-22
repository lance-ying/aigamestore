// globals.js - Global constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_END_WALLS: "LEVEL_END_WALLS",
  WIN_LEVEL: "WIN_LEVEL",
  GAME_OVER: "GAME_OVER",
  GAME_WIN: "GAME_WIN"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  currentLevel: 1,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  levelProgress: 0,
  scrollSpeed: 2,
  walls: [],
  currentWallIndex: 0,
  wallBreakingPhase: false,
  levelData: null,
  backgroundOffset: 0,
  levelStartTime: 0,
  framesSincePhaseChange: 0
};

export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}