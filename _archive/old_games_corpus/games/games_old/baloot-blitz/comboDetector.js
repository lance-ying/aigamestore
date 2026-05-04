// comboDetector.js - Detect and handle card combinations
import { gameState, COMBO_SARY, COMBO_KHAMSA, COMBO_BALOOT, COMBO_ACE_TEN, GRID_ROWS, GRID_COLS, GRID_Y, CARD_HEIGHT, RANKS } from './globals.js';
import { createParticleEffect } from './particles.js';

export function detectAndClearCombos(p) {
  let combosFound = [];

  // Check for all combo types
  combosFound = combosFound.concat(detectSary());
  combosFound = combosFound.concat(detectKhamsa());
  combosFound = combosFound.concat(detectBaloot());
  combosFound = combosFound.concat(detectAceTen());

  if (combosFound.length > 0) {
    clearCombos(combosFound, p);
    return true;
  }

  return false;
}

function detectSary() {
  const combos = [];

  // Check horizontal
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS - 4; col++) {
      const cards = [
        gameState.grid[row][col],
        gameState.grid[row][col + 1],
        gameState.grid[row][col + 2],
        gameState.grid[row][col + 3]
      ];

      if (cards.every(c => c !== null) && 
          cards.every(c => c.rank === cards[0].rank)) {
        combos.push({
          type: COMBO_SARY,
          cards: cards,
          score: 100
        });
      }
    }
  }

  // Check vertical
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row <= GRID_ROWS - 4; row++) {
      const cards = [
        gameState.grid[row][col],
        gameState.grid[row + 1][col],
        gameState.grid[row + 2][col],
        gameState.grid[row + 3][col]
      ];

      if (cards.every(c => c !== null) && 
          cards.every(c => c.rank === cards[0].rank)) {
        combos.push({
          type: COMBO_SARY,
          cards: cards,
          score: 100
        });
      }
    }
  }

  return combos;
}

function detectKhamsa() {
  const combos = [];

  // Check horizontal consecutive ranks
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS - 5; col++) {
      const cards = [
        gameState.grid[row][col],
        gameState.grid[row][col + 1],
        gameState.grid[row][col + 2],
        gameState.grid[row][col + 3],
        gameState.grid[row][col + 4]
      ];

      if (cards.every(c => c !== null) && isConsecutive(cards)) {
        combos.push({
          type: COMBO_KHAMSA,
          cards: cards,
          score: 150
        });
      }
    }
  }

  return combos;
}

function detectBaloot() {
  const combos = [];

  // Check horizontal King + Queen of same suit
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS - 2; col++) {
      const card1 = gameState.grid[row][col];
      const card2 = gameState.grid[row][col + 1];

      if (card1 && card2 && card1.sameSuit(card2) &&
          ((card1.rank === 'K' && card2.rank === 'Q') ||
           (card1.rank === 'Q' && card2.rank === 'K'))) {
        combos.push({
          type: COMBO_BALOOT,
          cards: [card1, card2],
          score: 50
        });
      }
    }
  }

  // Check vertical
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row <= GRID_ROWS - 2; row++) {
      const card1 = gameState.grid[row][col];
      const card2 = gameState.grid[row + 1][col];

      if (card1 && card2 && card1.sameSuit(card2) &&
          ((card1.rank === 'K' && card2.rank === 'Q') ||
           (card1.rank === 'Q' && card2.rank === 'K'))) {
        combos.push({
          type: COMBO_BALOOT,
          cards: [card1, card2],
          score: 50
        });
      }
    }
  }

  return combos;
}

function detectAceTen() {
  const combos = [];

  // Check horizontal Ace + Ten of same suit
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLS - 2; col++) {
      const card1 = gameState.grid[row][col];
      const card2 = gameState.grid[row][col + 1];

      if (card1 && card2 && card1.sameSuit(card2) &&
          ((card1.rank === 'A' && card2.rank === '10') ||
           (card1.rank === '10' && card2.rank === 'A'))) {
        combos.push({
          type: COMBO_ACE_TEN,
          cards: [card1, card2],
          score: 60
        });
      }
    }
  }

  // Check vertical
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row <= GRID_ROWS - 2; row++) {
      const card1 = gameState.grid[row][col];
      const card2 = gameState.grid[row + 1][col];

      if (card1 && card2 && card1.sameSuit(card2) &&
          ((card1.rank === 'A' && card2.rank === '10') ||
           (card1.rank === '10' && card2.rank === 'A'))) {
        combos.push({
          type: COMBO_ACE_TEN,
          cards: [card1, card2],
          score: 60
        });
      }
    }
  }

  return combos;
}

function isConsecutive(cards) {
  const ranks = cards.map(c => c.getRankValue()).sort((a, b) => a - b);
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) {
      return false;
    }
  }
  return true;
}

function clearCombos(combos, p) {
  const allCards = new Set();
  let totalScore = 0;

  // Collect all cards to clear and calculate score
  combos.forEach(combo => {
    combo.cards.forEach(card => allCards.add(card));
    totalScore += combo.score * gameState.scoreMultiplier;
  });

  // Mark cards for clearing animation
  allCards.forEach(card => {
    card.clearing = true;
    gameState.clearingAnimation.push(card);
    createParticleEffect(p, card.x + 25, card.y + 35);
  });

  // Update game state
  gameState.score += totalScore;
  gameState.combosCleared += combos.length;
  gameState.levelProgress += combos.length;

  // Log combo clear
  p.logs.game_info.push({
    data: { event: 'combo_cleared', count: combos.length, score: totalScore },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function removeCompletedClearingCards() {
  const toRemove = gameState.clearingAnimation.filter(card => card.alpha <= 0);
  
  toRemove.forEach(card => {
    // Remove from grid
    if (card.gridRow >= 0 && card.gridCol >= 0) {
      gameState.grid[card.gridRow][card.gridCol] = null;
    }
    
    // Remove from entities
    const idx = gameState.entities.indexOf(card);
    if (idx !== -1) {
      gameState.entities.splice(idx, 1);
    }
    
    // Remove from clearing animation
    const animIdx = gameState.clearingAnimation.indexOf(card);
    if (animIdx !== -1) {
      gameState.clearingAnimation.splice(animIdx, 1);
    }
  });

  // Apply gravity to remaining cards
  if (toRemove.length > 0) {
    applyGravity();
  }
}

function applyGravity() {
  // Move cards down to fill empty spaces
  for (let col = 0; col < GRID_COLS; col++) {
    let writeRow = GRID_ROWS - 1;
    
    for (let readRow = GRID_ROWS - 1; readRow >= 0; readRow--) {
      if (gameState.grid[readRow][col] !== null) {
        if (readRow !== writeRow) {
          const card = gameState.grid[readRow][col];
          gameState.grid[readRow][col] = null;
          gameState.grid[writeRow][col] = card;
          card.gridRow = writeRow;
          card.targetY = GRID_Y + writeRow * (CARD_HEIGHT + 5);
        }
        writeRow--;
      }
    }
  }
}