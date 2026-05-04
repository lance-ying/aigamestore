// input.js - Input handling
import { gameState } from './globals.js';
import { drawFromStock, undoLastMove, findHint, moveCardToFoundation, moveCardsToTableau, checkWinCondition } from './gameLogic.js';
import { CARD_WIDTH, CARD_HEIGHT } from './globals.js';
import { STOCK_X, STOCK_Y, WASTE_X, WASTE_Y, getFoundationX, FOUNDATION_Y, getTableauX, TABLEAU_Y } from './layout.js';

export function handleKeyPressed(p) {
  const { gamePhase, controlMode } = gameState;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (controlMode !== 'HUMAN') return;
  
  // Global controls
  if (p.keyCode === 13) { // ENTER
    if (gamePhase === 'START') {
      startGame();
    } else if (gamePhase === 'GAME_OVER_WIN') {
      if (gameState.currentLevel < 4) {
        gameState.currentLevel++;
        startGame();
      }
    } else if (gamePhase === 'GAME_OVER_LOSE') {
      startGame();
    }
  } else if (p.keyCode === 82) { // R
    restartToStart();
  } else if (p.keyCode === 27) { // ESC
    if (gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      p.logs.game_info.push({
        data: { gamePhase: 'PAUSED' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      p.logs.game_info.push({
        data: { gamePhase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Playing controls
  if (gamePhase === 'PLAYING') {
    if (p.keyCode === 32) { // SPACE
      drawFromStock();
    } else if (p.keyCode === 90) { // Z
      undoLastMove();
    } else if (p.keyCode === 16) { // SHIFT
      activateHint();
    }
  }
}

export function handleMousePressed(p) {
  if (gameState.gamePhase !== 'PLAYING' || gameState.controlMode !== 'HUMAN') return;
  
  const mx = p.mouseX;
  const my = p.mouseY;
  
  // Check stock pile click
  if (mx >= STOCK_X && mx <= STOCK_X + CARD_WIDTH && my >= STOCK_Y && my <= STOCK_Y + CARD_HEIGHT) {
    if (gameState.stockPile.length > 0 || !gameState.wasteRecycled) {
      drawFromStock();
      return;
    }
  }
  
  // Check waste pile click (single click tries auto-move)
  const { wastePile } = gameState;
  if (wastePile.length > 0) {
    const topWaste = wastePile[wastePile.length - 1];
    if (topWaste.contains(mx, my)) {
      if (tryAutoMove(topWaste, 'waste', -1)) {
        return;
      }
      // If auto-move fails, allow drag
      gameState.selectedCards = [topWaste];
      gameState.selectedSource = { type: 'waste', index: -1 };
      gameState.dragOffset = { x: mx - topWaste.x, y: my - topWaste.y };
      return;
    }
  }
  
  // Check tableau clicks
  const { tableau } = gameState;
  for (let col = 0; col < 7; col++) {
    const column = tableau[col];
    for (let i = column.length - 1; i >= 0; i--) {
      const card = column[i];
      if (card.contains(mx, my) && card.isFaceUp) {
        // Select this card and all cards below it
        const selectedCards = column.slice(i);
        
        // Validate stack (must be alternating colors and descending)
        let validStack = true;
        for (let j = 0; j < selectedCards.length - 1; j++) {
          const curr = selectedCards[j];
          const next = selectedCards[j + 1];
          if (curr.getColor() === next.getColor() || curr.getRankValue() !== next.getRankValue() + 1) {
            validStack = false;
            break;
          }
        }
        
        if (validStack) {
          if (selectedCards.length === 1) {
            if (tryAutoMove(card, 'tableau', col)) {
              return;
            }
          }
          gameState.selectedCards = selectedCards;
          gameState.selectedSource = { type: 'tableau', index: col };
          gameState.dragOffset = { x: mx - card.x, y: my - card.y };
        }
        return;
      }
    }
  }
}

export function handleMouseDragged(p) {
  if (gameState.gamePhase !== 'PLAYING' || gameState.controlMode !== 'HUMAN') return;
  
  if (gameState.selectedCards && gameState.selectedCards.length > 0) {
    const mx = p.mouseX;
    const my = p.mouseY;
    const firstCard = gameState.selectedCards[0];
    
    firstCard.x = mx - gameState.dragOffset.x;
    firstCard.y = my - gameState.dragOffset.y;
    
    // Update positions of other cards in stack
    for (let i = 1; i < gameState.selectedCards.length; i++) {
      gameState.selectedCards[i].x = firstCard.x;
      gameState.selectedCards[i].y = firstCard.y + i * 20;
    }
  }
}

export function handleMouseReleased(p) {
  if (gameState.gamePhase !== 'PLAYING' || gameState.controlMode !== 'HUMAN') return;
  
  if (!gameState.selectedCards || gameState.selectedCards.length === 0) return;
  
  const mx = p.mouseX;
  const my = p.mouseY;
  const firstCard = gameState.selectedCards[0];
  const { selectedSource } = gameState;
  
  let placed = false;
  
  // Try foundations (only single cards)
  if (gameState.selectedCards.length === 1) {
    for (let i = 0; i < 4; i++) {
      const fx = getFoundationX(i);
      if (mx >= fx && mx <= fx + CARD_WIDTH && my >= FOUNDATION_Y && my <= FOUNDATION_Y + CARD_HEIGHT) {
        if (moveCardToFoundation(firstCard, selectedSource.type, selectedSource.index)) {
          placed = true;
          break;
        }
      }
    }
  }
  
  // Try tableau
  if (!placed) {
    for (let col = 0; col < 7; col++) {
      const tx = getTableauX(col);
      const column = gameState.tableau[col];
      const ty = TABLEAU_Y + column.length * 20;
      
      if (mx >= tx && mx <= tx + CARD_WIDTH && my >= TABLEAU_Y && my <= ty + CARD_HEIGHT) {
        if (moveCardsToTableau(gameState.selectedCards, selectedSource.type, selectedSource.index, col)) {
          placed = true;
          break;
        }
      }
    }
  }
  
  // Return to original position if not placed
  if (!placed) {
    import('./gameLogic.js').then(({ updateCardPositions }) => {
      updateCardPositions(true);
    });
  }
  
  gameState.selectedCards = null;
  gameState.selectedSource = null;
}

function tryAutoMove(card, sourceType, sourceIndex) {
  // Try to move to foundation first
  if (moveCardToFoundation(card, sourceType, sourceIndex)) {
    return true;
  }
  
  // Try to move to tableau
  let validMoves = 0;
  let validCol = -1;
  for (let col = 0; col < 7; col++) {
    if (sourceType === 'tableau' && col === sourceIndex) continue;
    
    const column = gameState.tableau[col];
    if (column.length === 0 && card.rank === 'K') {
      validMoves++;
      validCol = col;
    } else if (column.length > 0) {
      const topCard = column[column.length - 1];
      if (card.getColor() !== topCard.getColor() && card.getRankValue() === topCard.getRankValue() - 1) {
        validMoves++;
        validCol = col;
      }
    }
  }
  
  if (validMoves === 1) {
    return moveCardsToTableau([card], sourceType, sourceIndex, validCol);
  }
  
  return false;
}

function activateHint() {
  const hint = findHint();
  if (hint) {
    gameState.hintActive = true;
    gameState.hintCard = hint.card;
    gameState.hintTarget = hint.target;
    gameState.hintTargetIndex = hint.targetIndex;
    
    setTimeout(() => {
      gameState.hintActive = false;
      gameState.hintCard = null;
      gameState.hintTarget = null;
      gameState.hintTargetIndex = null;
    }, 2000);
  }
}

function startGame() {
  import('./game.js').then(({ initializeLevel }) => {
    initializeLevel();
  });
}

function restartToStart() {
  gameState.gamePhase = 'START';
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.moves = 0;
  gameState.selectedCards = null;
  gameState.selectedSource = null;
  gameState.hintActive = false;
  gameState.undoStack = [];
  
  if (typeof window !== 'undefined' && window.gameInstance) {
    window.gameInstance.logs.game_info.push({
      data: { gamePhase: 'START' },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}