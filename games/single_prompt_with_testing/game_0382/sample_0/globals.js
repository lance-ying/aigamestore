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

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  projectiles: [],
  powerGems: [],
  platforms: [],
  currentWorld: 1,
  score: 0,
  powerGemsCollected: 0,
  enemiesDefeated: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  boss: null,
  worldTransitionTimer: 0,
  cameraOffsetX: 0,
  worldWidth: 1200,
  dashUnlocked: false,
  framesSurvived: 0
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;