// input.js - Input handling

import { gameState, GAME_PHASES, SHOP_TYPES } from './globals.js';
import { placeShop, canPlaceShop, removeShop } from './shop.js';
import { addFloor, canAddFloor } from './building.js';

const KEY_CODES = {
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  R: 82,
  Z: 90
};

let menuSelectionIndex = 0;

export function handleKeyPressed(p, keyCode) {
  // Log the input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === KEY_CODES.ENTER && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'game_started' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_CODES.ESC && 
      (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED)) {
    gameState.gamePhase = (gameState.gamePhase === GAME_PHASES.PLAYING) ? 
                          GAME_PHASES.PAUSED : GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'pause_toggle' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_CODES.R && 
      (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
       gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
    resetGame();
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: 'game_reset' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Shop menu toggle
  if (keyCode === KEY_CODES.SHIFT) {
    gameState.shopMenuOpen = !gameState.shopMenuOpen;
    if (gameState.shopMenuOpen) {
      menuSelectionIndex = 0;
    }
    return;
  }
  
  // Shop menu navigation
  if (gameState.shopMenuOpen) {
    handleMenuInput(keyCode);
    return;
  }
  
  // Floor navigation
  if (keyCode === KEY_CODES.UP) {
    gameState.currentFloorIndex = Math.min(gameState.floors.length - 1, gameState.currentFloorIndex + 1);
  }
  
  if (keyCode === KEY_CODES.DOWN) {
    gameState.currentFloorIndex = Math.max(0, gameState.currentFloorIndex - 1);
  }
  
  // Place shop
  if (keyCode === KEY_CODES.SPACE && gameState.selectedShopType) {
    if (canPlaceShop(gameState.currentFloorIndex, gameState.selectedShopType)) {
      const shop = placeShop(gameState.currentFloorIndex, gameState.selectedShopType);
      if (shop) {
        gameState.selectedShopType = null;
      }
    }
  }
  
  // Remove shop
  if (keyCode === KEY_CODES.Z && gameState.hoveredShop) {
    removeShop(gameState.hoveredShop);
    gameState.hoveredShop = null;
  }
}

function handleMenuInput(keyCode) {
  const shopKeys = Object.keys(SHOP_TYPES);
  const totalItems = shopKeys.length + 1; // +1 for add floor option
  
  if (keyCode === KEY_CODES.UP) {
    menuSelectionIndex = Math.max(0, menuSelectionIndex - 1);
  }
  
  if (keyCode === KEY_CODES.DOWN) {
    menuSelectionIndex = Math.min(totalItems - 1, menuSelectionIndex + 1);
  }
  
  if (keyCode === KEY_CODES.SPACE) {
    if (menuSelectionIndex < shopKeys.length) {
      // Select shop
      const selectedKey = shopKeys[menuSelectionIndex];
      gameState.selectedShopType = selectedKey;
      gameState.shopMenuOpen = false;
    } else {
      // Add floor
      if (canAddFloor()) {
        addFloor();
        gameState.shopMenuOpen = false;
      }
    }
  }
}

function resetGame() {
  const { initializeGameState } = require('./globals.js');
  initializeGameState();
}

export function getMenuSelectionIndex() {
  return menuSelectionIndex;
}