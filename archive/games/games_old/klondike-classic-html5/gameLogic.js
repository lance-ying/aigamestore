// gameLogic.js - Core game logic and rule checking
import { gameState, RANKS } from './globals.js';
import { STOCK_X, STOCK_Y, WASTE_X, WASTE_Y, getFoundationX, FOUNDATION_Y, getTableauX, getTableauCardY } from './layout.js';

export function dealCards() {
  const { deck, tableau, stockPile } = gameState;
  
  // Deal to tableau
  let deckIndex = 0;
  for (let col = 0; col < 7; col++) {
    tableau[col] = [];
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++];
      card.isFaceUp = (row === col);
      tableau[col].push(card);
    }
  }
  
  // Remaining cards to stock
  stockPile.length = 0;
  for (let i = deckIndex; i < deck.length; i++) {
    deck[i].isFaceUp = false;
    stockPile.push(deck[i]);
  }
  
  updateCardPositions();
}

export function updateCardPositions(animate = false) {
  const { stockPile, wastePile, foundations, tableau } = gameState;
  
  // Stock pile
  stockPile.forEach((card, i) => {
    card.moveTo(STOCK_X, STOCK_Y, animate);
  });
  
  // Waste pile
  wastePile.forEach((card, i) => {
    const offset = Math.min(i * 2, 40);
    card.moveTo(WASTE_X + offset, WASTE_Y, animate);
  });
  
  // Foundations
  foundations.forEach((pile, pileIndex) => {
    pile.forEach((card, cardIndex) => {
      card.moveTo(getFoundationX(pileIndex), FOUNDATION_Y, animate);
    });
  });
  
  // Tableau
  tableau.forEach((column, colIndex) => {
    column.forEach((card, cardIndex) => {
      card.moveTo(getTableauX(colIndex), getTableauCardY(colIndex, cardIndex), animate);
    });
  });
}

export function canPlaceOnFoundation(card, foundationIndex) {
  const foundation = gameState.foundations[foundationIndex];
  
  if (foundation.length === 0) {
    return card.rank === 'A';
  }
  
  const topCard = foundation[foundation.length - 1];
  return card.suit === topCard.suit && card.getRankValue() === topCard.getRankValue() + 1;
}

export function canPlaceOnTableau(card, columnIndex) {
  const column = gameState.tableau[columnIndex];
  
  if (column.length === 0) {
    return card.rank === 'K';
  }
  
  const topCard = column[column.length - 1];
  return card.getColor() !== topCard.getColor() && card.getRankValue() === topCard.getRankValue() - 1;
}

export function drawFromStock() {
  const { stockPile, wastePile, currentLevel, wasteRecycled } = gameState;
  
  if (stockPile.length === 0) {
    if (!wasteRecycled) {
      // Recycle waste back to stock (once)
      while (wastePile.length > 0) {
        const card = wastePile.pop();
        card.isFaceUp = false;
        stockPile.unshift(card);
      }
      gameState.wasteRecycled = true;
      updateCardPositions(true);
    }
    return;
  }
  
  const drawCount = (currentLevel === 1) ? 1 : 3;
  const actualDraw = Math.min(drawCount, stockPile.length);
  
  for (let i = 0; i < actualDraw; i++) {
    const card = stockPile.pop();
    card.isFaceUp = true;
    wastePile.push(card);
  }
  
  gameState.moves++;
  updateCardPositions(true);
}

export function moveCardToFoundation(card, sourceType, sourceIndex) {
  for (let i = 0; i < 4; i++) {
    if (canPlaceOnFoundation(card, i)) {
      saveGameState();
      removeCardFromSource(card, sourceType, sourceIndex);
      gameState.foundations[i].push(card);
      gameState.score += 10;
      gameState.moves++;
      updateCardPositions(true);
      checkTableauFlip(sourceType, sourceIndex);
      return true;
    }
  }
  return false;
}

export function removeCardFromSource(card, sourceType, sourceIndex) {
  if (sourceType === 'waste') {
    const index = gameState.wastePile.indexOf(card);
    if (index !== -1) gameState.wastePile.splice(index, 1);
  } else if (sourceType === 'tableau') {
    const column = gameState.tableau[sourceIndex];
    const index = column.indexOf(card);
    if (index !== -1) column.splice(index, 1);
  }
}

