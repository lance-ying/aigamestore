// gameLogic.js - Core game logic and move validation

import { gameState } from './globals.js';
import { Card } from './card.js';
import { LAYOUT, getTableauPosition, getFoundationPosition } from './layout.js';

export function dealCards(p) {
  // Deal to tableau
  let cardIndex = 0;
  for (let pile = 0; pile < 7; pile++) {
    gameState.tableauPiles[pile] = [];
    for (let card = 0; card <= pile; card++) {
      const dealtCard = gameState.deck[cardIndex++];
      dealtCard.faceUp = (card === pile);
      gameState.tableauPiles[pile].push(dealtCard);
    }
  }
  
  // Remaining cards to stockpile
  gameState.stockpile = gameState.deck.slice(cardIndex);
  gameState.wastePile = [];
  
  updateCardPositions();
}

export function updateCardPositions() {
  // Update tableau positions
  for (let i = 0; i < 7; i++) {
    const pile = gameState.tableauPiles[i];
    for (let j = 0; j < pile.length; j++) {
      const pos = getTableauPosition(i, j);
      pile[j].x = pos.x;
      pile[j].y = pos.y;
    }
  }
  
  // Update foundation positions
  for (let i = 0; i < 4; i++) {
    const pile = gameState.foundationPiles[i];
    const pos = getFoundationPosition(i);
    for (let card of pile) {
      card.x = pos.x;
      card.y = pos.y;
    }
  }
  
  // Update stockpile
  for (let card of gameState.stockpile) {
    card.x = LAYOUT.STOCKPILE_X;
    card.y = LAYOUT.STOCKPILE_Y;
    card.faceUp = false;
  }
  
  // Update waste pile
  for (let i = 0; i < gameState.wastePile.length; i++) {
    gameState.wastePile[i].x = LAYOUT.WASTE_X + i * 2;
    gameState.wastePile[i].y = LAYOUT.WASTE_Y;
    gameState.wastePile[i].faceUp = true;
  }
}

export function drawFromStockpile() {
  if (gameState.stockpile.length > 0) {
    const card = gameState.stockpile.pop();
    card.faceUp = true;
    gameState.wastePile.push(card);
    updateCardPositions();
    saveStateForUndo();
    return true;
  } else if (gameState.wastePile.length > 0 && gameState.numStockpileResets < gameState.maxResets) {
    // Reset waste to stockpile
    gameState.stockpile = gameState.wastePile.reverse();
    gameState.wastePile = [];
    gameState.numStockpileResets++;
    gameState.score = Math.max(0, gameState.score - 50);
    updateCardPositions();
    saveStateForUndo();
    return true;
  }
  return false;
}

export function saveStateForUndo() {
  const state = {
    tableauPiles: gameState.tableauPiles.map(pile => [...pile]),
    foundationPiles: gameState.foundationPiles.map(pile => [...pile]),
    stockpile: [...gameState.stockpile],
    wastePile: [...gameState.wastePile],
    score: gameState.score,
    numStockpileResets: gameState.numStockpileResets
  };
  gameState.undoStack.push(state);
  if (gameState.undoStack.length > 20) {
    gameState.undoStack.shift();
  }
}

export function undoLastMove() {
  if (gameState.undoStack.length > 0) {
    const state = gameState.undoStack.pop();
    gameState.tableauPiles = state.tableauPiles.map(pile => [...pile]);
    gameState.foundationPiles = state.foundationPiles.map(pile => [...pile]);
    gameState.stockpile = [...state.stockpile];
    gameState.wastePile = [...state.wastePile];
    gameState.score = state.score;
    gameState.numStockpileResets = state.numStockpileResets;
    updateCardPositions();
    return true;
  }
  return false;
}

export function autoMoveToFoundation() {
  let moved = false;
  
  // Try waste pile first
  if (gameState.wastePile.length > 0) {
    const card = gameState.wastePile[gameState.wastePile.length - 1];
    for (let i = 0; i < 4; i++) {
      if (card.canPlaceOnFoundation(gameState.foundationPiles[i])) {
        saveStateForUndo();
        gameState.wastePile.pop();
        gameState.foundationPiles[i].push(card);
        gameState.score += 10;
        updateCardPositions();
        moved = true;
        break;
      }
    }
  }
  
  // Try tableau piles
  if (!moved) {
    for (let pile of gameState.tableauPiles) {
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        if (card.faceUp) {
          for (let i = 0; i < 4; i++) {
            if (card.canPlaceOnFoundation(gameState.foundationPiles[i])) {
              saveStateForUndo();
              pile.pop();
              gameState.foundationPiles[i].push(card);
              gameState.score += 10;
              
              // Flip next card if exists
              if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
                pile[pile.length - 1].faceUp = true;
                gameState.score += 5;
              }
              
              updateCardPositions();
              moved = true;
              break;
            }
          }
        }
        if (moved) break;
      }
    }
  }
  
  return moved;
}

export function checkWinCondition() {
  return gameState.foundationPiles.every(pile => pile.length === 13);
}

export function hasValidMoves() {
  // Check if any card can be moved
  // Simplified check - just see if there are any face-up cards
  for (let pile of gameState.tableauPiles) {
    if (pile.some(card => card.faceUp)) return true;
  }
  if (gameState.wastePile.length > 0) return true;
  if (gameState.stockpile.length > 0) return true;
  return false;
}