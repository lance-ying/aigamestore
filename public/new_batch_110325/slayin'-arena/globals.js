// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Hero classes
export const HERO_CLASSES = [
  { name: "Knight", baseHealth: 100, baseDamage: 150, baseSpeed: 2.5, baseArmor: 5, color: [180, 180, 200] },
  { name: "Barbarian", baseHealth: 120, baseDamage: 200, baseSpeed: 2.0, baseArmor: 3, color: [200, 100, 80] },
  { name: "Rogue", baseHealth: 80, baseDamage: 120, baseSpeed: 3.5, baseArmor: 2, color: [100, 150, 100] },
  { name: "Mage", baseHealth: 70, baseDamage: 250, baseSpeed: 2.2, baseArmor: 1, color: [150, 100, 200] },
  { name: "Paladin", baseHealth: 110, baseDamage: 180, baseSpeed: 2.3, baseArmor: 6, color: [220, 200, 120] },
  { name: "Ranger", baseHealth: 85, baseDamage: 140, baseSpeed: 3.0, baseArmor: 2, color: [120, 180, 100] }
];

// Game state
export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  particles: [],
  merchant: null,
  score: 0,
  coins: 0,
  enemiesKilled: 0,
  survivalTime: 0,
  gamePhase: PHASE_START,
  controlMode: "HUMAN",
  selectedHeroIndex: 0,
  gameStartTime: 0,
  lastEnemySpawnTime: 0,
  enemySpawnRate: 2000, // ms
  lastMerchantSpawnTime: 0,
  merchantSpawnInterval: 30000, // 30 seconds
  difficultyLevel: 1,
  bossWaveActive: false,
  shopOpen: false,
  selectedShopItem: 0,
  keysHeld: {}
};

// Expose getGameState globally
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode setter
export function setControlMode(mode) {
  gameState.controlMode = mode;
  updateControlButtons();
}

function updateControlButtons() {
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if ((btnId === 'humanModeBtn' && gameState.controlMode === 'HUMAN') ||
          (btnId === 'test_1_ModeBtn' && gameState.controlMode === 'TEST_1') ||
          (btnId === 'test_2_ModeBtn' && gameState.controlMode === 'TEST_2') ||
          (btnId === 'test_3_ModeBtn' && gameState.controlMode === 'TEST_3')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

window.setControlMode = setControlMode;