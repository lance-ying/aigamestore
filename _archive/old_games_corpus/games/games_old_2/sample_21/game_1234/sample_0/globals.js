// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";
export const PHASE_SKILL_SELECTION = "SKILL_SELECTION";
export const PHASE_UPGRADE_MENU = "UPGRADE_MENU";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_W = 87;
export const KEY_A = 65;
export const KEY_S = 83;
export const KEY_D = 68;

// Game state object
export const gameState = {
  player: null,
  entities: [],
  projectiles: [],
  enemies: [],
  currentLevel: 1,
  currentRoom: 1,
  roomsPerLevel: [5, 7, 10, 12, 15],
  score: 0,
  gold: 0,
  totalGold: 0, // Persistent gold across runs
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  skillOptions: [],
  selectedSkillIndex: -1,
  currentSkills: [],
  roomCleared: false,
  levelTransitionTimer: 0,
  pauseMenuSelection: 0,
  startMenuSelection: 0,
  upgradeMenuSelection: 0,
  permanentUpgrades: {
    maxHPBonus: 0,
    damageBonus: 0,
    attackSpeedBonus: 0,
    goldBonus: 0
  },
  highScore: 0,
  deathTimer: 0,
  victoryTimer: 0,
  roomEnemiesKilled: 0,
  levelEnemiesKilled: 0
};

// Load saved data from localStorage
export function loadSavedData() {
  try {
    const saved = localStorage.getItem('archeroSave');
    if (saved) {
      const data = JSON.parse(saved);
      gameState.totalGold = data.totalGold || 0;
      gameState.highScore = data.highScore || 0;
      gameState.permanentUpgrades = data.permanentUpgrades || {
        maxHPBonus: 0,
        damageBonus: 0,
        attackSpeedBonus: 0,
        goldBonus: 0
      };
    }
  } catch (e) {
    console.error("Error loading saved data:", e);
  }
}

// Save data to localStorage
export function saveData() {
  try {
    const data = {
      totalGold: gameState.totalGold,
      highScore: gameState.highScore,
      permanentUpgrades: gameState.permanentUpgrades
    };
    localStorage.setItem('archeroSave', JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode globally
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
};