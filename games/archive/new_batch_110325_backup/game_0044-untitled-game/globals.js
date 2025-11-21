// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const TILE_SIZE = 40;
export const PLAYER_SIZE = 24;
export const CRATE_SIZE = 36;

export const gameState = {
  player: null,
  entities: [],
  currentRoom: 0,
  totalRooms: 4,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  rooms: [],
  camera: { x: 0, y: 0 },
  checkpoint: { room: 0, x: 0, y: 0 }
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};