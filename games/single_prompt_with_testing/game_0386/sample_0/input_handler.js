// input_handler.js - Handle keyboard inputs

import { gameState, GAME_PHASES } from './globals.js';
import { moveCursor, selectNode, undoLastPath, nextLevel, initializeLevel } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode, generator) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      const nodes = generator.generateLevel(gameState.currentLevel);
      initializeLevel(nodes);
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      nextLevel(generator);
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.currentLevel = 0;
      gameState.score = 0;
      gameState.levelsCompleted = 0;
      gameState.totalMoves = 0;
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 37) { // LEFT
    moveCursor('LEFT');
  } else if (keyCode === 38) { // UP
    moveCursor('UP');
  } else if (keyCode === 39) { // RIGHT
    moveCursor('RIGHT');
  } else if (keyCode === 40) { // DOWN
    moveCursor('DOWN');
  } else if (keyCode === 32) { // SPACE
    selectNode();
  } else if (keyCode === 90) { // Z
    undoLastPath();
  }
}

export function processAutomatedAction(p, action, generator) {
  if (!action) return;
  
  // Process the action as if it were a key press
  handleKeyPressed(p, action.key, action.keyCode, generator);
}