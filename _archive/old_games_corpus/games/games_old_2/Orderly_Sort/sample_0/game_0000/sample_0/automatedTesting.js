// automatedTesting.js - Automated testing controllers

import { gameState, CONTROL_MODE_TEST_1, CONTROL_MODE_TEST_2, PHASE_PLAYING } from './globals.js';
import { handlePickupOrDrop } from './gameLogic.js';

let testState = {
  phase: 'idle',
  targetItemIndex: 0,
  moveCounter: 0,
  actionTimer: 0
};

export function updateAutomatedTesting(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.controlMode === CONTROL_MODE_TEST_1) {
    runBasicTest(p);
  } else if (gameState.controlMode === CONTROL_MODE_TEST_2) {
    runWinTest(p);
  }
}

function runBasicTest(p) {
  testState.actionTimer++;
  
  if (testState.actionTimer < 30) return; // Wait between actions
  testState.actionTimer = 0;
  
  const selector = gameState.player;
  
  // Simple behavior: move around and occasionally try to interact
  const action = Math.floor(p.random(6));
  
  switch (action) {
    case 0:
      selector.moveLeft();
      break;
    case 1:
      selector.moveRight();
      break;
    case 2:
      selector.moveUp();
      break;
    case 3:
      selector.moveDown();
      break;
    case 4:
      handlePickupOrDrop(p);
      break;
    case 5:
      // Do nothing
      break;
  }
}

function runWinTest(p) {
  testState.actionTimer++;
  
  if (testState.actionTimer < 15) return;
  testState.actionTimer = 0;
  
  const selector = gameState.player;
  
  // Smart behavior: pick up items and place them in correct containers
  if (!gameState.isHoldingItem) {
    // Find an unsorted item
    const unsortedItems = gameState.items.filter(item => !item.isSorted);
    if (unsortedItems.length === 0) return;
    
    // Navigate to first unsorted item
    const targetItem = unsortedItems[0];
    const currentPos = selector.getCurrentPosition();
    
    // Check if we're already on the item
    const currentTarget = selector.getCurrentTarget();
    if (currentTarget && currentTarget.type === 'item' && currentTarget.ref === targetItem) {
      handlePickupOrDrop(p);
    } else {
      // Move towards item
      if (Math.abs(currentPos.x - targetItem.currentX) > Math.abs(currentPos.y - targetItem.currentY)) {
        if (currentPos.x < targetItem.currentX) {
          selector.moveRight();
        } else {
          selector.moveLeft();
        }
      } else {
        if (currentPos.y < targetItem.currentY) {
          selector.moveDown();
        } else {
          selector.moveUp();
        }
      }
    }
  } else {
    // Holding an item, find correct container
    const heldItem = gameState.items.find(item => item.id === gameState.heldItemId);
    if (!heldItem) return;
    
    const correctContainer = gameState.containers.find(c => c.acceptedType === heldItem.type && !c.isFull());
    if (!correctContainer) return;
    
    const currentTarget = selector.getCurrentTarget();
    if (currentTarget && currentTarget.type === 'container' && currentTarget.ref === correctContainer) {
      handlePickupOrDrop(p);
    } else {
      // Move towards container
      const currentPos = selector.getCurrentPosition();
      const containerX = correctContainer.x + correctContainer.width / 2;
      const containerY = correctContainer.y + correctContainer.height / 2;
      
      if (Math.abs(currentPos.x - containerX) > Math.abs(currentPos.y - containerY)) {
        if (currentPos.x < containerX) {
          selector.moveRight();
        } else {
          selector.moveLeft();
        }
      } else {
        if (currentPos.y < containerY) {
          selector.moveDown();
        } else {
          selector.moveUp();
        }
      }
    }
  }
}

export function resetTestState() {
  testState = {
    phase: 'idle',
    targetItemIndex: 0,
    moveCounter: 0,
    actionTimer: 0
  };
}