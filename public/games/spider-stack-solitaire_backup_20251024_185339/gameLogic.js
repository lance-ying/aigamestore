import { gameState, LEVEL_CONFIGS } from './globals.js';
import { checkForCompleteSequences } from './tableau.js';

export function updateGameLogic(p) {
  if (gameState.gamePhase === "PLAYING" && !gameState.isPaused) {
    checkWinCondition();
    checkLoseCondition();
    
    checkForCompleteSequences();
  }
}

function checkWinCondition() {
  if (gameState.foundations.length === 8) {
    gameState.gamePhase = "GAME_OVER";
    
    const timeBonus = Math.max(0, 1000 - Math.floor((Date.now() - gameState.startTime) / 1000));
    const dealBonus = gameState.stockDealsRemaining * 50;
    gameState.score += timeBonus + dealBonus;
    
    if (gameState.currentLevelIdx < 3) {
      gameState.currentLevelIdx++;
      gameState.gameDifficultySuits = LEVEL_CONFIGS[gameState.currentLevelIdx].suits;
    }
  }
}

function checkLoseCondition() {
  if (gameState.stockDealsRemaining > 0) return;
  
  let hasValidMove = false;
  
  for (let fromCol = 0; fromCol < 10; fromCol++) {
    const column = gameState.tableau[fromCol];
    for (let i = 0; i < column.length; i++) {
      if (!column[i].isFaceUp) continue;
      
      const { getMovableSequence, canMoveSequence } = require('./tableau.js');
      const sequence = getMovableSequence(fromCol, i);
      
      for (let toCol = 0; toCol < 10; toCol++) {
        if (toCol === fromCol) continue;
        if (canMoveSequence(sequence, toCol)) {
          hasValidMove = true;
          break;
        }
      }
      if (hasValidMove) break;
    }
    if (hasValidMove) break;
  }
  
  if (!hasValidMove) {
    gameState.gamePhase = "GAME_OVER";
  }
}

export function logPlayerInfo(p) {
  if (gameState.gamePhase === "PLAYING" && p.frameCount % 10 === 0) {
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: 0,
      game_y: 0,
      framecount: p.frameCount
    });
  }
}