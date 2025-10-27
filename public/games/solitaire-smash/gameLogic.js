import { gameState } from './globals.js';
import { updateCardPositions } from './layout.js';

export function saveGameState() {
  const state = {
    tableau: gameState.tableau.map(col => col.map(c => ({ id: c.id, isFaceUp: c.isFaceUp }))),
    foundations: gameState.foundations.map(pile => pile.map(c => c.id)),
    stockpile: gameState.stockpile.map(c => c.id),
    waste: gameState.waste.map(c => c.id),
    score: gameState.score,
    moveCount: gameState.moveCount,
    stockpileCycles: gameState.stockpileCycles
  };
  gameState.undoStack.push(state);
  if (gameState.undoStack.length > 100) {
    gameState.undoStack.shift();
  }
}

export function restoreGameState() {
  if (gameState.undoStack.length === 0) return;
  
  const state = gameState.undoStack.pop();
  const cardMap = new Map(gameState.allCards.map(c => [c.id, c]));
  
  gameState.tableau = state.tableau.map(col => 
    col.map(c => {
      const card = cardMap.get(c.id);
      card.isFaceUp = c.isFaceUp;
      return card;
    })
  );
  
  gameState.foundations = state.foundations.map(pile =>
    pile.map(id => cardMap.get(id))
  );
  
  gameState.stockpile = state.stockpile.map(id => cardMap.get(id));
  gameState.waste = state.waste.map(id => cardMap.get(id));
  gameState.score = state.score;
  gameState.moveCount = state.moveCount;
  gameState.stockpileCycles = state.stockpileCycles;
  
  updateCardPositions(gameState);
}

export function canMoveToFoundation(card, foundationIndex) {
  return card.canStackOnFoundation(gameState.foundations[foundationIndex]);
}

export function canMoveToTableau(cards, tableauIndex) {
  if (cards.length === 0) return false;
  const targetCol = gameState.tableau[tableauIndex];
  const topCard = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;
  return cards[0].canStackOnTableau(topCard);
}

export function moveToFoundation(card, foundationIndex, fromType, fromIndex) {
  saveGameState();
  
  if (fromType === 'tableau') {
    const col = gameState.tableau[fromIndex];
    col.pop();
    if (col.length > 0 && !col[col.length - 1].isFaceUp) {
      col[col.length - 1].isFaceUp = true;
      gameState.score += 5;
    }
  } else if (fromType === 'waste') {
    gameState.waste.pop();
  }
  
  gameState.foundations[foundationIndex].push(card);
  gameState.score += 10;
  gameState.moveCount++;
  
  updateCardPositions(gameState);
}

export function moveToTableau(cards, targetCol) {
  saveGameState();
  
  const sourceCol = gameState.tableau[gameState.selectedSource.index];
  const removeCount = cards.length;
  sourceCol.splice(-removeCount);
  
  if (sourceCol.length > 0 && !sourceCol[sourceCol.length - 1].isFaceUp) {
    sourceCol[sourceCol.length - 1].isFaceUp = true;
    gameState.score += 5;
  }
  
  gameState.tableau[targetCol].push(...cards);
  gameState.moveCount++;
  
  updateCardPositions(gameState);
}

export function drawFromStockpile() {
  if (gameState.stockpile.length > 0) {
    saveGameState();
    const card = gameState.stockpile.pop();
    card.isFaceUp = true;
    gameState.waste.push(card);
    
    if (gameState.stockpileCycles === 0) {
      gameState.score = Math.max(0, gameState.score - 1);
    }
    
    updateCardPositions(gameState);
  } else if (gameState.waste.length > 0) {
    saveGameState();
    gameState.stockpileCycles++;
    gameState.score = Math.max(0, gameState.score - 100);
    
    while (gameState.waste.length > 0) {
      const card = gameState.waste.pop();
      card.isFaceUp = false;
      gameState.stockpile.push(card);
    }
    
    updateCardPositions(gameState);
  }
}

export function checkWinCondition() {
  return gameState.foundations.every(pile => pile.length === 13);
}

export function calculateLevelBonus() {
  const timeBonusValue = Math.max(0, 5000 - (gameState.timeElapsed * 2));
  const movesBonusValue = Math.max(0, 2000 - gameState.moveCount);
  
  let bonus = timeBonusValue + movesBonusValue;
  
  if (gameState.score > 7500) {
    bonus += 1000;
  }
  
  return bonus;
}