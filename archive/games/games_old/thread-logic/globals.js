// globals.js - Global state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER: "GAME_OVER"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  totalScore: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevelIndex: 1,
  screws: [],
  activeScrewId: null,
  cursorPosition: { x: 0, y: 0 },
  levelMovesCount: 0,
  levelStartTime: 0,
  levelScore: 0,
  timeBonus: 0,
  messageText: "",
  messageTimer: 0
};

// Expose gameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}