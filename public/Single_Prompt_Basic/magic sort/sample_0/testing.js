// testing.js - Automated testing modes

import { gameState, CONTROL_MODES, GAME_PHASES } from './globals.js';
import { performPour } from './gameLogic.js';

export function getTestAction(p) {
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    return getTest1Action(p);
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    return getTest2Action(p);
  }
  return null;
}

function getTest1Action(p) {
  // Basic testing: Make random valid moves
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      return { type: "key", keyCode: 13 }; // ENTER to start
    }
    return null;
  }
  
  if (gameState.pouringAnimation) return null;
  
  if (p.frameCount % 60 === 0) {
    // Try random pours
    const validMoves = [];
    for (let i = 0; i < gameState.bottles.length; i++) {
      for (let j = 0; j < gameState.bottles.length; j++) {
        if (i !== j && gameState.bottles[i].canPourInto(gameState.bottles[j])) {
          validMoves.push({ source: i, dest: j });
        }
      }
    }
    
    if (validMoves.length > 0) {
      const move = validMoves[Math.floor(p.random() * validMoves.length)];
      performPour(move.source, move.dest);
    }
  }
  
  return null;
}

function getTest2Action(p) {
  // Win test: Use optimal strategy for level 1
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      return { type: "key", keyCode: 13 };
    }
    return null;
  }
  
  if (gameState.pouringAnimation) return null;
  
  if (gameState.currentLevel === 1 && p.frameCount % 40 === 0) {
    // Level 1 solution strategy
    const moves = [
      [0, 2], // Pour red from bottle 0 to empty bottle 2
      [0, 2], // Pour more red
      [1, 0], // Pour green from bottle 1 to bottle 0
      [1, 0], // Pour more green
      [2, 1], // Pour red from bottle 2 to bottle 1
      [2, 1]  // Pour more red
    ];
    
    const moveIndex = Math.floor(gameState.levelMovesMade);
    if (moveIndex < moves.length) {
      const [source, dest] = moves[moveIndex];
      if (source < gameState.bottles.length && dest < gameState.bottles.length) {
        performPour(source, dest);
      }
    }
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  if (action.type === "key") {
    // Simulate key press
    p.keyPressed = function() {};
    const event = { keyCode: action.keyCode };
    // This will be handled by the main key handler
  }
}