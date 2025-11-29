// globals.js - Global constants and game state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Key codes
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_R = 82;

// World dimensions
export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 800;

// Game state object
export const gameState = {
  // Core game state
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  frameCount: 0,
  lastFrameTime: 0,
  deltaTime: 0,
  
  // Entities
  player: null,
  entities: [],
  npcs: [],
  tablets: [],
  buildings: [],
  particles: [],
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Game progress
  score: 0,
  tabletsCollected: 0,
  totalTablets: 8,
  loopCount: 0,
  curseTriggered: false,
  timeLoopUnlocked: false,
  
  // NPC dialogue state
  activeDialogue: null,
  dialogueHistory: [],
  npcKnowledge: {}, // Tracks what player learned from each NPC
  
  // Quest tracking
  cluesFound: [],
  moralChoicesMade: [],
  
  // Input tracking
  keys: {},
  lastInteraction: 0,
  
  // Game mechanics
  gravity: 0.6,
  friction: 0.85,
  maxSpeed: 4,
  sprintMultiplier: 1.5,
};

// Initialize logs
export function initializeLogs(p) {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  // Log initial state
  p.logs.game_info.push({
    data: { 
      gamePhase: gameState.gamePhase,
      controlMode: gameState.controlMode
    },
    framecount: 0,
    timestamp: Date.now()
  });
}

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Logging utilities
export function logGameInfo(p, data) {
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: data,
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function logPlayerInfo(p, playerData) {
  if (p.logs && p.logs.player_info) {
    p.logs.player_info.push({
      ...playerData,
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function logInput(p, inputType, data) {
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}