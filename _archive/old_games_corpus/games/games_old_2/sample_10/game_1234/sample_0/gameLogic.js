// gameLogic.js - Core game logic and move validation

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Card, createDeck, shuffleDeck } from './card.js';
import { LEVEL_CONFIG } from './levelManager.js';

export function dealCards(p) {
  gameState.deck = createDeck();
  gameState.deck = shuffleDeck(gameState.deck, p);
  
  gameState.tableau = [[], [], [], [], [], [], []];
  gameState.foundations = [[], [], [], []];
  gameState.waste = [];
  gameState.stock = [];
  
  // Deal to tableau
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = gameState.deck.pop();
      card.faceUp = (row === col);
      gameState.tableau[col].push(card);
    }
  }
  
  // Rest to stock
  gameState.stock = gameState.deck;
  gameState.stock.forEach(card => card.faceUp = false);
}

export function drawFromStock() {
  if (gameState.stock.length === 0) {
    // Recycle waste to stock
    if (gameState.waste.length > 0) {
      gameState.stock = gameState.waste.reverse();
      gameState.stock.forEach(card => card.faceUp = false);
      gameState.waste = [];
      return true;
    }
    return false;
  }
  
  const numToDraw = Math.min(gameState.drawMode, gameState.stock.length);
  for (let i = 0; i < numToDraw; i++) {
    const card = gameState.stock.pop();
    card.faceUp = true;
    gameState.waste.push(card);
  }
  
  gameState.moves++;
  return true;
}

export function pickUpCard(pileType, pileIndex, cardIndex) {
  let cards = [];
  let sourcePile = null;
  
  if (pileType === 'tableau') {
    sourcePile = gameState.tableau[pileIndex];
    if (cardIndex < sourcePile.length && sourcePile[cardIndex].faceUp) {
      cards = sourcePile.slice(cardIndex);
      // Validate sequence
      for (let i = 0; i < cards.length - 1; i++) {
        if (!cards[i + 1].canPlaceOnTableau(cards[i])) {
          return false; // Invalid sequence
        }
      }
    }
  } else if (pileType === 'waste' && gameState.waste.length > 0) {
    sourcePile = gameState.waste;
    cards = [gameState.waste[gameState.waste.length - 1]];
    cardIndex = gameState.waste.length - 1;
  }
  
  if (cards.length === 0) return false;
  
  gameState.pickedUpCards = {
    cards: cards,
    sourcePile: { type: pileType, index: pileIndex },
    sourceIndex: cardIndex
  };
  
  return true;
}

export function dropCard(targetType, targetIndex) {
  if (!gameState.pickedUpCards) return false;
  
  const { cards, sourcePile, sourceIndex } = gameState.pickedUpCards;
  const moveValid = validateMove(cards, targetType, targetIndex);
  
  if (!moveValid) {
    gameState.pickedUpCards = null;
    return false;
  }
  
  // Save state for undo
  saveGameState();
  
  // Remove cards from source
  if (sourcePile.type === 'tableau') {
    gameState.tableau[sourcePile.index].splice(sourceIndex);
    // Flip top card if exists
    const tableau = gameState.tableau[sourcePile.index];
    if (tableau.length > 0 && !tableau[tableau.length - 1].faceUp) {
      tableau[tableau.length - 1].faceUp = true;
      updateScore(5); // Flip card bonus
    }
  } else if (sourcePile.type === 'waste') {
    gameState.waste.pop();
  }
  
  // Add cards to target
  if (targetType === 'tableau') {
    gameState.tableau[targetIndex].push(...cards);
    if (sourcePile.type === 'waste') {
      updateScore(5);
    }
  } else if (targetType === 'foundation') {
    gameState.foundations[targetIndex].push(...cards);
    if (sourcePile.type === 'waste') {
      updateScore(10);
    } else if (sourcePile.type === 'tableau') {
      updateScore(10);
    }
  }
  
  gameState.moves++;
  gameState.pickedUpCards = null;
  
  return true;
}

