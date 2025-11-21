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

export const BATTLE_PHASES = {
  NONE: "NONE",
  ENCOUNTER: "ENCOUNTER",
  SELECTING: "SELECTING",
  EXECUTING: "EXECUTING",
  VICTORY: "VICTORY",
  DEFEAT: "DEFEAT"
};

export const gameState = {
  player: null,
  entities: [],
  party: [],
  currentFloor: 1,
  maxFloor: 5,
  score: 0,
  totalOres: 0,
  battlesWon: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  battlePhase: BATTLE_PHASES.NONE,
  currentBattle: null,
  dungeonX: 0,
  dungeonY: 0,
  showPartyMenu: false,
  menuSelection: 0,
  battleLog: []
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.party = [];
  gameState.currentFloor = 1;
  gameState.score = 0;
  gameState.totalOres = 0;
  gameState.battlesWon = 0;
  gameState.battlePhase = BATTLE_PHASES.NONE;
  gameState.currentBattle = null;
  gameState.dungeonX = 1;
  gameState.dungeonY = 1;
  gameState.showPartyMenu = false;
  gameState.menuSelection = 0;
  gameState.battleLog = [];
  gameState.entities = [];
}