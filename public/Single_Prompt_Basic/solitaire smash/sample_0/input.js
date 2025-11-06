import { gameState } from './globals.js';
import { 
  canMoveToFoundation, 
  canMoveToTableau, 
  moveToFoundation, 
  moveToTableau, 
  drawFromStockpile, 
  restoreGameState 
} from './gameLogic.js';

export function handleArrowKeys(p, keyCode) {
  const area = gameState.highlightedArea;
  
  if (keyCode === p.LEFT_ARROW) {
    if (area.type === 'tableau') {
      if (area.index > 0) {
        area.index--;
      } else {
        area.type = 'foundation';
        area.index = 3;
      }
    } else if (area.type === 'foundation') {
      if (area.index > 0) {
        area.index--;
      } else {
        area.type = 'waste';
        area.index = 0;
      }
    } else if (area.type === 'waste') {
      area.type = 'stockpile';
      area.index = 0;
    }
  } else if (keyCode === p.RIGHT_ARROW) {
    if (area.type === 'stockpile') {
      area.type = 'waste';
      area.index = 0;
    } else if (area.type === 'waste') {
      area.type = 'foundation';
      area.index = 0;
    } else if (area.type === 'foundation') {
      if (area.index < 3) {
        area.index++;
      } else {
        area.type = 'tableau';
        area.index = 0;
      }
    } else if (area.type === 'tableau') {
      if (area.index < 6) {
        area.index++;
      }
    }
  }
}

export function handleSelection(p) {
  const area = gameState.highlightedArea;
  
  if (gameState.selectedCards.length > 0) {
    // Try to drop
    if (area.type === 'tableau') {
      if (canMoveToTableau(gameState.selectedCards, area.index)) {
        moveToTableau(gameState.selectedCards, area.index);
        gameState.selectedCards = [];
        gameState.selectedSource = null;
        return;
      }
    } else if (area.type === 'foundation' && gameState.selectedCards.length === 1) {
      const card = gameState.selectedCards[0];
      if (canMoveToFoundation(card, area.index)) {
        moveToFoundation(card, area.index, 
                        gameState.selectedSource.type, 
                        gameState.selectedSource.index);
        gameState.selectedCards = [];
        gameState.selectedSource = null;
        return;
      }
    }
    
    // Invalid drop, cancel selection
    gameState.selectedCards = [];
    gameState.selectedSource = null;
  } else {
    // Pick up cards
    if (area.type === 'tableau') {
      const col = gameState.tableau[area.index];
      if (col.length > 0) {
        const topCard = col[col.length - 1];
        if (topCard.isFaceUp) {
          gameState.selectedCards = [topCard];
          gameState.selectedSource = { type: 'tableau', index: area.index };
        }
      }
    } else if (area.type === 'waste') {
      if (gameState.waste.length > 0) {
        const topCard = gameState.waste[gameState.waste.length - 1];
        gameState.selectedCards = [topCard];
        gameState.selectedSource = { type: 'waste', index: 0 };
      }
    }
  }
}

export function handleKeyPressed(p, keyCode) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (keyCode === p.LEFT_ARROW || keyCode === p.RIGHT_ARROW) {
    handleArrowKeys(p, keyCode);
  } else if (keyCode === 32) { // Space
    handleSelection(p);
  } else if (keyCode === 16) { // Shift
    if (gameState.highlightedArea.type === 'stockpile' || 
        gameState.highlightedArea.type === 'waste') {
      drawFromStockpile();
    }
  } else if (keyCode === 90) { // Z
    restoreGameState();
  }
}