// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 32;

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  chests: [],
  particles: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN",
  
  // Evolution tracking
  evolutionStage: 0, // 0=monochrome, 1=color, 2=scrolling, 3=advanced combat
  hasColor: false,
  hasScrolling: false,
  hasAdvancedCombat: false,
  
  // Camera for scrolling
  cameraX: 0,
  cameraY: 0,
  
  // World data
  worldWidth: 800,
  worldHeight: 600,
  
  // Game progression
  chestsOpened: 0,
  enemiesDefeated: 0,
  bossDefeated: false,
  
  // Frame tracking
  frameCount: 0
};

// Evolution milestones
export const EVOLUTION_STAGES = {
  MONOCHROME: 0,
  COLOR: 1,
  SCROLLING: 2,
  ADVANCED_COMBAT: 3
};

export const CHEST_TYPES = {
  COLOR: 'color',
  SCROLLING: 'scrolling',
  COMBAT: 'combat',
  TREASURE: 'treasure'
};

export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  CHEST: 'chest',
  PARTICLE: 'particle',
  BOSS: 'boss'
};

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}