// input_handler.js - Input handling for human and automated control

import { gameState, GAME_PHASES, AREAS } from './globals.js';
import { initializeGame, collectAcorn, navigateArea, checkWinCondition } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode, shopSystem, fishingSystem, gardenSystem, campfireSystem) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame();
      p.logs.game_info.push({
        data: { phase: "PLAYING", action: "Game Started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING", action: "Resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START", action: "Restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls (only during PLAYING)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Area navigation
  if (keyCode === 37) { // LEFT ARROW
    navigateArea('left');
  } else if (keyCode === 39) { // RIGHT ARROW
    navigateArea('right');
  }
  
  // Area-specific actions
  if (keyCode === 32) { // SPACE
    handleSpaceAction(shopSystem, fishingSystem, gardenSystem, campfireSystem);
  } else if (keyCode === 90) { // Z
    handleZAction(shopSystem, fishingSystem, gardenSystem, campfireSystem);
  } else if (keyCode === 16) { // SHIFT
    gameState.autoCollectEnabled = !gameState.autoCollectEnabled;
  }
  
  // UP/DOWN for navigation in certain areas
  if (keyCode === 38) { // UP
    if (gameState.currentArea === AREAS.SHOP) {
      shopSystem.navigateUp();
    } else if (gameState.currentArea === AREAS.CAMPFIRE) {
      campfireSystem.navigateUp();
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.currentArea === AREAS.SHOP) {
      shopSystem.navigateDown();
    } else if (gameState.currentArea === AREAS.CAMPFIRE) {
      campfireSystem.navigateDown();
    }
  }
  
  // Check win condition after any action
  checkWinCondition();
}

function handleSpaceAction(shopSystem, fishingSystem, gardenSystem, campfireSystem) {
  switch(gameState.currentArea) {
    case AREAS.SHOP:
      collectAcorn();
      break;
    case AREAS.POND:
      fishingSystem.startCast();
      break;
    case AREAS.GARDEN:
      gardenSystem.plantSeed();
      break;
    case AREAS.CAMPFIRE:
      // Space can be used for quick cooking if needed
      break;
  }
}

function handleZAction(shopSystem, fishingSystem, gardenSystem, campfireSystem) {
  switch(gameState.currentArea) {
    case AREAS.SHOP:
      const item = shopSystem.SHOP_ITEMS[shopSystem.selectedIndex];
      if (item) {
        shopSystem.purchase(item.id);
      }
      break;
    case AREAS.POND:
      fishingSystem.attemptCatch();
      break;
    case AREAS.GARDEN:
      gardenSystem.harvestCrop();
      break;
    case AREAS.CAMPFIRE:
      if (campfireSystem.visitorPresent) {
        campfireSystem.tradeWithVisitor();
      } else {
        campfireSystem.craftRecipe();
      }
      break;
  }
}

export function processAutomatedInput(p, action, shopSystem, fishingSystem, gardenSystem, campfireSystem) {
  if (!action) return;
  
  // Simulate key press with the automated action
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode, shopSystem, fishingSystem, gardenSystem, campfireSystem);
  }
}