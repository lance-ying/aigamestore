// input.js - Input handling

import { gameState, GAME_PHASES, GRID_COLS, GRID_ROWS } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      unpauseGame(p);
    }
  } else if (keyCode === 82) { // R
    restartGame(p);
  }

  // Gameplay keys - only during PLAYING phase
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const selector = gameState.player;
  if (!selector) return;
  
  if (keyCode === 37) { // LEFT
    selector.moveLeft();
    gameState.selectorX = selector.gridX;
  } else if (keyCode === 39) { // RIGHT
    selector.moveRight();
    gameState.selectorX = selector.gridX;
  } else if (keyCode === 38) { // UP
    selector.moveUp();
    gameState.selectorY = selector.gridY;
  } else if (keyCode === 40) { // DOWN
    selector.moveDown();
    gameState.selectorY = selector.gridY;
  } else if (keyCode === 32) { // SPACE
    handleSpaceAction(p);
  }
}

function handleSpaceAction(p) {
  if (gameState.isHoldingItem) {
    attemptDropItem(p);
  } else {
    attemptPickupItem(p);
  }
}

function attemptPickupItem(p) {
  const selector = gameState.player;
  if (!selector) return;
  
  // Find item at selector position
  const item = gameState.items.find(item => 
    !item.isSorted && 
    item.gridX === selector.gridX && 
    item.gridY === selector.gridY
  );
  
  if (item) {
    gameState.isHoldingItem = true;
    gameState.heldItemId = item.id;
    item.isBeingHeld = true;
    item.originalX = item.currentX;
    item.originalY = item.currentY;
    
    p.logs.player_info.push({
      action: 'pickup',
      itemId: item.id,
      itemType: item.type,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function attemptDropItem(p) {
  const item = gameState.items.find(i => i.id === gameState.heldItemId);
  if (!item) return;
  
  const selector = gameState.player;
  if (!selector) return;
  
  // Check if over a container
  const container = gameState.containers.find(c => 
    c.gridX === selector.gridX && c.gridY === selector.gridY
  );
  
  if (container) {
    if (container.acceptedType === item.type && !container.isFull()) {
      // Correct drop
      item.isSorted = true;
      item.containerId = container.id;
      container.addItem(item.id);
      
      // Position item in container
      const itemsInContainer = container.itemsInside.length;
      const angle = (itemsInContainer - 1) * 0.5;
      const radius = 15;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      
      item.snapTo(container.x + container.width / 2 + offsetX, container.y + container.height / 2 + offsetY + 10);
      
      gameState.score += 100;
      
      p.logs.player_info.push({
        action: 'drop_success',
        itemId: item.id,
        containerId: container.id,
        points: 100,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Check win condition
      checkLevelComplete(p);
    } else {
      // Wrong container or full
      item.setTarget(item.originalX, item.originalY);
      gameState.score = Math.max(0, gameState.score - 25);
      
      p.logs.player_info.push({
        action: 'drop_fail',
        itemId: item.id,
        containerId: container.id,
        points: -25,
        reason: container.isFull() ? 'container_full' : 'type_mismatch',
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    // Drop outside container - return to original
    item.setTarget(item.originalX, item.originalY);
    
    p.logs.player_info.push({
      action: 'drop_cancel',
      itemId: item.id,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  item.isBeingHeld = false;
  gameState.isHoldingItem = false;
  gameState.heldItemId = null;
}

function checkLevelComplete(p) {
  const allSorted = gameState.items.every(item => item.isSorted);
  
  if (allSorted) {
    // Time bonus
    const timeBonus = Math.floor(gameState.timeRemaining * 10);
    gameState.score += timeBonus;
    
    if (gameState.currentLevel < 5) {
      gameState.currentLevel++;
      
      // Small delay before next level
      setTimeout(() => {
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          loadLevel(p, gameState.currentLevel);
        }
      }, 1000);
    } else {
      // Game complete
      gameWin(p);
    }
  }
}

function startGame(p) {
  // Update phase first before any other operations
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  // Load the first level
  loadLevel(p, 1);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.timeRemaining = 0;
  gameState.items = [];
  gameState.containers = [];
  gameState.entities = [];
  gameState.isHoldingItem = false;
  gameState.heldItemId = null;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function gameWin(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    try {
      localStorage.setItem('orderlySort_highScore', gameState.highScore.toString());
    } catch (e) {
      // localStorage not available
    }
  }
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_WIN", score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function gameLose(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_LOSE", score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loadLevel(p, levelNum) {
  import('./levels.js').then(module => {
    const config = module.LEVEL_CONFIGS[levelNum - 1];
    if (!config) return;
    
    gameState.levelConfig = config;
    gameState.timeRemaining = config.timeLimit;
    gameState.timeLimit = config.timeLimit;
    gameState.isHoldingItem = false;
    gameState.heldItemId = null;
    
    // Clear entities
    gameState.items = [];
    gameState.containers = [];
    gameState.entities = [];
    
    // Create items
    import('./entities.js').then(entitiesModule => {
      config.items.forEach((itemConfig, index) => {
        const item = new entitiesModule.Item(
          `item_${index}`,
          itemConfig.type,
          itemConfig.gridX,
          itemConfig.gridY,
          p
        );
        gameState.items.push(item);
        gameState.entities.push(item);
      });
      
      // Create containers
      config.containers.forEach((containerConfig, index) => {
        const container = new entitiesModule.Container(
          `container_${index}`,
          containerConfig.type,
          containerConfig.gridX,
          containerConfig.gridY,
          p
        );
        gameState.containers.push(container);
        gameState.entities.push(container);
      });
      
      // Reset selector position
      if (gameState.player) {
        gameState.player.snapToGrid(0, 0);
        gameState.selectorX = 0;
        gameState.selectorY = 0;
      }
    });
  });
}

export { startGame, pauseGame, unpauseGame, restartGame, gameWin, loadLevel };