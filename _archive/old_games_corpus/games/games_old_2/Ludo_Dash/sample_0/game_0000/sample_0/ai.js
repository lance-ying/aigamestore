// ai.js - AI logic

import { gameState, LEVEL_CONFIGS, PLAYERS } from './globals.js';

export function getAIDifficulty() {
  return LEVEL_CONFIGS[gameState.currentLevel].aiDifficulty;
}

export function makeAIDecision() {
  const aiPieces = gameState.aiPieces;
  const eligiblePieces = aiPieces.filter(piece => 
    piece.canMove(gameState.diceValue, gameState.aiHomeEntryIndex)
  );
  
  if (eligiblePieces.length === 0) return null;
  if (eligiblePieces.length === 1) return eligiblePieces[0];
  
  const difficulty = getAIDifficulty();
  
  if (difficulty === "BASIC") {
    return eligiblePieces[Math.floor(Math.random() * eligiblePieces.length)];
  }
  
  // Intermediate and Advanced logic
  // Priority 1: Cut player pieces
  const cuttingPieces = eligiblePieces.filter(piece => {
    const targetIndex = getTargetIndex(piece);
    return canCutPlayer(targetIndex);
  });
  
  if (cuttingPieces.length > 0) {
    return cuttingPieces[0];
  }
  
  // Priority 2: Bring out pieces with a 6
  if (gameState.diceValue === 6) {
    const homeBasePieces = eligiblePieces.filter(p => p.inHomeBase);
    if (homeBasePieces.length > 0) {
      return homeBasePieces[0];
    }
  }
  
  // Priority 3: Move piece closest to home
  if (difficulty === "ADVANCED") {
    const sorted = [...eligiblePieces].sort((a, b) => {
      const aProgress = getPieceProgress(a);
      const bProgress = getPieceProgress(b);
      return bProgress - aProgress;
    });
    return sorted[0];
  }
  
  return eligiblePieces[0];
}

function getTargetIndex(piece) {
  if (piece.inHomeBase) {
    return gameState.aiHomeEntryIndex;
  }
  if (piece.inHomeColumn) {
    return -1;
  }
  return (piece.currentPathIndex + gameState.diceValue) % gameState.boardPath.length;
}

function canCutPlayer(targetIndex) {
  if (targetIndex === -1) return false;
  if (gameState.safeSpots.includes(targetIndex)) return false;
  
  return gameState.playerPieces.some(p => 
    !p.inHomeBase && 
    !p.inHomeColumn && 
    !p.isFinished && 
    p.currentPathIndex === targetIndex
  );
}

function getPieceProgress(piece) {
  if (piece.isFinished) return 1000;
  if (piece.inHomeColumn) return 500 + piece.homeColumnSteps * 100;
  if (piece.inHomeBase) return 0;
  
  const distanceToHome = (gameState.aiHomeEntryIndex - piece.currentPathIndex + gameState.boardPath.length) % gameState.boardPath.length;
  return 100 + (gameState.boardPath.length - distanceToHome);
}