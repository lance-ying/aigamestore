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
  aiOpponents: [],
  checkpoints: [],
  walls: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  engine: null,
  world: null,
  currentCheckpoint: 0,
  lapCount: 0,
  maxLaps: 3,
  raceStartTime: 0,
  raceEndTime: 0,
  playerFinished: false,
  aiFinishTimes: [],
  boostCharges: 3,
  driftScore: 0,
  trackPath: [],
  cameraOffset: { x: 0, y: 0 }
};

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;