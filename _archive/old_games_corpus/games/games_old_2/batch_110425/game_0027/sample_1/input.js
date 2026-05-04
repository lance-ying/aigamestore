// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, BUILDING_TYPES, GIFT_ITEMS, GRID_COLS, GRID_ROWS, CONTROL_MODE_HUMAN } from './globals.js';
import { placeBuilding, deleteBuilding, getBuildingAt } from './building.js';
import { resetGame } from './game.js';
import get_automated_testing_action from './automated_testing_controller.js';

let p5Instance = null;

export function initInput(p) {
  p5Instance = p;
}

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
    }
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  handleGameplayInput(keyCode);
}

export function handleGameplayInput(keyCode) {
  // Mode switching
  if (keyCode === 16) { // SHIFT
    const modes = ['BUILD', 'GIFT', 'DELETE'];
    const currentIndex = modes.indexOf(gameState.buildMode);
    gameState.buildMode = modes[(currentIndex + 1) % modes.length];
    return;
  }
  
  // Arrow keys for navigation
  if (keyCode === 37) { // LEFT
    if (gameState.buildMode === 'BUILD' || gameState.buildMode === 'DELETE' || gameState.buildMode === 'GIFT') {
      gameState.cursorGridX = Math.max(0, gameState.cursorGridX - 1);
    } else {
      navigateMenu(-1);
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.buildMode === 'BUILD' || gameState.buildMode === 'DELETE' || gameState.buildMode === 'GIFT') {
      gameState.cursorGridX = Math.min(GRID_COLS - 1, gameState.cursorGridX + 1);
    } else {
      navigateMenu(1);
    }
  } else if (keyCode === 38) { // UP
    if (gameState.buildMode === 'BUILD' || gameState.buildMode === 'DELETE' || gameState.buildMode === 'GIFT') {
      gameState.cursorGridY = Math.max(0, gameState.cursorGridY - 1);
    } else {
      navigateMenu(-1);
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.buildMode === 'BUILD' || gameState.buildMode === 'DELETE' || gameState.buildMode === 'GIFT') {
      gameState.cursorGridY = Math.min(GRID_ROWS - 1, gameState.cursorGridY + 1);
    } else {
      navigateMenu(1);
    }
  }
  
  // Space for confirmation
  if (keyCode === 32) { // SPACE
    if (gameState.buildMode === 'BUILD' && gameState.selectedBuildingType) {
      const buildingData = BUILDING_TYPES[gameState.selectedBuildingType];
      placeBuilding(gameState.selectedBuildingType, buildingData, gameState.cursorGridX, gameState.cursorGridY);
    } else if (gameState.buildMode === 'GIFT' && gameState.selectedGiftType) {
      giftToNearbyGuest();
    }
  }
  
  // Z for cancel/delete
  if (keyCode === 90) { // Z
    if (gameState.buildMode === 'BUILD') {
      gameState.selectedBuildingType = null;
    } else if (gameState.buildMode === 'DELETE') {
      deleteBuilding(gameState.cursorGridX, gameState.cursorGridY);
    }
  }
}

function navigateMenu(direction) {
  if (gameState.buildMode === 'BUILD') {
    const buildingKeys = Object.keys(BUILDING_TYPES).filter(key => {
      const building = BUILDING_TYPES[key];
      return !building.unlockFollowers || gameState.snsFollowers >= building.unlockFollowers;
    });
    
    if (buildingKeys.length === 0) return;
    
    const currentIndex = buildingKeys.indexOf(gameState.selectedBuildingType);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = buildingKeys.length - 1;
    if (newIndex >= buildingKeys.length) newIndex = 0;
    
    gameState.selectedBuildingType = buildingKeys[newIndex];
  } else if (gameState.buildMode === 'GIFT') {
    const giftKeys = Object.keys(GIFT_ITEMS);
    const currentIndex = giftKeys.indexOf(gameState.selectedGiftType);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = giftKeys.length - 1;
    if (newIndex >= giftKeys.length) newIndex = 0;
    
    gameState.selectedGiftType = giftKeys[newIndex];
  }
}

function giftToNearbyGuest() {
  if (!gameState.selectedGiftType) return;
  
  const giftData = GIFT_ITEMS[gameState.selectedGiftType];
  if (gameState.money < giftData.cost) return;
  
  // Find guest near cursor
  const cursorScreenX = 200 + gameState.cursorGridX * 20 + 10;
  const cursorScreenY = 50 + gameState.cursorGridY * 20 + 10;
  
  for (const guest of gameState.guests) {
    const dx = guest.screenX - cursorScreenX;
    const dy = guest.screenY - cursorScreenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30) {
      if (guest.giveGift(giftData)) {
        gameState.money -= giftData.cost;
        return;
      }
    }
  }
}

export function processAutomatedTestingInput(p) {
  if (gameState.controlMode === CONTROL_MODE_HUMAN || gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }
  
  const action = get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    handleGameplayInput(action.keyCode);
  }
}