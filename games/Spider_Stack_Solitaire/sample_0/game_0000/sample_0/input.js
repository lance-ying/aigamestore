import { gameState } from './globals.js';
import { moveSequence, dealNewCards, getMovableSequence, canMoveSequence } from './tableau.js';

export function handleKeyPressed(p, keyCode) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.gamePhase === "START") {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = "PAUSED";
      gameState.isPaused = true;
    } else if (keyCode === 82) { // R
      resetToStart(p);
    } else if (keyCode === 90) { // Z
      handleUndo(p);
    } else if (keyCode === 32) { // SPACE
      handleAutoMove();
    } else if (keyCode >= 37 && keyCode <= 40) { // Arrow keys
      handleArrowNavigation(keyCode);
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (keyCode === 27) { // ESC
      gameState.gamePhase = "PLAYING";
      gameState.isPaused = false;
    } else if (keyCode === 82) { // R
      resetToStart(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER") {
    if (keyCode === 82) { // R
      resetToStart(p);
    }
  }
}

export function handleMousePressed(p) {
  if (gameState.gamePhase === "PLAYING") {
    handleTableauClick(p);
  }
}

export function handleMouseReleased(p) {
  if (gameState.draggedCards) {
    const targetCol = getColumnAtPosition(p.mouseX, p.mouseY);
    if (targetCol !== -1 && targetCol !== gameState.draggedCards.fromCol) {
      moveSequence(gameState.draggedCards.fromCol, gameState.draggedCards.cardIdx, targetCol);
    }
    gameState.draggedCards = null;
  }
}

function handleTableauClick(p) {
  for (let col = gameState.tableau.length - 1; col >= 0; col--) {
    const column = gameState.tableau[col];
    for (let i = column.length - 1; i >= 0; i--) {
      const card = column[i];
      if (card.isFaceUp && card.contains(p.mouseX, p.mouseY)) {
        
        if (gameState.selectedCardData && 
            gameState.selectedCardData.column === col && 
            gameState.selectedCardData.cardIdx === i) {
          gameState.selectedCardData = null;
          return;
        }
        
        if (gameState.selectedCardData) {
          const moved = moveSequence(
            gameState.selectedCardData.column,
            gameState.selectedCardData.cardIdx,
            col
          );
          if (moved) {
            gameState.selectedCardData = null;
          }
          return;
        }
        
        const sequence = getMovableSequence(col, i);
        if (sequence.length > 0) {
          gameState.selectedCardData = { column: col, cardIdx: i };
          gameState.draggedCards = { fromCol: col, cardIdx: i };
        }
        return;
      }
    }
  }
  
  gameState.selectedCardData = null;
}

function getColumnAtPosition(x, y) {
  for (let col = 0; col < gameState.tableau.length; col++) {
    const colX = 30 + col * 55;
    if (x >= colX && x <= colX + 45) {
      return col;
    }
  }
  return -1;
}

function handleArrowNavigation(keyCode) {
  if (!gameState.selectedCardData) return;
  
  const { column, cardIdx } = gameState.selectedCardData;
  
  if (keyCode === 37) { // LEFT
    if (column > 0) {
      const targetCol = column - 1;
      const targetColumn = gameState.tableau[targetCol];
      if (targetColumn.length > 0) {
        const topIdx = targetColumn.length - 1;
        gameState.selectedCardData = { column: targetCol, cardIdx: topIdx };
      }
    }
  } else if (keyCode === 39) { // RIGHT
    if (column < 9) {
      const targetCol = column + 1;
      const targetColumn = gameState.tableau[targetCol];
      if (targetColumn.length > 0) {
        const topIdx = targetColumn.length - 1;
        gameState.selectedCardData = { column: targetCol, cardIdx: topIdx };
      }
    }
  } else if (keyCode === 38) { // UP
    if (cardIdx > 0) {
      const newIdx = cardIdx - 1;
      if (gameState.tableau[column][newIdx].isFaceUp) {
        gameState.selectedCardData = { column, cardIdx: newIdx };
      }
    }
  } else if (keyCode === 40) { // DOWN
    const columnLength = gameState.tableau[column].length;
    if (cardIdx < columnLength - 1) {
      gameState.selectedCardData = { column, cardIdx: cardIdx + 1 };
    }
  }
}

function handleAutoMove() {
  if (!gameState.selectedCardData) {
    findAndHighlightMove();
    return;
  }
  
  const { column, cardIdx } = gameState.selectedCardData;
  const sequence = getMovableSequence(column, cardIdx);
  
  for (let targetCol = 0; targetCol < 10; targetCol++) {
    if (targetCol === column) continue;
    
    if (canMoveSequence(sequence, targetCol)) {
      moveSequence(column, cardIdx, targetCol);
      gameState.selectedCardData = null;
      return;
    }
  }
  
  gameState.selectedCardData = null;
}

function findAndHighlightMove() {
  for (let fromCol = 0; fromCol < 10; fromCol++) {
    const column = gameState.tableau[fromCol];
    for (let i = 0; i < column.length; i++) {
      if (!column[i].isFaceUp) continue;
      
      const sequence = getMovableSequence(fromCol, i);
      if (sequence.length === 0) continue;
      
      for (let toCol = 0; toCol < 10; toCol++) {
        if (toCol === fromCol) continue;
        
        if (canMoveSequence(sequence, toCol)) {
          gameState.autoMoveHint = { fromCol, cardIdx: i, toCol };
          setTimeout(() => { gameState.autoMoveHint = null; }, 1000);
          return;
        }
      }
    }
  }
}

function handleUndo(p) {
  if (gameState.undoStack.length > 0) {
    const state = gameState.undoStack.pop();
    
    const Card = (await import('./card.js')).Card;
    gameState.tableau = state.tableau.map(col =>
      col.map(cardData => {
        const card = new Card(cardData.rank, cardData.suit, cardData.isFaceUp);
        return card;
      })
    );
    
    gameState.foundations = gameState.foundations.slice(0, state.foundations);
    gameState.stockDealsRemaining = state.stockDealsRemaining;
    gameState.movesCount = state.movesCount;
    gameState.score = state.score;
    
    const { updateCardPositions } = await import('./tableau.js');
    updateCardPositions();
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 500;
  gameState.movesCount = 0;
  gameState.gameTimerSeconds = 0;
  gameState.startTime = Date.now();
  gameState.undoStack = [];
  gameState.foundations = [];
  gameState.selectedCardData = null;
  gameState.draggedCards = null;
  
  const { initializeTableau } = await import('./tableau.js');
  initializeTableau(p);
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = "START";
  gameState.isPaused = false;
  gameState.selectedCardData = null;
  gameState.draggedCards = null;
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}