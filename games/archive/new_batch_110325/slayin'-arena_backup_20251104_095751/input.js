// input.js - Input handling for player and game controls

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE, HERO_CLASSES } from './globals.js';
import { openShop, closeShop, purchaseItem } from './shop.js';
import { Player, SHOP_ITEMS } from './entities.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    handleEnterKey(p);
  } else if (keyCode === 27) { // ESC
    handleEscKey(p);
  } else if (keyCode === 82) { // R
    handleRKey(p);
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && !gameState.shopOpen) {
    handleGameplayKeys(p, keyCode);
  }
  
  // Shop controls
  if (gameState.shopOpen) {
    handleShopKeys(p, keyCode);
  }
  
  // Start screen controls
  if (gameState.gamePhase === PHASE_START) {
    handleStartScreenKeys(p, keyCode);
  }
}

function handleEnterKey(p) {
  if (gameState.gamePhase === PHASE_START) {
    startGame(p);
  }
}

function handleEscKey(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (gameState.shopOpen) {
      closeShop();
    } else {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleRKey(p) {
  if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    resetToStart(p);
  }
}

function handleGameplayKeys(p, keyCode) {
  // Movement keys
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    if (gameState.player) {
      gameState.player.moveLeft();
    }
  }
  if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    if (gameState.player) {
      gameState.player.moveRight();
    }
  }
  
  // Interact with merchant
  if (keyCode === 32) { // SPACE
    if (gameState.merchant && gameState.merchant.isPlayerNearby()) {
      openShop();
    }
  }
}

function handleShopKeys(p, keyCode) {
  if (keyCode === 38) { // UP
    gameState.selectedShopItem = Math.max(0, gameState.selectedShopItem - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedShopItem = Math.min(SHOP_ITEMS.length - 1, gameState.selectedShopItem + 1);
  } else if (keyCode === 32) { // SPACE
    purchaseItem(gameState.selectedShopItem, p);
  }
}

function handleStartScreenKeys(p, keyCode) {
  if (keyCode === 37 || keyCode === 65) { // LEFT
    gameState.selectedHeroIndex = Math.max(0, gameState.selectedHeroIndex - 1);
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT
    gameState.selectedHeroIndex = Math.min(HERO_CLASSES.length - 1, gameState.selectedHeroIndex + 1);
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.score = 0;
  gameState.coins = 0;
  gameState.enemiesKilled = 0;
  gameState.survivalTime = 0;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.merchant = null;
  gameState.gameStartTime = Date.now();
  gameState.lastEnemySpawnTime = Date.now();
  gameState.lastMerchantSpawnTime = Date.now();
  gameState.enemySpawnRate = 2000;
  gameState.difficultyLevel = 1;
  gameState.shopOpen = false;
  
  // Create player
  const selectedHero = HERO_CLASSES[gameState.selectedHeroIndex];
  gameState.player = new Player(selectedHero, 300, 300);
  gameState.entities.push(gameState.player);
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, hero: selectedHero.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.merchant = null;
  gameState.shopOpen = false;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function getAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return null;
  }
  
  const get_automated_testing_action = window.get_automated_testing_action;
  if (get_automated_testing_action) {
    return get_automated_testing_action(gameState);
  }
  
  return null;
}