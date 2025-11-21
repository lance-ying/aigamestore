// globals.js - Global constants and state management

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
  // Core game state
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Matter.js physics
  engine: null,
  world: null,
  runner: null,
  
  // Canvas rendering
  canvas: null,
  ctx: null,
  
  // Game entities
  player: null, // The current bird to launch
  birds: [], // Array of bird objects
  pigs: [], // Array of pig objects
  structures: [], // Array of structure blocks
  ground: null,
  slingshot: null,
  
  // Game progress
  currentBirdIndex: 0,
  totalBirds: 3,
  pigsRemaining: 0,
  totalPigs: 0,
  score: 0,
  
  // Slingshot mechanics
  slingshotState: "READY", // READY, PULLING, LAUNCHED, FLYING
  pullbackDistance: 0,
  launchAngle: 0,
  launchPower: 0,
  
  // Level data
  currentLevel: 1,
  levelComplete: false,
  
  // Camera
  cameraX: 0,
  cameraY: 0
};

export const logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Make logs globally accessible
if (typeof window !== 'undefined') {
  window.logs = logs;
}

export function logGameInfo(data = {}) {
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: data,
    framecount: gameState.frameCount || 0,
    timestamp: Date.now()
  });
}

export function logInput(inputType, data) {
  logs.inputs.push({
    input_type: inputType,
    data: data,
    framecount: gameState.frameCount || 0,
    timestamp: Date.now()
  });
}

export function logPlayerInfo() {
  if (gameState.player && gameState.player.body) {
    const body = gameState.player.body;
    logs.player_info.push({
      screen_x: body.position.x - gameState.cameraX,
      screen_y: body.position.y - gameState.cameraY,
      game_x: body.position.x,
      game_y: body.position.y,
      framecount: gameState.frameCount || 0,
      timestamp: Date.now()
    });
  }
}

export function getGameState() {
  return gameState;
}

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}