// gameLogic.js - Core game logic

import { gameState, PHASE_PLAYING, PHASE_LEVEL_COMPLETE, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, LEVEL_CONFIGS } from './globals.js';
import { initializeBoard, clearMatches, applyGravity, hasMatches, swapGems } from './board.js';
import { calculateAIMove, activateAIBooster } from './ai.js';
import { activateAIBooster as executeAIBooster } from './booster.js';

export function startLevel(p, levelNum) {
  const config = LEVEL_CONFIGS[levelNum - 1];
  gameState.levelConfig = config;
  gameState.boardWidth = config.boardWidth;
  gameState.boardHeight = config.boardHeight;
  gameState.gridCellSize = Math.min(40, Math.floor(360 / Math.max(config.boardWidth, config.boardHeight)));
  gameState.turnsRemaining = config.turns;
  gameState.playerScore = 0;
  gameState.aiScore = 0;
  gameState.playerBoosterCharge = 0;
  gameState.aiBoosterCharge = 0;
  gameState.playerTurn = true;
  gameState.cursorX = Math.floor(config.boardWidth / 2);
  gameState.cursorY = Math.floor(config.boardHeight / 2);
  gameState.selectedGem = null;
  gameState.boosterActive = false;
  gameState.boosterState = null;
  gameState.animatingSwap = false;
  gameState.animatingClear = false;
  gameState.animatingFall = false;
  gameState.swapAnimations = [];
  gameState.clearAnimations = [];
  gameState.fallAnimations = [];
  gameState.aiThinking = false;
  gameState.currentComboMultiplier = 1;
  gameState.matchesThisTurn = 0;
  
  initializeBoard(p);
  
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: levelNum, levelName: config.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processTurnEnd(p) {
  // Process cascades
  gameState.currentComboMultiplier = 1;
  gameState.matchesThisTurn = 0;
  
  // Start clearing matches
  processCascade(p);
}

function processCascade(p) {
  if (hasMatches()) {
    const result = clearMatches(p);
    
    if (gameState.playerTurn) {
      gameState.playerScore += result.score;
      gameState.playerBoosterCharge = Math.min(gameState.playerBoosterMax, 
                                                gameState.playerBoosterCharge + result.blueStars);
      gameState.aiBoosterCharge = Math.min(gameState.aiBoosterMax,
                                            gameState.aiBoosterCharge + result.redCircles);
    } else {
      gameState.aiScore += result.score;
      gameState.aiBoosterCharge = Math.min(gameState.aiBoosterMax,
                                            gameState.aiBoosterCharge + result.redCircles);
      gameState.playerBoosterCharge = Math.min(gameState.playerBoosterMax,
                                                gameState.playerBoosterCharge + result.blueStars);
    }
    
    gameState.animatingClear = true;
  } else {
    // No more matches - end turn
    endTurn(p);
  }
}

export function endTurn(p) {
  gameState.turnsRemaining--;
  
  if (gameState.turnsRemaining <= 0) {
    // Game over
    if (gameState.playerScore > gameState.aiScore) {
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, winner: "player", 
                playerScore: gameState.playerScore, aiScore: gameState.aiScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, winner: "ai",
                playerScore: gameState.playerScore, aiScore: gameState.aiScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    // Switch turns
    gameState.playerTurn = !gameState.playerTurn;
    
    // AI turn
    if (!gameState.playerTurn) {
      gameState.aiThinking = true;
      gameState.aiThinkTimer = 30;
    }
  }
}

export function updateAnimations(p) {
  const animSpeed = 0.1;
  
  // Swap animations
  if (gameState.animatingSwap) {
    let allComplete = true;
    gameState.swapAnimations.forEach(anim => {
      anim.progress += animSpeed;
      if (anim.progress < 1) allComplete = false;
    });
    
    if (allComplete) {
      gameState.animatingSwap = false;
      gameState.swapAnimations = [];
      processTurnEnd(p);
    }
  }
  
  // Clear animations
  if (gameState.animatingClear) {
    let allComplete = true;
    gameState.clearAnimations.forEach(anim => {
      anim.progress += animSpeed * 1.5;
      if (anim.progress < 1) allComplete = false;
    });
    
    if (allComplete) {
      gameState.animatingClear = false;
      gameState.clearAnimations = [];
      
      // Apply gravity
      applyGravity();
      gameState.animatingFall = true;
    }
  }
  
  // Fall animations
  if (gameState.animatingFall) {
    let allComplete = true;
    gameState.fallAnimations.forEach(anim => {
      anim.progress += animSpeed;
      if (anim.progress < 1) allComplete = false;
    });
    
    if (allComplete) {
      gameState.animatingFall = false;
      gameState.fallAnimations = [];
      
      // Check for more matches
      if (hasMatches()) {
        processCascade(p);
      } else {
        endTurn(p);
      }
    }
  }
}

export function updateAI(p) {
  if (gameState.aiThinking) {
    gameState.aiThinkTimer--;
    
    if (gameState.aiThinkTimer <= 0) {
      gameState.aiThinking = false;
      
      // Check if AI should use booster
      if (gameState.aiBoosterCharge >= gameState.aiBoosterMax && Math.random() < 0.7) {
        executeAIBooster(p);
        endTurn(p);
      } else {
        // Make a move
        const move = calculateAIMove(p);
        
        if (move) {
          swapGems(move.x1, move.y1, move.x2, move.y2);
          gameState.animatingSwap = true;
          gameState.swapAnimations = [{
            x1: move.x1, y1: move.y1, x2: move.x2, y2: move.y2, progress: 0
          }];
        } else {
          // No valid moves - skip turn
          endTurn(p);
        }
      }
    }
  }
}