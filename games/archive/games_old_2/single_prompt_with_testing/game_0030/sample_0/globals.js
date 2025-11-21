// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRID_SIZE = 10;
export const CELL_SIZE = 25;

// Ship configurations
export const SHIP_CONFIGS = [
  { name: 'Carrier', length: 5, color: [255, 100, 100] },
  { name: 'Battleship', length: 4, color: [100, 255, 100] },
  { name: 'Cruiser', length: 3, color: [100, 100, 255] },
  { name: 'Submarine', length: 3, color: [255, 255, 100] },
  { name: 'Destroyer', length: 2, color: [255, 100, 255] }
];

// Commander abilities
export const ABILITIES = {
  SALVO: { name: 'Salvo', cost: 2, cooldown: 3, description: '3 shots in line' },
  SONAR: { name: 'Sonar Ping', cost: 3, cooldown: 5, description: 'Reveal 3x3 area' },
  REPAIR: { name: 'Emergency Repair', cost: 2, cooldown: 4, description: 'Restore 2 HP' }
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLACING_SHIPS", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  engine: null,
  world: null,
  
  // Grid state
  playerGrid: null,
  aiGrid: null,
  
  // Ships
  playerShips: [],
  aiShips: [],
  
  // Turn management
  turnNumber: 0,
  isPlayerTurn: true,
  
  // Cursor for targeting
  cursorX: 0,
  cursorY: 0,
  
  // Resources and abilities
  playerResources: 3, // Start with some resources
  selectedAbility: null,
  abilityCooldowns: {
    SALVO: 0,
    SONAR: 0,
    REPAIR: 0
  },
  
  // AI state
  aiTargetQueue: [],
  aiLastHit: null,
  
  // Visual effects
  effects: [],
  
  // Ship placement state
  placementShipIndex: 0,
  placementHorizontal: true,
  placementValid: false,
  
  // Test automation
  testTimer: 0,
  testPhase: 0,
  testTargets: []
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}