export function checkTableauFlip(sourceType, sourceIndex) {
  if (sourceType === 'tableau') {
    const column = gameState.tableau[sourceIndex];
    if (column.length > 0) {
      const topCard = column[column.length - 1];
      if (!topCard.isFaceUp) {
        topCard.isFaceUp = true;
        gameState.score += 5;
      }
    }
  }
}

export function moveCardsToTableau(cards, sourceType, sourceIndex, targetColumn) {
  if (cards.length === 0) return false;
  
  const firstCard = cards[0];
  if (!canPlaceOnTableau(firstCard, targetColumn)) return false;
  
  saveGameState();
  
  // Remove cards from source
  if (sourceType === 'waste') {
    gameState.wastePile = gameState.wastePile.filter(c => !cards.includes(c));
    gameState.score += 5;
  } else if (sourceType === 'tableau') {
    const column = gameState.tableau[sourceIndex];
    gameState.tableau[sourceIndex] = column.filter(c => !cards.includes(c));
  }
  
  // Add to target
  gameState.tableau[targetColumn].push(...cards);
  gameState.moves++;
  updateCardPositions(true);
  checkTableauFlip(sourceType, sourceIndex);
  
  return true;
}

export function saveGameState() {
  const state = {
    score: gameState.score,
    moves: gameState.moves,
    wasteRecycled: gameState.wasteRecycled,
    stockPile: [...gameState.stockPile],
    wastePile: [...gameState.wastePile],
    foundations: gameState.foundations.map(f => [...f]),
    tableau: gameState.tableau.map(col => [...col]),
    faceUpStates: {}
  };
  
  gameState.deck.forEach((card, i) => {
    state.faceUpStates[i] = card.isFaceUp;
  });
  
  gameState.undoStack.push(state);
  if (gameState.undoStack.length > 100) {
    gameState.undoStack.shift();
  }
}

export function undoLastMove() {
  if (gameState.undoStack.length === 0) return;
  
  const state = gameState.undoStack.pop();
  gameState.score = state.score;
  gameState.moves = state.moves;
  gameState.wasteRecycled = state.wasteRecycled;
  gameState.stockPile = [...state.stockPile];
  gameState.wastePile = [...state.wastePile];
  gameState.foundations = state.foundations.map(f => [...f]);
  gameState.tableau = state.tableau.map(col => [...col]);
  
  gameState.deck.forEach((card, i) => {
    card.isFaceUp = state.faceUpStates[i];
  });
  
  updateCardPositions(true);
}

export function checkWinCondition() {
  return gameState.foundations.every(pile => pile.length === 13);
}

export function findHint() {
  const { wastePile, tableau, foundations } = gameState;
  
  // Check waste to foundation
  if (wastePile.length > 0) {
    const topWaste = wastePile[wastePile.length - 1];
    for (let i = 0; i < 4; i++) {
      if (canPlaceOnFoundation(topWaste, i)) {
        return { card: topWaste, target: 'foundation', targetIndex: i };
      }
    }
  }
  
  // Check tableau to foundation
  for (let col = 0; col < 7; col++) {
    const column = tableau[col];
    if (column.length > 0) {
      const topCard = column[column.length - 1];
      if (topCard.isFaceUp) {
        for (let i = 0; i < 4; i++) {
          if (canPlaceOnFoundation(topCard, i)) {
            return { card: topCard, target: 'foundation', targetIndex: i };
          }
        }
      }
    }
  }
  
  // Check waste to tableau
  if (wastePile.length > 0) {
    const topWaste = wastePile[wastePile.length - 1];
    for (let col = 0; col < 7; col++) {
      if (canPlaceOnTableau(topWaste, col)) {
        return { card: topWaste, target: 'tableau', targetIndex: col };
      }
    }
  }
  
  // Check tableau to tableau
  for (let srcCol = 0; srcCol < 7; srcCol++) {
    const srcColumn = tableau[srcCol];
    for (let cardIdx = 0; cardIdx < srcColumn.length; cardIdx++) {
      const card = srcColumn[cardIdx];
      if (card.isFaceUp) {
        for (let destCol = 0; destCol < 7; destCol++) {
          if (srcCol !== destCol && canPlaceOnTableau(card, destCol)) {
            return { card: card, target: 'tableau', targetIndex: destCol };
          }
        }
      }
    }
  }
  
  return null;
}