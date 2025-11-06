import { gameState } from './globals.js';
import { handleKeyPressed } from './input.js';

export function getTestAction(p) {
  const mode = gameState.controlMode;
  
  if (mode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (mode === "TEST_2") {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  const frame = p.frameCount;
  
  if (frame === 10) return 13; // ENTER
  if (frame === 60) return 32; // SPACE (select)
  if (frame === 120) return p.RIGHT_ARROW;
  if (frame === 180) return 32; // SPACE (drop)
  if (frame === 240) return 16; // SHIFT (draw)
  if (frame === 300) return 90; // Z (undo)
  if (frame === 360) return 27; // ESC (pause)
  if (frame === 420) return 27; // ESC (unpause)
  
  return null;
}

function getWinTestAction(p) {
  const frame = p.frameCount;
  
  if (frame === 10) return 13; // ENTER to start
  
  // Auto-solve by moving cards systematically
  if (gameState.gamePhase === "PLAYING" && frame % 5 === 0 && frame > 20) {
    // Try to find and move any card to foundation
    for (let i = 0; i < 7; i++) {
      const col = gameState.tableau[i];
      if (col.length > 0) {
        const card = col[col.length - 1];
        if (card.isFaceUp) {
          for (let f = 0; f < 4; f++) {
            if (card.canStackOnFoundation(gameState.foundations[f])) {
              // Navigate to tableau column
              while (gameState.highlightedArea.type !== 'tableau' || 
                     gameState.highlightedArea.index !== i) {
                return p.RIGHT_ARROW;
              }
              if (gameState.selectedCards.length === 0) {
                return 32; // Pick up
              }
              // Navigate to foundation
              while (gameState.highlightedArea.type !== 'foundation' || 
                     gameState.highlightedArea.index !== f) {
                return p.RIGHT_ARROW;
              }
              return 32; // Drop
            }
          }
        }
      }
    }
    
    // Try waste pile
    if (gameState.waste.length > 0) {
      const card = gameState.waste[gameState.waste.length - 1];
      for (let f = 0; f < 4; f++) {
        if (card.canStackOnFoundation(gameState.foundations[f])) {
          while (gameState.highlightedArea.type !== 'waste') {
            return p.LEFT_ARROW;
          }
          if (gameState.selectedCards.length === 0) {
            return 32;
          }
          while (gameState.highlightedArea.type !== 'foundation' || 
                 gameState.highlightedArea.index !== f) {
            return p.RIGHT_ARROW;
          }
          return 32;
        }
      }
    }
    
    // Draw from stockpile
    if (gameState.stockpile.length > 0) {
      while (gameState.highlightedArea.type !== 'stockpile') {
        return p.LEFT_ARROW;
      }
      return 16; // SHIFT to draw
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (action) {
    handleKeyPressed(p, action);
  }
}