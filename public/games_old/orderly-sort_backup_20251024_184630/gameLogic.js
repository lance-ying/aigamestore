// gameLogic.js - Core game logic and actions

import { gameState, POINTS_CORRECT, POINTS_INCORRECT, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { checkLevelComplete } from './levelManager.js';

export function handlePickupOrDrop(p) {
  if (gameState.isHoldingItem) {
    // Try to drop
    handleDrop(p);
  } else {
    // Try to pickup
    handlePickup(p);
  }
}

function handlePickup(p) {
  const selector = gameState.player;
  const target = selector.getCurrentTarget();
  
  if (!target || target.type !== 'item') return;
  
  const item = target.ref;
  if (item.isSorted) return; // Can't pick up sorted items
  
  gameState.isHoldingItem = true;
  gameState.heldItemId = item.id;
  item.originalX = item.currentX;
  item.originalY = item.currentY;
  
  // Log pickup
  p.logs.player_info.push({
    action: 'pickup',
    itemId: item.id,
    itemType: item.type,
    screen_x: item.currentX,
    screen_y: item.currentY,
    game_x: item.currentX,
    game_y: item.currentY,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleDrop(p) {
  const heldItem = gameState.items.find(item => item.id === gameState.heldItemId);
  if (!heldItem) {
    gameState.isHoldingItem = false;
    gameState.heldItemId = null;
    return;
  }
  
  const selector = gameState.player;
  const target = selector.getCurrentTarget();
  
  // Check if dropping on a container
  if (target && target.type === 'container') {
    const container = target.ref;
    
    if (container.canAcceptItem(heldItem)) {
      // Correct drop
      container.addItem(heldItem.id);
      heldItem.markAsSorted(container.id);
      heldItem.setPosition(container.x + container.width / 2, container.y + container.height / 2);
      
      gameState.score += POINTS_CORRECT;
      
      // Log successful drop
      p.logs.player_info.push({
        action: 'drop_success',
        itemId: heldItem.id,
        containerId: container.id,
        points: POINTS_CORRECT,
        screen_x: heldItem.currentX,
        screen_y: heldItem.currentY,
        game_x: heldItem.currentX,
        game_y: heldItem.currentY,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      gameState.isHoldingItem = false;
      gameState.heldItemId = null;
      
      // Update selector positions
      selector.updateGridPositions();
      
      // Check win condition
      if (checkLevelComplete()) {
        handleLevelComplete(p);
      }
    } else {
      // Incorrect drop
      heldItem.resetToOriginal();
      gameState.score = Math.max(0, gameState.score + POINTS_INCORRECT);
      
      // Log failed drop
      p.logs.player_info.push({
        action: 'drop_fail',
        itemId: heldItem.id,
        containerId: container.id,
        points: POINTS_INCORRECT,
        reason: container.isFull() ? 'container_full' : 'type_mismatch',
        screen_x: heldItem.currentX,
        screen_y: heldItem.currentY,
        game_x: heldItem.currentX,
        game_y: heldItem.currentY,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      gameState.isHoldingItem = false;
      gameState.heldItemId = null;
    }
  } else {
    // Drop anywhere else - return to original position
    heldItem.resetToOriginal();
    gameState.isHoldingItem = false;
    gameState.heldItemId = null;
    
    p.logs.player_info.push({
      action: 'drop_cancel',
      itemId: heldItem.id,
      screen_x: heldItem.currentX,
      screen_y: heldItem.currentY,
      game_x: heldItem.currentX,
      game_y: heldItem.currentY,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleLevelComplete(p) {
  const nextLevel = gameState.currentLevel + 1;
  
  if (nextLevel <= 5) {
    // Bonus points for time remaining
    const timeBonus = Math.floor(gameState.timeRemaining * 10);
    gameState.score += timeBonus;
    
    p.logs.game_info.push({
      event: 'level_complete',
      level: gameState.currentLevel,
      timeBonus: timeBonus,
      score: gameState.score,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Advance to next level
    gameState.currentLevel = nextLevel;
    const { initializeLevel } = require('./levelManager.js');
    initializeLevel(p, nextLevel);
    gameState.player.updateGridPositions();
  } else {
    // Game won!
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('orderlySort_highScore', gameState.highScore.toString());
      }
    }
    
    p.logs.game_info.push({
      event: 'game_complete',
      finalScore: gameState.score,
      highScore: gameState.highScore,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGameLogic(p, deltaTime) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update timer
  gameState.timeRemaining -= deltaTime;
  
  if (gameState.timeRemaining <= 0) {
    gameState.timeRemaining = 0;
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      event: 'time_out',
      finalScore: gameState.score,
      level: gameState.currentLevel,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update held item position
  if (gameState.isHoldingItem && gameState.heldItemId) {
    const heldItem = gameState.items.find(item => item.id === gameState.heldItemId);
    if (heldItem) {
      const pos = gameState.player.getCurrentPosition();
      heldItem.currentX = pos.x;
      heldItem.currentY = pos.y - 40; // Float above selector
    }
  }
  
  // Update highlights
  const currentTarget = gameState.player.getCurrentTarget();
  
  for (const item of gameState.items) {
    item.isHighlighted = (currentTarget && currentTarget.type === 'item' && currentTarget.ref === item);
  }
  
  for (const container of gameState.containers) {
    container.isHighlighted = (currentTarget && currentTarget.type === 'container' && currentTarget.ref === container);
  }
}