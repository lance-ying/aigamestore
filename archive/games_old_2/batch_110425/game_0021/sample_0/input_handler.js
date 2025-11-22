// input_handler.js - Input handling for human and automated testing

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, TOWER_TYPES } from './globals.js';
import { Tower } from './entities.js';
import { isValidPlacement } from './pathfinding.js';
import { startNextWave } from './wave_manager.js';

let keysPressed = {};

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  keysPressed[keyCode] = true;
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
    handleGameplayInput(p, keyCode);
  }
}

export function handleKeyReleased(p, keyCode) {
  keysPressed[keyCode] = false;
}

function handleGameplayInput(p, keyCode) {
  if (keyCode === 32) { // SPACE
    handleSpaceKey(p);
  } else if (keyCode === 90) { // Z
    handleZKey(p);
  } else if (keyCode === 16) { // SHIFT
    handleShiftKey(p);
  }
}

function handleSpaceKey(p) {
  if (!gameState.player) return;
  
  // If tower selected, deselect
  if (gameState.selectedTower) {
    gameState.selectedTower = null;
    return;
  }
  
  // Try to select nearby tower
  for (const tower of gameState.towers) {
    const dist = Math.hypot(tower.x - gameState.player.x, tower.y - gameState.player.y);
    if (dist < 35) {
      gameState.selectedTower = tower;
      return;
    }
  }
  
  // Try to place tower
  const placement = isValidPlacement(
    gameState.player.x,
    gameState.player.y,
    gameState.validPlacementLocations,
    gameState.towers
  );
  
  if (placement) {
    const towerConfig = TOWER_TYPES[gameState.selectedTowerType];
    if (gameState.gold >= towerConfig.cost) {
      const tower = new Tower(placement.x, placement.y, gameState.selectedTowerType);
      gameState.gold -= towerConfig.cost;
      gameState.towers.push(tower);
      gameState.entities.push(tower);
    }
  }
}

function handleZKey(p) {
  if (gameState.selectedTower) {
    // Upgrade tower
    gameState.selectedTower.upgrade();
  } else if (gameState.player) {
    // Use hero ability
    gameState.player.useAbility();
  }
}

function handleShiftKey(p) {
  if (gameState.selectedTower) {
    // Sell tower
    const sellValue = gameState.selectedTower.getSellValue();
    gameState.gold += sellValue;
    
    const index = gameState.towers.indexOf(gameState.selectedTower);
    if (index > -1) {
      gameState.towers.splice(index, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(gameState.selectedTower);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    gameState.selectedTower = null;
  }
}

export function handleMovementInput(p) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.controlMode === "HUMAN") {
    let dx = 0;
    let dy = 0;
    
    if (p.keyIsDown(37)) dx -= 1; // LEFT
    if (p.keyIsDown(39)) dx += 1; // RIGHT
    if (p.keyIsDown(38)) dy -= 1; // UP
    if (p.keyIsDown(40)) dy += 1; // DOWN
    
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      gameState.player.move(dx / length, dy / length);
      
      // Log player position periodically
      if (p.frameCount % 30 === 0) {
        logPlayerPosition(p);
      }
    }
  }
}

function logPlayerPosition(p) {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Apply meta upgrades to starting gold
  const goldBonus = gameState.metaUpgrades.STARTING_GOLD * 50;
  gameState.gold = 200 + goldBonus;
  
  // Start first wave after delay
  gameState.waveStartDelay = 120; // 2 seconds
}

function restartGame(p) {
  // Keep total stars and meta upgrades
  const totalStars = gameState.totalStars;
  const metaUpgrades = { ...gameState.metaUpgrades };
  
  // Reset game state
  Object.assign(gameState, {
    gamePhase: PHASE_START,
    gold: 200,
    lives: 20,
    stars: 0,
    totalStars: totalStars,
    metaUpgrades: metaUpgrades,
    currentWave: 0,
    waveInProgress: false,
    waveStartDelay: 0,
    enemiesRemaining: 0,
    player: null,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    entities: [],
    selectedTower: null,
    showUpgradeMenu: false,
    framesSinceLastAction: 0,
    testingPositionHistory: []
  });
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, event: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Process movement
  if (action.move && gameState.player) {
    let dx = 0;
    let dy = 0;
    
    if (action.move.left) dx -= 1;
    if (action.move.right) dx += 1;
    if (action.move.up) dy -= 1;
    if (action.move.down) dy += 1;
    
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      gameState.player.move(dx / length, dy / length);
    }
  }
  
  // Process actions
  if (action.placeOrSelectTower) {
    handleSpaceKey(p);
  }
  
  if (action.upgradeTower) {
    handleZKey(p);
  }
  
  if (action.sellTower) {
    handleShiftKey(p);
  }
  
  if (action.changeTowerType) {
    const types = Object.keys(TOWER_TYPES);
    const currentIndex = types.indexOf(gameState.selectedTowerType);
    gameState.selectedTowerType = types[(currentIndex + 1) % types.length];
  }
}