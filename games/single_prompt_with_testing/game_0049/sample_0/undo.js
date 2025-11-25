// undo.js - Undo system
import { gameState } from './globals.js';

export function saveStateForUndo() {
  if (gameState.undoStack.length >= 10) {
    gameState.undoStack.shift(); // Keep max 10 states
  }
  
  const state = {
    selectedPanel: gameState.selectedPanel,
    panels: gameState.panels.map(p => p.getState()),
    score: gameState.score,
    undosRemaining: gameState.undosRemaining
  };
  
  gameState.undoStack.push(state);
}

export function performUndo(p) {
  if (gameState.undosRemaining <= 0 || gameState.undoStack.length === 0) {
    return false;
  }
  
  const previousState = gameState.undoStack.pop();
  
  gameState.selectedPanel = previousState.selectedPanel;
  gameState.score = previousState.score;
  
  // Restore panel states
  for (let i = 0; i < gameState.panels.length; i++) {
    if (previousState.panels[i]) {
      gameState.panels[i].setState(previousState.panels[i]);
    }
  }
  
  gameState.undosRemaining--;
  
  p.logs.game_info.push({
    data: { event: "undo_used", undosRemaining: gameState.undosRemaining },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}