export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  coins: 0,
  fuel: 100,
  distance: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  engine: null,
  world: null,
  terrain: [],
  collectibles: [],
  groundBodies: [],
  finishLine: null,
  camera: { x: 0, y: 0 },
  lastLoggedX: 0,
  testModeTimer: 0,
  crashed: false,
  won: false
};

export function getGameState() {
  return gameState;
}

// Expose globally
window.getGameState = getGameState;