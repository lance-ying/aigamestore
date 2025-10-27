// input.js - Input handling for human and automated testing

import { gameState } from './globals.js';
import { drawCard, placeCard, undoMove, selectNextStack, selectPrevStack } from './gameActions.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      gameState.gamePhase = "START";
      gameState.score = 0;
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (keyCode === 32) { // SPACE
    if (gameState.drawPhase) {
      drawCard(p);
    } else {
      placeCard(p);
    }
  } else if (keyCode === 90) { // Z
    undoMove(p);
  } else if (keyCode === 37) { // LEFT
    selectPrevStack();
  } else if (keyCode === 39) { // RIGHT
    selectNextStack();
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  gameState.testFrameCounter++;
  
  // Execute test actions at specific intervals
  if (gameState.testFrameCounter % 15 === 0) {
    let action = null;
    
    if (gameState.controlMode === "TEST_1") {
      // Basic testing: draw cards and try to place them
      action = getTest1Action();
    } else if (gameState.controlMode === "TEST_2") {
      // Win condition: optimal play
      action = getTest2Action();
    }
    
    if (action) {
      executeAction(p, action);
    }
  }
}

function getTest1Action() {
  if (gameState.drawPhase && gameState.deck.length > 0) {
    return { type: "draw" };
  } else if (!gameState.drawPhase && gameState.currentCard) {
    // Try to place on first available stack
    for (let i = 0; i < gameState.categoryStacks.length; i++) {
      const stack = gameState.categoryStacks[i];
      if (stack.canAcceptCard(gameState.currentCard)) {
        return { type: "selectStack", index: i };
      }
    }
    // If can't place, try to draw next
    return { type: "draw" };
  }
  return null;
}

function getTest2Action() {
  // Optimal play to win
  if (gameState.drawPhase && gameState.deck.length > 0) {
    return { type: "draw" };
  } else if (!gameState.drawPhase && gameState.currentCard) {
    // Find correct stack for current card
    for (let i = 0; i < gameState.categoryStacks.length; i++) {
      const stack = gameState.categoryStacks[i];
      if (stack.canAcceptCard(gameState.currentCard)) {
        gameState.selectedStackIndex = i;
        return { type: "place" };
      }
    }
  }
  return null;
}

function executeAction(p, action) {
  if (action.type === "draw") {
    handleKeyPressed(p, 32); // Simulate SPACE
  } else if (action.type === "place") {
    handleKeyPressed(p, 32); // Simulate SPACE
  } else if (action.type === "selectStack") {
    while (gameState.selectedStackIndex !== action.index) {
      if (action.index > gameState.selectedStackIndex) {
        handleKeyPressed(p, 39); // RIGHT
      } else {
        handleKeyPressed(p, 37); // LEFT
      }
    }
  }
}