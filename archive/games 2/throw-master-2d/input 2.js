// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { throwKnife, initializeLevel } from './gameLogic.js';

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    // Log the input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }

    // Gameplay controls (only in PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      handleGameplayInput(p);
    }
  };
}

function handleGameplayInput(p) {
  const rotationStep = 5 * (Math.PI / 180); // 5 degrees in radians

  if (p.keyCode === 37) { // Arrow Left
    gameState.playerAngle -= rotationStep;
  } else if (p.keyCode === 39) { // Arrow Right
    gameState.playerAngle += rotationStep;
  } else if (p.keyCode === 32) { // Space
    throwKnife(p);
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  initializeLevel(p, 1);
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.knives = [];
  gameState.enemies = [];
  gameState.barrels = [];
  gameState.boxes = [];
  gameState.hostages = [];
  gameState.entities = [];
  gameState.showLevelComplete = false;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}