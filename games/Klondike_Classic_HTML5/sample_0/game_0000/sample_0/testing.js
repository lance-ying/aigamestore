// testing.js - Automated testing system
import { gameState } from './globals.js';
import { drawFromStock, moveCardToFoundation, moveCardsToTableau, checkWinCondition, findHint, undoLastMove } from './gameLogic.js';

let testFrameCounter = 0;
let testState = { phase: 'init', counter: 0 };

export function runAutomatedTest() {
  if (gameState.controlMode === 'HUMAN') return;
  
  testFrameCounter++;
  
  if (gameState.controlMode === 'TEST_1') {
    runBasicTest();
  } else if (gameState.controlMode === 'TEST_2') {
    runWinTest();
  }
}

function runBasicTest() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Draw from stock every 30 frames
  if (testFrameCounter % 30 === 0 && gameState.stockPile.length > 0) {
    drawFromStock();
  }
  
  // Try auto-moves every 20 frames
  if (testFrameCounter % 20 === 0) {
    const hint = findHint();
    if (hint) {
      const { card, target, targetIndex } = hint;
      
      // Find source
      let sourceType = null;
      let sourceIndex = -1;
      
      if (gameState.wastePile.includes(card)) {
        sourceType = 'waste';
      } else {
        for (let col = 0; col < 7; col++) {
          if (gameState.tableau[col].includes(card)) {
            sourceType = 'tableau';
            sourceIndex = col;
            break;
          }
        }
      }
      
      if (target === 'foundation') {
        moveCardToFoundation(card, sourceType, sourceIndex);
      } else if (target === 'tableau') {
        moveCardsToTableau([card], sourceType, sourceIndex, targetIndex);
      }
    }
  }
  
  // Use undo occasionally
  if (testFrameCounter % 100 === 0 && gameState.undoStack.length > 0) {
    undoLastMove();
  }
}

function runWinTest() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Aggressively try to win
  if (testFrameCounter % 5 === 0) {
    const hint = findHint();
    if (hint) {
      const { card, target, targetIndex } = hint;
      
      let sourceType = null;
      let sourceIndex = -1;
      
      if (gameState.wastePile.includes(card)) {
        sourceType = 'waste';
      } else {
        for (let col = 0; col < 7; col++) {
          if (gameState.tableau[col].includes(card)) {
            sourceType = 'tableau';
            sourceIndex = col;
            break;
          }
        }
      }
      
      if (target === 'foundation') {
        moveCardToFoundation(card, sourceType, sourceIndex);
      } else if (target === 'tableau') {
        moveCardsToTableau([card], sourceType, sourceIndex, targetIndex);
      }
    } else if (gameState.stockPile.length > 0 || !gameState.wasteRecycled) {
      drawFromStock();
    }
  }
  
  if (checkWinCondition()) {
    gameState.gamePhase = 'GAME_OVER_WIN';
  }
}

export function resetTestState() {
  testFrameCounter = 0;
  testState = { phase: 'init', counter: 0 };
}