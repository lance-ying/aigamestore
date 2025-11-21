import { gameState } from './globals.js';
import { selectCard, drawFromStock, activatePowerUp, updateSelectableElements } from './gameplay.js';

export function getTestingAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  updateSelectableElements(gameState);
  
  if (gameState.controlMode === 'TEST_1') {
    // Basic testing: Try valid moves, draw from stock
    for (let i = 0; i < gameState.tableauCards.length; i++) {
      const card = gameState.tableauCards[i];
      if (card.isFaceUp && !card.isCovered && card.canMatch(gameState.discardPile)) {
        return { action: 'selectCard', index: i };
      }
    }
    
    if (gameState.stockPile.length > 0) {
      return { action: 'drawStock' };
    }
    
    return null;
  }
  
  if (gameState.controlMode === 'TEST_2') {
    // Win: Optimal play with power-up usage
    
    // First, try to make valid moves
    let bestMove = null;
    let bestScore = -1;
    
    for (let i = 0; i < gameState.tableauCards.length; i++) {
      const card = gameState.tableauCards[i];
      if (card.isFaceUp && !card.isCovered && card.canMatch(gameState.discardPile)) {
        // Prefer moves that uncover more cards
        let score = 1;
        if (card.coveringIndices && card.coveringIndices.length > 0) {
          score += card.coveringIndices.length;
        }
        if (score > bestScore) {
          bestScore = score;
          bestMove = { action: 'selectCard', index: i };
        }
      }
    }
    
    if (bestMove) {
      return bestMove;
    }
    
    // If stuck and power-up available, use it
    if (gameState.powerUpsRemaining > 0 && gameState.lastMoves.length > 0 && gameState.movesWithoutTableau > 2) {
      return { action: 'activatePowerUp' };
    }
    
    // Draw from stock
    if (gameState.stockPile.length > 0) {
      return { action: 'drawStock' };
    }
    
    return null;
  }
  
  return null;
}

export function executeTestingAction(action, p) {
  if (!action) return;
  
  if (action.action === 'selectCard') {
    selectCard(action.index, p);
  } else if (action.action === 'drawStock') {
    drawFromStock(p);
  } else if (action.action === 'activatePowerUp') {
    activatePowerUp(p);
  }
}