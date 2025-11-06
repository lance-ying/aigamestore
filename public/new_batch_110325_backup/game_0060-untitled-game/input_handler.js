// input_handler.js
import { gameState, GAME_PHASES } from './globals.js';
import { initGame, placeFacility, removeFacility, purchaseShopItem } from './game_logic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initGame(p);
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
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
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 16) { // SHIFT
    gameState.shopMode = !gameState.shopMode;
    return;
  }
  
  if (gameState.shopMode) {
    handleShopInput(keyCode, p);
  } else {
    handleBuildInput(keyCode, p);
  }
}

function handleBuildInput(keyCode, p) {
  // Arrow keys for facility selection
  if (keyCode === 38) { // UP
    const currentIndex = gameState.unlockedFacilities.indexOf(gameState.selectedFacilityType);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : gameState.unlockedFacilities.length - 1;
    gameState.selectedFacilityType = gameState.unlockedFacilities[newIndex];
  } else if (keyCode === 40) { // DOWN
    const currentIndex = gameState.unlockedFacilities.indexOf(gameState.selectedFacilityType);
    const newIndex = (currentIndex + 1) % gameState.unlockedFacilities.length;
    gameState.selectedFacilityType = gameState.unlockedFacilities[newIndex];
  }
  
  // Space to place facility
  if (keyCode === 32) { // SPACE
    if (gameState.selectedFacilityType) {
      const mouseGridX = Math.floor((p.mouseX + gameState.cameraX) / gameState.gridSize);
      const mouseGridY = Math.floor((p.mouseY + gameState.cameraY) / gameState.gridSize);
      placeFacility(mouseGridX, mouseGridY, gameState.selectedFacilityType, p);
    }
  }
  
  // Z to remove facility
  if (keyCode === 90) { // Z
    const mouseGridX = Math.floor((p.mouseX + gameState.cameraX) / gameState.gridSize);
    const mouseGridY = Math.floor((p.mouseY + gameState.cameraY) / gameState.gridSize);
    removeFacility(mouseGridX, mouseGridY);
  }
}

function handleShopInput(keyCode, p) {
  // Arrow keys to purchase items
  if (keyCode === 38 || keyCode === 40) { // UP or DOWN
    const itemIndex = keyCode === 38 ? 0 : 1;
    if (itemIndex < SHOP_ITEMS.length) {
      purchaseShopItem(SHOP_ITEMS[itemIndex].id, p);
    }
  }
}

export function handleAutomatedInput(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  const action = window.get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    simulateKeyPress(action.keyCode, p);
  }
}

function simulateKeyPress(keyCode, p) {
  p.keyCode = keyCode;
  p.key = String.fromCharCode(keyCode);
  handleKeyPressed(p);
}