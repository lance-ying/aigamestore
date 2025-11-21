// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const TILE_TYPES = {
  EMPTY: 0,
  WEAPON: 1,
  MAGIC: 2,
  DEFENSE: 3,
  GOLD: 4,
  HEALTH: 5,
  ENEMY: 6,
  SPECIAL_ENEMY: 7,
  ABILITY: 8
};

export const GRID_SIZE = 8;
export const TILE_SIZE = 45;
export const GRID_OFFSET_X = 50;
export const GRID_OFFSET_Y = 50;

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player stats
  player: null,
  entities: [],
  
  // Grid state
  grid: [],
  currentPath: [],
  cursorX: 0,
  cursorY: 0,
  
  // Progression
  score: 0,
  gold: 0,
  level: 1,
  experience: 0,
  experienceToLevel: 100,
  specialMonstersDefeated: 0,
  
  // Stats
  maxHealth: 100,
  health: 100,
  attack: 10,
  defense: 5,
  magicPower: 8,
  
  // Items and abilities
  items: [],
  unlockedAbilities: [],
  currentAbility: null,
  abilityCooldown: 0,
  
  // Turn tracking
  turnCount: 0,
  enemiesOnBoard: [],
  
  // Difficulty
  difficulty: 1,
  
  // Position tracking for testing
  positionHistory: [],
  
  // UI state
  selectedShopItem: null,
  showShop: false
};

// Initialize player entity
export function initializePlayer() {
  gameState.player = {
    x: GRID_OFFSET_X + GRID_SIZE * TILE_SIZE / 2,
    y: GRID_OFFSET_Y + GRID_SIZE * TILE_SIZE / 2,
    type: "player"
  };
  gameState.entities = [gameState.player];
}

export function resetGameState() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.gold = 0;
  gameState.level = 1;
  gameState.experience = 0;
  gameState.experienceToLevel = 100;
  gameState.specialMonstersDefeated = 0;
  gameState.maxHealth = 100;
  gameState.health = 100;
  gameState.attack = 10;
  gameState.defense = 5;
  gameState.magicPower = 8;
  gameState.items = [];
  gameState.unlockedAbilities = [];
  gameState.currentAbility = null;
  gameState.abilityCooldown = 0;
  gameState.turnCount = 0;
  gameState.enemiesOnBoard = [];
  gameState.currentPath = [];
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.grid = [];
  gameState.positionHistory = [];
  gameState.selectedShopItem = null;
  gameState.showShop = false;
  initializePlayer();
}

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

export function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

window.setControlMode = setControlMode;