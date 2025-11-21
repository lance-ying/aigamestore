import { gameState, TOOLS } from './globals.js';

export function setupInputHandling(p) {
  p.keyPressed = function() {
    // Log the key input
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Start game with ENTER
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        "game_status": gameState.gamePhase,
        "data": {},
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
    
    // Pause/unpause with ESC
    if (p.keyCode === 27 && gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        "game_status": gameState.gamePhase,
        "data": {},
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    } else if (p.keyCode === 27 && gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        "game_status": gameState.gamePhase,
        "data": {},
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
    
    // Restart with R
    if (p.keyCode === 82 && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
      resetGame();
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        "game_status": gameState.gamePhase,
        "data": {},
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
    
    // Switch tools with SPACE
    if (p.keyCode === 32 && gameState.gamePhase === "PLAYING") {
      gameState.currentTool = (gameState.currentTool + 1) % gameState.tools.length;
    }
    
    // Manual sleep with S key when near bed
    if (p.keyCode === 83 && gameState.gamePhase === "PLAYING" && isPlayerNearBed()) {
      sleepAndAdvanceDay(p);
    }
  };
  
  p.keyReleased = function() {
    // Log the key release
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
}

export function handlePlayerInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Handle exhaustion and auto-sleep
  if (gameState.isExhausted) {
    gameState.autoSleepTimer--;
    if (gameState.autoSleepTimer <= 0) {
      // Force player to bed if nearby, or restore some energy
      if (isPlayerNearBed()) {
        sleepAndAdvanceDay(p);
      } else {
        // Give a small energy boost to get to bed
        gameState.energy = Math.min(10, gameState.maxEnergy);
        gameState.isExhausted = false;
      }
    }
    return;
  }
  
  let keyCode = null;
  
  // Use automated testing if in test mode
  if (gameState.controlMode !== "HUMAN" && typeof window.game_testing_controller === 'function') {
    keyCode = window.game_testing_controller(gameState);
  }
  
  // Move player with arrow keys
  if (p.keyIsDown(37) || keyCode === 37) { // LEFT
    gameState.player.move(-1, 0);
    logPlayerPosition(p);
  }
  if (p.keyIsDown(39) || keyCode === 39) { // RIGHT
    gameState.player.move(1, 0);
    logPlayerPosition(p);
  }
  if (p.keyIsDown(38) || keyCode === 38) { // UP
    gameState.player.move(0, -1);
    logPlayerPosition(p);
  }
  if (p.keyIsDown(40) || keyCode === 40) { // DOWN
    gameState.player.move(0, 1);
    logPlayerPosition(p);
  }
  
  // Interact with Z key
  if ((p.keyIsDown(90) || keyCode === 90) && !gameState.lastInteractedTile) { // Z key
    interact(p);
    gameState.lastInteractedTile = true;
  } else if (!p.keyIsDown(90) && keyCode !== 90) {
    gameState.lastInteractedTile = false;
  }
}

function interact(p) {
  const playerTile = gameState.player.getCurrentTile();
  
  // Check if player is near bed
  if (isPlayerNearBed()) {
    sleepAndAdvanceDay(p);
    return;
  }
  
  // Find the tile player is standing on
  const tile = gameState.tiles.find(t => t.x === playerTile.x && t.y === playerTile.y);
  if (!tile) return;
  
  let actionPerformed = false;
  
  // Perform action based on current tool
  switch (gameState.currentTool) {
    case TOOLS.HOE:
      actionPerformed = tile.till();
      break;
    case TOOLS.SEEDS:
      actionPerformed = tile.plant();
      break;
    case TOOLS.WATERING_CAN:
      actionPerformed = tile.water();
      if (actionPerformed && tile.crop) {
        tile.crop.watered = true;
      }
      break;
  }
  
  // Try to harvest if no other action was performed
  if (!actionPerformed && tile.crop && tile.crop.stage === 3) {
    tile.harvest();
  }
  
  // Check win condition
  if (gameState.gold >= 500) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": { gold: gameState.gold, days: gameState.day },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
}

function isPlayerNearBed() {
  const playerTile = gameState.player.getCurrentTile();
  const bed = gameState.bed;
  
  return (playerTile.x === bed.x || playerTile.x === bed.x + 1) && playerTile.y === bed.y;
}

function sleepAndAdvanceDay(p) {
  // Advance day
  gameState.day++;
  
  // Grow crops
  for (const crop of gameState.crops) {
    crop.grow();
  }
  
  // Reset energy and exhaustion
  gameState.energy = gameState.maxEnergy;
  gameState.isExhausted = false;
  gameState.autoSleepTimer = 0;
  
  // Reset watered tiles to tilled
  for (const tile of gameState.tiles) {
    if (tile.type === 3) { // WATERED
      tile.type = 1; // TILLED
    }
  }
  
  // Log the day change
  p.logs.game_info.push({
    "game_status": "DAY_CHANGED",
    "data": { day: gameState.day },
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

function resetGame() {
  gameState.gold = 100;
  gameState.day = 1;
  gameState.energy = gameState.maxEnergy;
  gameState.currentTool = 0;
  gameState.crops = [];
  gameState.isExhausted = false;
  gameState.autoSleepTimer = 0;
  gameState.hoveredTile = null;
  
  // Reset tiles
  for (const tile of gameState.tiles) {
    tile.type = 0; // GRASS
    tile.crop = null;
  }
}

function logPlayerPosition(p) {
  p.logs.player_info.push({
    "screen_x": gameState.player.x,
    "screen_y": gameState.player.y,
    "game_x": gameState.player.x,
    "game_y": gameState.player.y,
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}