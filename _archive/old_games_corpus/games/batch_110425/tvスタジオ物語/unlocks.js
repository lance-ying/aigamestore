// unlocks.js - Content unlock system
import { gameState, GENRES, THEMES, SET_PIECES } from './globals.js';

export function unlockContent(type, id) {
  let content = null;
  let cost = 0;
  
  if (type === "genre") {
    content = GENRES.find(g => g.id === id);
  } else if (type === "theme") {
    content = THEMES.find(t => t.id === id);
  } else if (type === "setPiece") {
    content = SET_PIECES.find(s => s.id === id);
  }
  
  if (!content || content.unlocked) {
    return false;
  }
  
  cost = content.researchCost || 0;
  
  if (gameState.researchPoints >= cost) {
    gameState.researchPoints -= cost;
    content.unlocked = true;
    return true;
  }
  
  return false;
}

export function getAvailableUnlocks() {
  const unlocks = [];
  
  GENRES.forEach(genre => {
    if (!genre.unlocked && gameState.researchPoints >= genre.researchCost) {
      unlocks.push({ type: "genre", content: genre });
    }
  });
  
  THEMES.forEach(theme => {
    if (!theme.unlocked && gameState.researchPoints >= theme.researchCost) {
      unlocks.push({ type: "theme", content: theme });
    }
  });
  
  SET_PIECES.forEach(piece => {
    if (!piece.unlocked && gameState.researchPoints >= piece.cost) {
      unlocks.push({ type: "setPiece", content: piece });
    }
  });
  
  return unlocks;
}

export function autoUnlockBasedOnProgress() {
  // Auto-unlock content based on progress milestones
  
  // Unlock variety at 2 programs
  if (gameState.programsProduced >= 2) {
    const variety = GENRES.find(g => g.id === "variety");
    if (variety && !variety.unlocked && gameState.researchPoints >= variety.researchCost) {
      unlockContent("genre", "variety");
    }
  }
  
  // Unlock romance theme at 3 programs
  if (gameState.programsProduced >= 3) {
    const romance = THEMES.find(t => t.id === "romance");
    if (romance && !romance.unlocked && gameState.researchPoints >= romance.researchCost) {
      unlockContent("theme", "romance");
    }
  }
  
  // Unlock set pieces
  if (gameState.programsProduced >= 4) {
    const camera = SET_PIECES.find(s => s.id === "camera");
    if (camera && !camera.unlocked && gameState.researchPoints >= camera.cost) {
      unlockContent("setPiece", "camera");
    }
  }
}