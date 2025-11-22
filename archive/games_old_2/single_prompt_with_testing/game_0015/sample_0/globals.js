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
  clues: [],
  interactables: [],
  walls: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  cluesCollected: 0,
  totalClues: 5,
  flashlightOn: false,
  nearbyObject: null,
  puzzlesSolved: [],
  currentRoom: "entrance",
  timeElapsed: 0,
  messageQueue: [],
  hasSeenJumpScare: false,
  atmosphereIntensity: 0
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.clues = [];
  gameState.interactables = [];
  gameState.walls = [];
  gameState.score = 0;
  gameState.cluesCollected = 0;
  gameState.flashlightOn = false;
  gameState.nearbyObject = null;
  gameState.puzzlesSolved = [];
  gameState.currentRoom = "entrance";
  gameState.timeElapsed = 0;
  gameState.messageQueue = [];
  gameState.hasSeenJumpScare = false;
  gameState.atmosphereIntensity = 0;
}