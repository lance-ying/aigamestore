// input.js - Input handling

import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Tower, Gem } from './entities.js';
import { startWave, canStartNextWave } from './waves.js';

// Key state tracking
const keys = {};

// Handle key press
export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === "PLAYING" && canStartNextWave()) {
      // Start next wave
      startWave(gameState.currentWave + 1);
    }
  }
  
  if (p.keyCode === 27) { // ESC - Pause
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame();
      gameState.gamePhase = "START";
    }
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Quick gem selection (1-3)
  if (p.keyCode === 49) { // 1 - Ruby
    gameState.selectedGemType = 'RUBY';
    gameState.buildMode = true;
  }
  if (p.keyCode === 50) { // 2 - Sapphire
    gameState.selectedGemType = 'SAPPHIRE';
    gameState.buildMode = true;
  }
  if (p.keyCode === 51) { // 3 - Emerald
    gameState.selectedGemType = 'EMERALD';
    gameState.buildMode = true;
  }
  
  // Space - Context action
  if (p.keyCode === 32) { // SPACE
    if (gameState.buildMode) {
      // Try to build tower or place gem
      attemptBuildOrPlaceGem(p);
    } else if (gameState.selectedTower) {
      // Place gem on selected tower
      if (!gameState.selectedTower.gem) {
        const gemCost = GAME_CONFIG.GEM_BASE_COST;
        if (gameState.mana >= gemCost) {
          const gem = new Gem(gameState.selectedGemType);
          gameState.selectedTower.placeGem(gem);
          gameState.mana -= gemCost;
        }
      }
    }
  }
  
  // Shift - Upgrade tower
  if (p.keyCode === 16) { // SHIFT
    if (gameState.selectedTower && gameState.selectedTower.gem) {
      const upgradeCost = 20;
      if (gameState.mana >= upgradeCost) {
        gameState.selectedTower.upgrade();
        gameState.mana -= upgradeCost;
      }
    }
  }
  
  // Z - Sell tower
  if (p.keyCode === 90) { // Z
    if (gameState.selectedTower) {
      const refund = gameState.selectedTower.getSellValue();
      gameState.mana += refund;
      
      // Remove gem
      if (gameState.selectedTower.gem) {
        const gemIndex = gameState.gems.indexOf(gameState.selectedTower.gem);
        if (gemIndex > -1) {
          gameState.gems.splice(gemIndex, 1);
        }
      }
      
      // Remove tower
      const gridX = gameState.selectedTower.gridX;
      const gridY = gameState.selectedTower.gridY;
      gameState.towerGrid[gridX][gridY] = null;
      
      const towerIndex = gameState.towers.indexOf(gameState.selectedTower);
      if (towerIndex > -1) {
        gameState.towers.splice(towerIndex, 1);
      }
      
      const entityIndex = gameState.entities.indexOf(gameState.selectedTower);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
      
      gameState.selectedTower = null;
    }
  }
}

// Handle key release
export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

// Check if key is pressed
export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// Handle mouse click
export function handleMouseClick(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const mouseX = p.mouseX;
  const mouseY = p.mouseY;
  
  // Check if clicking on a tower
  let clickedTower = null;
  for (const tower of gameState.towers) {
    const dist = Math.sqrt(
      Math.pow(mouseX - tower.x, 2) + 
      Math.pow(mouseY - tower.y, 2)
    );
    
    if (dist <= tower.width / 2) {
      clickedTower = tower;
      break;
    }
  }
  
  if (clickedTower) {
    gameState.selectedTower = clickedTower;
    gameState.buildMode = false;
  } else {
    if (gameState.buildMode) {
      attemptBuildOrPlaceGem(p);
    } else {
      gameState.selectedTower = null;
    }
  }
}

// Attempt to build tower or place gem at mouse position
function attemptBuildOrPlaceGem(p) {
  const mouseX = p.mouseX;
  const mouseY = p.mouseY;
  
  // Convert to grid coordinates
  const gridX = Math.floor(mouseX / gameState.gridSize);
  const gridY = Math.floor(mouseY / gameState.gridSize);
  
  // Check if valid grid position
  if (gridX < 0 || gridX >= gameState.towerGrid.length ||
      gridY < 0 || gridY >= gameState.towerGrid[0].length) {
    return;
  }
  
  // Check if spot is empty
  if (gameState.towerGrid[gridX][gridY] !== null) {
    // Tower exists, try to place gem
    const tower = gameState.towerGrid[gridX][gridY];
    if (!tower.gem) {
      const gemCost = GAME_CONFIG.GEM_BASE_COST;
      if (gameState.mana >= gemCost) {
        const gem = new Gem(gameState.selectedGemType);
        tower.placeGem(gem);
        gameState.mana -= gemCost;
      }
    }
    return;
  }
  
  // Check if on path
  if (isOnPath(gridX * gameState.gridSize + gameState.gridSize / 2, 
               gridY * gameState.gridSize + gameState.gridSize / 2)) {
    return; // Can't build on path
  }
  
  // Try to build tower
  if (gameState.mana >= GAME_CONFIG.TOWER_COST) {
    const x = gridX * gameState.gridSize + gameState.gridSize / 2;
    const y = gridY * gameState.gridSize + gameState.gridSize / 2;
    const tower = new Tower(x, y, gridX, gridY);
    gameState.towerGrid[gridX][gridY] = tower;
    gameState.mana -= GAME_CONFIG.TOWER_COST;
    gameState.selectedTower = tower;
    gameState.buildMode = false;
  }
}

// Check if position is on path
function isOnPath(x, y) {
  const pathWidth = 40;
  
  for (const point of gameState.pathPoints) {
    const dist = Math.sqrt(
      Math.pow(x - point.x, 2) + 
      Math.pow(y - point.y, 2)
    );
    
    if (dist < pathWidth) {
      return true;
    }
  }
  
  return false;
}

// Handle automated testing input
export function handleAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = window.get_automated_testing_action ? 
                 window.get_automated_testing_action(gameState) : null;
  
  if (action && action.keyCode) {
    // Simulate key press
    p.keyCode = action.keyCode;
    p.key = String.fromCharCode(action.keyCode);
    handleKeyPress(p);
    
    // Simulate key release after 5 frames
    setTimeout(() => {
      handleKeyRelease(p);
    }, 5 * (1000 / 60));
  }
}

// Reset game
export function resetGame() {
  const { initGameState } = require('./globals.js');
  initGameState();
}