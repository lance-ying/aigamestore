// testController.js - Automated testing controllers

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS } from './globals.js';
import { handleKeyPressed } from './input.js';

export function updateTestController(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    testBasicPlay(p);
  } else if (gameState.controlMode === "TEST_2") {
    testWinScenario(p);
  }
}

function testBasicPlay(p) {
  // Basic testing: Start game, roll a few times, select some dice
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      handleKeyPressed(p, '', 13); // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentPlayer === PLAYERS.PLAYER) {
      if (gameState.turnPhase === TURN_PHASES.WAITING_TO_ROLL) {
        if (p.frameCount % 120 === 0) {
          handleKeyPressed(p, ' ', 32); // SPACE
        }
      } else if (gameState.turnPhase === TURN_PHASES.SELECTING) {
        // Auto-select first available scoring die
        if (p.frameCount % 60 === 0) {
          const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
          if (availableDice.length > 0) {
            handleKeyPressed(p, '', 16); // SHIFT to select
          }
        }
        
        // Try to bank if possible
        if (gameState.canBank && p.frameCount % 180 === 90) {
          handleKeyPressed(p, 'b', 66); // B
        }
      }
    }
  }
}

function testWinScenario(p) {
  // Accelerated win scenario for testing
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      handleKeyPressed(p, '', 13); // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentPlayer === PLAYERS.PLAYER) {
      // Fast-forward player score for testing
      if (p.frameCount % 300 === 0 && gameState.playerScoreTotal < gameState.targetScore) {
        gameState.playerScoreTotal += 2000;
      }
      
      if (gameState.turnPhase === TURN_PHASES.WAITING_TO_ROLL) {
        if (p.frameCount % 120 === 0) {
          handleKeyPressed(p, ' ', 32); // SPACE
        }
      } else if (gameState.turnPhase === TURN_PHASES.SELECTING) {
        if (p.frameCount % 60 === 0) {
          const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
          if (availableDice.length > 0) {
            handleKeyPressed(p, '', 16); // SHIFT
          }
        }
        
        if (gameState.canBank && p.frameCount % 120 === 60) {
          handleKeyPressed(p, 'b', 66); // B
        }
      }
    }
  }
}