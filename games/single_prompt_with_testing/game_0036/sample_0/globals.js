// globals.js - Game constants and state management

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const GAME_PHASE = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

// Room types
export const ROOMS = {
  COCKPIT: { x: 50, y: 50, width: 200, height: 150, name: "Cockpit" },
  CARGO: { x: 300, y: 50, width: 250, height: 150, name: "Cargo Hold" },
  QUARTERS: { x: 50, y: 220, width: 200, height: 130, name: "Crew Quarters" },
  MEDBAY: { x: 300, y: 220, width: 250, height: 130, name: "Medbay" }
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  interactables: [],
  score: 0,
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  
  // Survival stats
  daysSurvived: 0,
  framesSinceDay: 0,
  framesPerDay: 900, // 15 seconds at 60fps
  
  hunger: 100,
  health: 100,
  sanity: 100,
  power: 100,
  
  foodRations: 30,
  
  // Degradation rates (per frame)
  hungerDecay: 0.015,
  sanityDecay: 0.008,
  powerDecay: 0.012,
  
  // Effects
  showStatus: false,
  statusTimer: 0,
  
  // Hallucinations
  hallucinationIntensity: 0,
  hallucinationTimer: 0,
  
  // Game over reason
  gameOverReason: ""
};

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function resetGameState() {
  gameState.daysSurvived = 0;
  gameState.framesSinceDay = 0;
  gameState.hunger = 100;
  gameState.health = 100;
  gameState.sanity = 100;
  gameState.power = 100;
  gameState.foodRations = 30;
  gameState.score = 0;
  gameState.showStatus = false;
  gameState.statusTimer = 0;
  gameState.hallucinationIntensity = 0;
  gameState.hallucinationTimer = 0;
  gameState.gameOverReason = "";
  gameState.entities = [];
  gameState.interactables = [];
}