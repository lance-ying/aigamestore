// testing.js - Automated testing modes

import { gameState } from './globals.js';
import { fireProjectile, swapBubbles } from './input.js';

export function generateTestActions(mode) {
  const actions = [];

  if (mode === 'TEST_1') {
    // Basic testing: Fire some shots with varying angles
    for (let i = 0; i < 20; i++) {
      actions.push({ type: 'aim', direction: i % 2 === 0 ? 'left' : 'right', frames: 5 });
      actions.push({ type: 'fire', frames: 30 });
    }
  } else if (mode === 'TEST_2') {
    // Win test: Rapid fire with optimal angles
    for (let i = 0; i < 100; i++) {
      actions.push({ type: 'aim', direction: i % 3 === 0 ? 'left' : i % 3 === 1 ? 'right' : 'none', frames: 3 });
      actions.push({ type: 'fire', frames: 20 });
      if (i % 10 === 0) {
        actions.push({ type: 'swap', frames: 1 });
      }
    }
  }

  return actions;
}

export function executeTestAction(p) {
  if (gameState.controlMode === 'HUMAN') return;
  if (gameState.gamePhase !== 'PLAYING') return;

  if (gameState.testActions.length === 0) {
    gameState.testActions = generateTestActions(gameState.controlMode);
    gameState.testActionIndex = 0;
  }

  const currentAction = gameState.testActions[gameState.testActionIndex];
  if (!currentAction) {
    gameState.testActionIndex = 0;
    return;
  }

  if (!currentAction.frameCounter) {
    currentAction.frameCounter = 0;
  }

  currentAction.frameCounter++;

  // Execute action
  if (currentAction.type === 'aim' && gameState.player) {
    if (currentAction.direction === 'left') {
      gameState.player.rotateLeft();
    } else if (currentAction.direction === 'right') {
      gameState.player.rotateRight();
    }
  } else if (currentAction.type === 'fire' && currentAction.frameCounter === 1) {
    fireProjectile(p);
  } else if (currentAction.type === 'swap' && currentAction.frameCounter === 1) {
    swapBubbles();
  }

  // Move to next action
  if (currentAction.frameCounter >= currentAction.frames) {
    gameState.testActionIndex++;
    if (gameState.testActionIndex >= gameState.testActions.length) {
      gameState.testActionIndex = 0;
    }
  }
}