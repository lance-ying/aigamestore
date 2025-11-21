import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updateCoveredStatus } from './tableau.js';

export function selectCard(cardIndex, p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  if (gameState.animatingCards.length > 0) return;
  
  const card = gameState.tableauCards[cardIndex];
  if (!card || !card.isFaceUp || card.isCovered) return;
  
  if (card.canMatch(gameState.discardPile)) {
    // Valid move
    playCardToDiscard(cardIndex, p);
    gameState.chain++;
    gameState.movesWithoutTableau = 0;
    
    // Award chain bonus
    if (gameState.chain > 1) {
      const bonus = gameState.chain * 25;
      gameState.score += bonus;
    }
    
    gameState.score += 10;
    
    // Log player move
    logPlayerInfo(p);
    
    // Save move for undo
    gameState.lastMoves.push({
      type: 'tableau',
      card: card,
      fromIndex: cardIndex,
      previousDiscard: { ...gameState.discardPile }
    });
    
    checkWinCondition(p);
  }
}

export function drawFromStock(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  if (gameState.stockPile.length === 0) return;
  if (gameState.animatingCards.length > 0) return;
  
  const card = gameState.stockPile.pop();
  card.isFaceUp = true;
  
  // Animate to discard
  card.moveTo(CANVAS_WIDTH / 2 + 80, CANVAS_HEIGHT / 2 + 100, true);
  gameState.animatingCards.push({
    card: card,
    onComplete: () => {
      gameState.discardPile = card;
      gameState.chain = 0;
      gameState.movesWithoutTableau++;
    }
  });
  
  gameState.score = Math.max(0, gameState.score - 5);
  
  // Log player move
  logPlayerInfo(p);
  
  // Save move for undo
  gameState.lastMoves.push({
    type: 'stock',
    card: card,
    previousDiscard: gameState.discardPile ? { ...gameState.discardPile } : null
  });
  
  checkGameOverCondition(p);
}

function playCardToDiscard(cardIndex, p) {
  const card = gameState.tableauCards[cardIndex];
  
  // Animate to discard pile
  card.moveTo(CANVAS_WIDTH / 2 + 80, CANVAS_HEIGHT / 2 + 100, true);
  gameState.animatingCards.push({
    card: card,
    onComplete: () => {
      gameState.discardPile = card;
      updateCoveredStatus(gameState);
    }
  });
  
  // Remove from tableau
  gameState.tableauCards.splice(cardIndex, 1);
  
  // Update covering indices for remaining cards
  for (let c of gameState.tableauCards) {
    if (c.coveringIndices) {
      c.coveringIndices = c.coveringIndices.map(idx => {
        if (idx > cardIndex) return idx - 1;
        return idx;
      }).filter(idx => idx >= 0 && idx < gameState.tableauCards.length);
    }
  }
}

export function activatePowerUp(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  if (gameState.powerUpsRemaining <= 0) return;
  if (gameState.animatingCards.length > 0) return;
  
  gameState.powerUpsRemaining--;
  
  // Undo last move
  if (gameState.lastMoves.length > 0) {
    const lastMove = gameState.lastMoves.pop();
    
    if (lastMove.type === 'tableau') {
      // Re-add card to tableau
      const card = lastMove.card;
      card.x = card.targetX;
      card.y = card.targetY;
      card.moveTo(card.targetX, card.targetY, false);
      gameState.tableauCards.splice(lastMove.fromIndex, 0, card);
      
      // Restore discard
      if (lastMove.previousDiscard) {
        gameState.discardPile = lastMove.previousDiscard;
      }
      
      updateCoveredStatus(gameState);
    } else if (lastMove.type === 'stock') {
      // Return card to stock
      gameState.stockPile.push(lastMove.card);
      
      // Restore discard
      if (lastMove.previousDiscard) {
        gameState.discardPile = lastMove.previousDiscard;
      }
    }
    
    gameState.chain = 0;
    gameState.score += 5; // Refund stock penalty if applicable
  }
  
  logPlayerInfo(p);
}

function checkWinCondition(p) {
  if (gameState.tableauCards.length === 0) {
    // Level complete
    if (gameState.currentLevel < gameState.maxLevel) {
      gameState.gamePhase = 'LEVEL_COMPLETE';
    } else {
      gameState.gamePhase = 'GAME_OVER_WIN';
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function checkGameOverCondition(p) {
  // Check if there are valid moves
  let hasValidMove = false;
  
  for (let card of gameState.tableauCards) {
    if (card.isFaceUp && !card.isCovered && card.canMatch(gameState.discardPile)) {
      hasValidMove = true;
      break;
    }
  }
  
  if (!hasValidMove && gameState.stockPile.length === 0) {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: CANVAS_WIDTH / 2,
    screen_y: CANVAS_HEIGHT / 2,
    game_x: CANVAS_WIDTH / 2,
    game_y: CANVAS_HEIGHT / 2,
    framecount: p.frameCount
  });
}

export function updateSelectableElements(gameState) {
  gameState.selectableElements = [];
  
  // Add playable tableau cards
  for (let i = 0; i < gameState.tableauCards.length; i++) {
    const card = gameState.tableauCards[i];
    if (card.isFaceUp && !card.isCovered) {
      gameState.selectableElements.push({
        type: 'tableau',
        index: i,
        card: card
      });
    }
  }
  
  // Add stock pile if available
  if (gameState.stockPile.length > 0) {
    gameState.selectableElements.push({
      type: 'stock'
    });
  }
  
  // Add power-up if available
  if (gameState.powerUpsRemaining > 0) {
    gameState.selectableElements.push({
      type: 'powerup'
    });
  }
  
  // Clamp highlighted index
  if (gameState.highlightedIndex >= gameState.selectableElements.length) {
    gameState.highlightedIndex = Math.max(0, gameState.selectableElements.length - 1);
  }
}