export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

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
  notes: [],
  elfins: [],
  particles: [],
  score: 0,
  combo: 0,
  maxCombo: 0,
  missedNotes: 0,
  maxMisses: 15,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLane: 0,
  scoreMultiplier: 1.0,
  notesHit: 0,
  perfectHits: 0,
  difficulty: 1.0,
  gameTime: 0,
  winScore: 5000
};

export const LANE_Y_POSITIONS = [150, 250];
export const HIT_ZONE_X = 100;
export const HIT_ZONE_WIDTH = 60;
export const NOTE_SPEED_BASE = 3;
export const NOTE_SIZE = 40;
export const PLAYER_SIZE = 50;

window.getGameState = function() {
  return gameState;
};