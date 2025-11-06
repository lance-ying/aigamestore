// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Priority 1: Move to nearest incomplete bridge if we have blocks
  const incompleteBridges = gameState.bridges.filter(b => !b.isComplete);
  if (incompleteBridges.length > 0 && player.blocks > 0) {
    let nearestBridge = incompleteBridges[0];
    let minDist = Math.sqrt(
      (nearestBridge.x - player.x) ** 2 +
      (nearestBridge.y - player.y) ** 2
    );
    
    for (let bridge of incompleteBridges) {
      const dist = Math.sqrt(
        (bridge.x - player.x) ** 2 +
        (bridge.y - player.y) ** 2
      );
      if (dist < minDist) {
        minDist = dist;
        nearestBridge = bridge;
      }
    }
    
    return getMoveTowardsAction(player, nearestBridge.x, nearestBridge.y);
  }
  
  // Priority 2: Collect blocks if we need them
  if (incompleteBridges.length > 0 && player.blocks < 5) {
    const availableBlocks = gameState.blocks.filter(b => 
      !b.collected && 
      b.color.r === player.color.r && 
      b.color.g === player.color.g && 
      b.color.b === player.color.b
    );
    
    if (availableBlocks.length > 0) {
      let nearestBlock = availableBlocks[0];
      let minDist = Math.sqrt(
        (nearestBlock.x - player.x) ** 2 +
        (nearestBlock.y - player.y) ** 2
      );
      
      for (let block of availableBlocks) {
        const dist = Math.sqrt(
          (block.x - player.x) ** 2 +
          (block.y - player.y) ** 2
        );
        if (dist < minDist) {
          minDist = dist;
          nearestBlock = block;
        }
      }
      
      return getMoveTowardsAction(player, nearestBlock.x, nearestBlock.y);
    }
  }
  
  // Priority 3: Head to finish line
  const finish = gameState.platforms.find(p => p.isFinish);
  if (finish && incompleteBridges.length === 0) {
    return getMoveTowardsAction(player, finish.x, finish.y);
  }
  
  // Default: Move right
  return { keyCode: 39 };
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const frameCount = window.gameInstance ? window.gameInstance.frameCount : 0;
  
  // Simple pattern: collect nearby blocks
  const availableBlocks = gameState.blocks.filter(b => 
    !b.collected && 
    b.color.r === player.color.r && 
    b.color.g === player.color.g && 
    b.color.b === player.color.b
  );
  
  if (availableBlocks.length > 0) {
    const nearestBlock = availableBlocks[0];
    return getMoveTowardsAction(player, nearestBlock.x, nearestBlock.y);
  }
  
  // Move in a pattern
  const direction = Math.floor((frameCount / 60) % 4);
  const keys = [38, 39, 40, 37]; // UP, RIGHT, DOWN, LEFT
  return { keyCode: keys[direction] };
}

function getMoveTowardsAction(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  
  // Choose primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // RIGHT or LEFT
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // DOWN or UP
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getBasicTestAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;