function validateMove(cards, targetType, targetIndex) {
  if (cards.length === 0) return false;
  
  if (targetType === 'tableau') {
    const targetPile = gameState.tableau[targetIndex];
    const topCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
    return cards[0].canPlaceOnTableau(topCard);
  } else if (targetType === 'foundation') {
    if (cards.length > 1) return false; // Can only move one card to foundation
    const targetPile = gameState.foundations[targetIndex];
    return cards[0].canPlaceOnFoundation(targetPile);
  }
  
  return false;
}

export function autoMoveToFoundation(card) {
  if (!card) return false;
  
  for (let i = 0; i < 4; i++) {
    if (card.canPlaceOnFoundation(gameState.foundations[i])) {
      return i;
    }
  }
  return -1;
}

export function canAutoComplete() {
  // Check if all tableau cards are face up
  for (let col of gameState.tableau) {
    for (let card of col) {
      if (!card.faceUp) return false;
    }
  }
  return true;
}

export function performAutoComplete() {
  if (!canAutoComplete()) return false;
  
  gameState.autoCompleting = true;
  return true;
}

export function updateAutoComplete() {
  if (!gameState.autoCompleting) return false;
  
  // Try to move any card to foundation
  for (let col = 0; col < 7; col++) {
    const tableau = gameState.tableau[col];
    if (tableau.length > 0) {
      const card = tableau[tableau.length - 1];
      const foundationIndex = autoMoveToFoundation(card);
      if (foundationIndex >= 0) {
        saveGameState();
        tableau.pop();
        gameState.foundations[foundationIndex].push(card);
        updateScore(10);
        return true;
      }
    }
  }
  
  if (gameState.waste.length > 0) {
    const card = gameState.waste[gameState.waste.length - 1];
    const foundationIndex = autoMoveToFoundation(card);
    if (foundationIndex >= 0) {
      saveGameState();
      gameState.waste.pop();
      gameState.foundations[foundationIndex].push(card);
      updateScore(10);
      return true;
    }
  }
  
  gameState.autoCompleting = false;
  return false;
}

function saveGameState() {
  const state = {
    score: gameState.score,
    moves: gameState.moves,
    tableau: gameState.tableau.map(col => col.map(c => ({ ...c }))),
    foundations: gameState.foundations.map(pile => pile.map(c => ({ ...c }))),
    stock: gameState.stock.map(c => ({ ...c })),
    waste: gameState.waste.map(c => ({ ...c }))
  };
  gameState.undoStack.push(state);
  if (gameState.undoStack.length > 50) {
    gameState.undoStack.shift();
  }
}

export function undo() {
  if (gameState.undoStack.length === 0) return false;
  
  const state = gameState.undoStack.pop();
  gameState.score = state.score - 5; // Undo penalty
  gameState.moves = state.moves;
  
  gameState.tableau = state.tableau.map(col => col.map(c => Object.assign(new Card(c.suit, c.rank), c)));
  gameState.foundations = state.foundations.map(pile => pile.map(c => Object.assign(new Card(c.suit, c.rank), c)));
  gameState.stock = state.stock.map(c => Object.assign(new Card(c.suit, c.rank), c));
  gameState.waste = state.waste.map(c => Object.assign(new Card(c.suit, c.rank), c));
  
  gameState.pickedUpCards = null;
  return true;
}

export function updateScore(points) {
  gameState.score += points;
  if (gameState.score < 0) gameState.score = 0;
}

export function checkWinCondition() {
  for (let foundation of gameState.foundations) {
    if (foundation.length !== 13) return false;
  }
  return true;
}

export function checkLoseCondition() {
  // Simplified: check if no moves possible
  // This is a heuristic - proper implementation would check all possible moves
  if (gameState.stock.length === 0 && gameState.waste.length === 0) {
    for (let col of gameState.tableau) {
      if (col.length > 0 && col[col.length - 1].faceUp) {
        return false; // There might be moves
      }
    }
    return true;
  }
  return false;
}