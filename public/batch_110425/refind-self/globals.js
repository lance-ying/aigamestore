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

export const ROOM_IDS = {
  ENTRANCE: 0,
  LAB: 1,
  GARDEN: 2,
  ARCHIVE: 3
};

export const gameState = {
  player: null,
  entities: [],
  npcs: [],
  interactables: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentRoom: ROOM_IDS.ENTRANCE,
  personalityMeter: 0, // 0-100
  actionsTracked: [],
  dialoguesCompleted: {},
  puzzlesSolved: {},
  exploredRooms: new Set(),
  
  // Personality tracking
  personalityTraits: {
    curious: 0,
    logical: 0,
    empathetic: 0,
    decisive: 0,
    creative: 0
  },
  
  // Dialogue state
  activeDialogue: null,
  dialogueHistory: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Time tracking
  gameTime: 0,
  frameCount: 0
};

// Expose gameState globally
window.getGameState = function() {
  return gameState;
};

export function resetGameState() {
  gameState.player = null;
  gameState.entities = [];
  gameState.npcs = [];
  gameState.interactables = [];
  gameState.score = 0;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRoom = ROOM_IDS.ENTRANCE;
  gameState.personalityMeter = 0;
  gameState.actionsTracked = [];
  gameState.dialoguesCompleted = {};
  gameState.puzzlesSolved = {};
  gameState.exploredRooms = new Set();
  gameState.personalityTraits = {
    curious: 0,
    logical: 0,
    empathetic: 0,
    decisive: 0,
    creative: 0
  };
  gameState.activeDialogue = null;
  gameState.dialogueHistory = [];
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.gameTime = 0;
  gameState.frameCount = 0;
}