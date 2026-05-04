// controls.js - Input handling and control modes

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS } from './globals.js';
import { rollDice, confirmMove, resetGame, startGame, advanceLevel } from './gameLogic.js';

export function handleKeyPress(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only during PLAYING phase and PLAYER's turn)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.currentPlayer !== PLAYERS.PLAYER) return;
  
  if (keyCode === 32) { // SPACE
    if (gameState.currentTurnPhase === TURN_PHASES.ROLL_DICE) {
      rollDice(p);
    } else if (gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE) {
      confirmMove(p);
    }
  }
  
  if (gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE) {
    if (keyCode === 38) { // ARROW UP
      gameState.selectedPieceIndex = 
        (gameState.selectedPieceIndex - 1 + gameState.eligiblePieces.length) % 
        gameState.eligiblePieces.length;
    } else if (keyCode === 40) { // ARROW DOWN
      gameState.selectedPieceIndex = 
        (gameState.selectedPieceIndex + 1) % gameState.eligiblePieces.length;
    }
  }
}

// Automated testing control modes
export function getTestingAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic testing: always roll dice and make random moves
  if (gameState.gamePhase === GAME_PHASES.START) {
    return 13; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    return 82; // R to restart
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && 
      gameState.currentPlayer === PLAYERS.PLAYER) {
    if (gameState.currentTurnPhase === TURN_PHASES.ROLL_DICE) {
      return 32; // SPACE to roll
    } else if (gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE) {
      return 32; // SPACE to confirm first piece
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Win test: strategic moves to try to win quickly
  if (gameState.gamePhase === GAME_PHASES.START) {
    return 13;
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (gameState.currentLevel < 3) {
      return 82; // Continue to next level
    }
    return null;
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    return 82;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && 
      gameState.currentPlayer === PLAYERS.PLAYER) {
    if (gameState.currentTurnPhase === TURN_PHASES.ROLL_DICE) {
      return 32;
    } else if (gameState.currentTurnPhase === TURN_PHASES.SELECT_PIECE) {
      // Select piece closest to home
      let bestIndex = 0;
      let bestProgress = -1;
      
      gameState.eligiblePieces.forEach((piece, index) => {
        let progress = 0;
        if (piece.isFinished) progress = 1000;
        else if (piece.inHomeColumn) progress = 500 + piece.homeColumnSteps * 100;
        else if (!piece.inHomeBase) progress = 100 + piece.currentPathIndex;
        
        if (progress > bestProgress) {
          bestProgress = progress;
          bestIndex = index;
        }
      });
      
      if (bestIndex !== gameState.selectedPieceIndex) {
        return 40; // Arrow down to cycle
      } else {
        return 32; // Confirm
      }
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (action) {
    handleKeyPress(p, action);
  }
}