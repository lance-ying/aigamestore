// input.js - Input handling

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS } from './globals.js';
import { rollDice, bankScore, selectDice, deselectAllDice } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls - only during PLAYING phase
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.currentPlayer !== PLAYERS.PLAYER) return;
  
  // Space - Roll dice
  if (keyCode === 32) {
    if (gameState.turnPhase === TURN_PHASES.WAITING_TO_ROLL || 
        (gameState.turnPhase === TURN_PHASES.SELECTING && gameState.canRollAgain)) {
      rollDice(p);
    }
    return;
  }
  
  // B - Bank score
  if (keyCode === 66) {
    if (gameState.turnPhase === TURN_PHASES.SELECTING && gameState.canBank) {
      bankScore(p);
    }
    return;
  }
  
  // Z - Deselect all
  if (keyCode === 90) {
    if (gameState.turnPhase === TURN_PHASES.SELECTING) {
      deselectAllDice();
    }
    return;
  }
  
  // Arrow keys - Navigate and select dice
  if (gameState.turnPhase === TURN_PHASES.SELECTING) {
    const availableDice = gameState.dice.filter((d, i) => !gameState.selectedDiceIndices.includes(i));
    
    if (keyCode === 37) { // Left
      gameState.selectedDieIndex = Math.max(0, gameState.selectedDieIndex - 1);
    } else if (keyCode === 39) { // Right
      gameState.selectedDieIndex = Math.min(availableDice.length - 1, gameState.selectedDieIndex + 1);
    } else if (keyCode === 38) { // Up
      gameState.selectedDieIndex = Math.max(0, gameState.selectedDieIndex - 3);
    } else if (keyCode === 40) { // Down
      gameState.selectedDieIndex = Math.min(availableDice.length - 1, gameState.selectedDieIndex + 3);
    } else if (keyCode === 16) { // Shift - Select/deselect current die
      if (availableDice.length > 0) {
        const actualIndex = gameState.dice.indexOf(availableDice[gameState.selectedDieIndex]);
        if (actualIndex >= 0) {
          selectDice(actualIndex);
        }
      }
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.turnPhase = TURN_PHASES.WAITING_TO_ROLL;
  gameState.currentPlayer = PLAYERS.PLAYER;
  gameState.playerScoreTotal = 0;
  gameState.aiScoreTotal = 0;
  gameState.currentTurnScore = 0;
  gameState.level = 1;
  gameState.targetScore = 5000;
  gameState.selectedDiceIndices = [];
  gameState.remainingDiceToRoll = 6;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.turnPhase = TURN_PHASES.WAITING_TO_ROLL;
  gameState.playerScoreTotal = 0;
  gameState.aiScoreTotal = 0;
  gameState.currentTurnScore = 0;
  gameState.level = 1;
  gameState.targetScore = 5000;
  gameState.selectedDiceIndices = [];
  gameState.remainingDiceToRoll = 6;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}