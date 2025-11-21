// automation.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function getAutomatedAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getTest1Action(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getTest2Action(p);
  }
  return null;
}

// Basic testing - random movements
function getTest1Action(p) {
  if (p.frameCount % 20 === 0) {
    const actions = [37, 38, 39, 40, 32]; // Arrow keys and space
    return actions[Math.floor(p.random(actions.length))];
  }
  return null;
}

// Win test - intelligent sorting
let test2State = {
  phase: 'INIT',
  targetItemIndex: 0,
  targetContainerIndex: 0,
  hasPickedUp: false,
  waitFrames: 0
};

function getTest2Action(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    test2State = {
      phase: 'INIT',
      targetItemIndex: 0,
      targetContainerIndex: 0,
      hasPickedUp: false,
      waitFrames: 0
    };
    return null;
  }
  
  test2State.waitFrames--;
  if (test2State.waitFrames > 0) return null;
  
  const selector = gameState.player;
  const unsortedItems = gameState.items.filter(item => !item.isSorted);
  
  if (unsortedItems.length === 0) {
    return null; // All done
  }
  
  if (!gameState.isHoldingItem) {
    // Find nearest unsorted item
    const targetItem = unsortedItems[test2State.targetItemIndex % unsortedItems.length];
    
    if (selector.gridX < targetItem.gridX) {
      return 39; // RIGHT
    } else if (selector.gridX > targetItem.gridX) {
      return 37; // LEFT
    } else if (selector.gridY < targetItem.gridY) {
      return 40; // DOWN
    } else if (selector.gridY > targetItem.gridY) {
      return 38; // UP
    } else {
      // At item position, pick it up
      test2State.waitFrames = 5;
      test2State.hasPickedUp = true;
      return 32; // SPACE
    }
  } else {
    // Holding item, navigate to correct container
    const heldItem = gameState.items.find(i => i.id === gameState.heldItemId);
    if (!heldItem) return null;
    
    const targetContainer = gameState.containers.find(c => c.acceptedType === heldItem.type);
    if (!targetContainer) return null;
    
    if (selector.gridX < targetContainer.gridX) {
      return 39; // RIGHT
    } else if (selector.gridX > targetContainer.gridX) {
      return 37; // LEFT
    } else if (selector.gridY < targetContainer.gridY) {
      return 40; // DOWN
    } else if (selector.gridY > targetContainer.gridY) {
      return 38; // UP
    } else {
      // At container, drop item
      test2State.targetItemIndex++;
      test2State.hasPickedUp = false;
      test2State.waitFrames = 5;
      return 32; // SPACE
    }
  }
  
  return null;
}