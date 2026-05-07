// input.js - Input handling

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleKeyPress(p) {
  gameState.keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      startGame();
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame();
      p.logs.game_info.push({
        data: { gamePhase: "START" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleKeyRelease(p) {
  gameState.keys[p.keyCode] = false;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Check for automated testing
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      simulateKeyPress(action.keyCode);
    }
  }
  
  // Player movement
  if (gameState.player) {
    if (isKeyPressed(KEY_LEFT)) {
      gameState.player.moveLeft();
    }
    if (isKeyPressed(KEY_RIGHT)) {
      gameState.player.moveRight();
    }
    if (isKeyPressed(KEY_UP)) {
      gameState.player.moveUp();
    }
    if (isKeyPressed(KEY_DOWN)) {
      gameState.player.moveDown();
    }
    
    // Focus mode
    gameState.player.setFocus(isKeyPressed(KEY_SHIFT));
    
    // Shooting
    if (isKeyPressed(KEY_Z)) {
      gameState.player.fire();
    }
    
    // Special ability
    if (isKeyPressed(KEY_SPACE)) {
      gameState.player.useSpecial();
    }
  }
}

export function handleMenuInput(p) {
  // Boss selection
  if (gameState.gamePhase === "BOSS_SELECT") {
    if (gameState.keys[49]) { // '1' key
      selectBoss(0);
    } else if (gameState.keys[50]) { // '2' key
      selectBoss(1);
    } else if (gameState.keys[51]) { // '3' key
      selectBoss(2);
    }
  }
  
  // Power-up selection
  if (gameState.gamePhase === "POWER_UP") {
    if (gameState.keys[49]) { // '1' key
      selectPowerUp(0);
    } else if (gameState.keys[50]) { // '2' key
      selectPowerUp(1);
    } else if (gameState.keys[51]) { // '3' key
      selectPowerUp(2);
    }
  }
}

function isKeyPressed(keyCode) {
  return gameState.keys[keyCode] === true;
}

function simulateKeyPress(keyCode) {
  gameState.keys[keyCode] = true;
  
  // Auto-release after a frame for most keys
  setTimeout(() => {
    if (keyCode !== KEY_Z && keyCode !== KEY_SHIFT) {
      gameState.keys[keyCode] = false;
    }
  }, 50);
}

function startGame() {
  gameState.gamePhase = "BOSS_SELECT";
  generateBossSelection();
}

function resetGame() {
  // Clear all entities
  gameState.player = null;
  gameState.currentBoss = null;
  gameState.playerProjectiles = [];
  gameState.enemyProjectiles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Reset progression
  gameState.currentStage = 1;
  gameState.bossesDefeated = 0;
  gameState.score = 0;
  gameState.collectedPowerUps = [];
  
  // Reset player stats
  gameState.playerStats = {
    speed: 3.5,
    focusSpeed: 1.5,
    fireRate: 8,
    damage: 10,
    health: 100,
    maxHealth: 100,
    projectileSpeed: 8,
    projectileSize: 5,
    hasSpecialAbility: false,
    specialCooldown: 0,
    maxSpecialCooldown: 180
  };
  
  // Reset visual effects
  gameState.screenShake = 0;
  gameState.flashIntensity = 0;
  
  // Return to start
  gameState.gamePhase = "START";
}

function generateBossSelection() {
  import('./globals.js').then(module => {
    const { BOSS_TYPES } = module;
    
    // Generate 3 random boss options
    gameState.availableBosses = [];
    const usedIndices = [];
    
    for (let i = 0; i < 3; i++) {
      let index;
      do {
        index = Math.floor(Math.random() * BOSS_TYPES.length);
      } while (usedIndices.includes(index));
      
      usedIndices.push(index);
      gameState.availableBosses.push(BOSS_TYPES[index]);
    }
  });
}

function selectBoss(index) {
  if (index < 0 || index >= gameState.availableBosses.length) return;
  
  const bossType = gameState.availableBosses[index];
  
  // Create player and boss
  import('./entities.js').then(module => {
    const { Player, Boss } = module;
    
    if (!gameState.player) {
      gameState.player = new Player(300, 320);
    }
    
    gameState.currentBoss = new Boss(bossType, gameState.currentStage);
    gameState.gamePhase = "PLAYING";
  });
}

function generatePowerUpSelection() {
  import('./globals.js').then(module => {
    const { POWER_UP_TYPES } = module;
    
    // Generate 3 random power-ups weighted by rarity
    gameState.availablePowerUps = [];
    
    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      let selectedPowerUp;
      
      if (roll < 0.6) {
        // Common (60%)
        const commons = POWER_UP_TYPES.filter(p => p.rarity === "common");
        selectedPowerUp = commons[Math.floor(Math.random() * commons.length)];
      } else if (roll < 0.9) {
        // Uncommon (30%)
        const uncommons = POWER_UP_TYPES.filter(p => p.rarity === "uncommon");
        selectedPowerUp = uncommons[Math.floor(Math.random() * uncommons.length)];
      } else {
        // Rare (10%)
        const rares = POWER_UP_TYPES.filter(p => p.rarity === "rare");
        selectedPowerUp = rares[Math.floor(Math.random() * rares.length)];
      }
      
      gameState.availablePowerUps.push(selectedPowerUp);
    }
  });
}

function selectPowerUp(index) {
  if (index < 0 || index >= gameState.availablePowerUps.length) return;
  
  const powerUp = gameState.availablePowerUps[index];
  
  // Apply power-up
  powerUp.apply(gameState.playerStats);
  gameState.collectedPowerUps.push(powerUp);
  
  // Go to next boss selection
  gameState.gamePhase = "BOSS_SELECT";
  generateBossSelection();
}

// Export helper functions
export { startGame, resetGame, generateBossSelection, selectBoss, generatePowerUpSelection, selectPowerUp };