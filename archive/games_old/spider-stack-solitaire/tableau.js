import { gameState, TABLEAU_START_X, TABLEAU_START_Y, CARD_OVERLAP, COLUMN_SPACING, CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { createDeck, shuffleDeck } from './deck.js';

export function initializeTableau(p) {
  const deck = createDeck(gameState.gameDifficultySuits);
  const shuffled = shuffleDeck(deck, p);
  
  gameState.tableau = Array.from({ length: 10 }, () => []);
  
  let cardIndex = 0;
  for (let col = 0; col < 10; col++) {
    const numCards = col < 4 ? 6 : 5;
    for (let row = 0; row < numCards; row++) {
      const card = shuffled[cardIndex++];
      card.isFaceUp = row === numCards - 1;
      gameState.tableau[col].push(card);
    }
  }
  
  gameState.stockDealsRemaining = 5;
  updateCardPositions();
}

export function updateCardPositions() {
  for (let col = 0; col < gameState.tableau.length; col++) {
    const column = gameState.tableau[col];
    for (let i = 0; i < column.length; i++) {
      const card = column[i];
      card.targetX = TABLEAU_START_X + col * COLUMN_SPACING;
      card.targetY = TABLEAU_START_Y + i * CARD_OVERLAP;
      
      if (!card.isAnimating) {
        card.x = card.targetX;
        card.y = card.targetY;
      } else {
        card.isAnimating = true;
      }
    }
  }
}

export function getMovableSequence(colIdx, cardIdx) {
  const column = gameState.tableau[colIdx];
  if (cardIdx >= column.length || !column[cardIdx].isFaceUp) {
    return [];
  }
  
  const sequence = [column[cardIdx]];
  let currentCard = column[cardIdx];
  
  for (let i = cardIdx + 1; i < column.length; i++) {
    const nextCard = column[i];
    if (!nextCard.isFaceUp) break;
    
    if (nextCard.suit === currentCard.suit && 
        nextCard.getRankValue() === currentCard.getRankValue() - 1) {
      sequence.push(nextCard);
      currentCard = nextCard;
    } else {
      break;
    }
  }
  
  return sequence;
}

export function canMoveSequence(sequence, targetColIdx) {
  if (sequence.length === 0) return false;
  
  const targetColumn = gameState.tableau[targetColIdx];
  
  if (targetColumn.length === 0) {
    return true;
  }
  
  const topCard = sequence[0];
  const targetCard = targetColumn[targetColumn.length - 1];
  
  return topCard.canPlaceOn(targetCard);
}

export function moveSequence(fromColIdx, cardIdx, toColIdx) {
  const sequence = getMovableSequence(fromColIdx, cardIdx);
  if (!canMoveSequence(sequence, toColIdx)) {
    return false;
  }
  
  saveStateForUndo();
  
  const fromColumn = gameState.tableau[fromColIdx];
  const cardsToMove = fromColumn.splice(cardIdx);
  
  cardsToMove.forEach(card => {
    card.isAnimating = true;
    gameState.tableau[toColIdx].push(card);
  });
  
  if (fromColumn.length > 0) {
    const topCard = fromColumn[fromColumn.length - 1];
    if (!topCard.isFaceUp) {
      topCard.isFaceUp = true;
    }
  }
  
  updateCardPositions();
  gameState.movesCount++;
  gameState.score = Math.max(0, gameState.score - 1);
  
  checkForCompleteSequences();
  
  return true;
}

export function checkForCompleteSequences() {
  for (let col = 0; col < gameState.tableau.length; col++) {
    const column = gameState.tableau[col];
    
    for (let i = 0; i <= column.length - 13; i++) {
      const potentialSequence = column.slice(i, i + 13);
      
      if (potentialSequence.every(c => c.isFaceUp) &&
          potentialSequence[0].rank === 'K' &&
          potentialSequence[12].rank === 'A') {
        
        const firstSuit = potentialSequence[0].suit;
        let isValidSequence = true;
        
        for (let j = 0; j < 13; j++) {
          if (potentialSequence[j].suit !== firstSuit ||
              potentialSequence[j].getRankValue() !== 13 - j) {
            isValidSequence = false;
            break;
          }
        }
        
        if (isValidSequence) {
          gameState.tableau[col].splice(i, 13);
          gameState.foundations.push(potentialSequence);
          gameState.score += 100;
          
          if (column.length > 0 && !column[column.length - 1].isFaceUp) {
            column[column.length - 1].isFaceUp = true;
          }
          
          updateCardPositions();
          return true;
        }
      }
    }
  }
  return false;
}

export function dealNewCards(p) {
  if (gameState.stockDealsRemaining <= 0) return false;
  
  const allColumnsHaveCards = gameState.tableau.every(col => col.length > 0);
  if (!allColumnsHaveCards) return false;
  
  saveStateForUndo();
  
  const deck = createDeck(gameState.gameDifficultySuits);
  const shuffled = shuffleDeck(deck, p);
  
  for (let col = 0; col < 10; col++) {
    const card = shuffled[col];
    card.isFaceUp = true;
    card.isAnimating = true;
    gameState.tableau[col].push(card);
  }
  
  gameState.stockDealsRemaining--;
  updateCardPositions();
  
  return true;
}

export function saveStateForUndo() {
  const state = {
    tableau: gameState.tableau.map(col => 
      col.map(card => ({
        rank: card.rank,
        suit: card.suit,
        isFaceUp: card.isFaceUp
      }))
    ),
    foundations: gameState.foundations.length,
    stockDealsRemaining: gameState.stockDealsRemaining,
    movesCount: gameState.movesCount,
    score: gameState.score
  };
  
  gameState.undoStack.push(state);
  if (gameState.undoStack.length > 50) {
    gameState.undoStack.shift();
  }
}

export function undoLastMove(p) {
  if (gameState.undoStack.length === 0) return false;
  
  const state = gameState.undoStack.pop();
  
  gameState.tableau = state.tableau.map(col =>
    col.map(cardData => {
      const card = new (await import('./card.js')).Card(cardData.rank, cardData.suit, cardData.isFaceUp);
      return card;
    })
  );
  
  gameState.foundations = gameState.foundations.slice(0, state.foundations);
  gameState.stockDealsRemaining = state.stockDealsRemaining;
  gameState.movesCount = state.movesCount;
  gameState.score = state.score;
  
  updateCardPositions();
  return true;
}