// input_handler.js
import { gameState, GAME_PHASES } from './globals.js';
import { initializeGame, startInvestigation } from './game_logic.js';

export const keys = {};

export function handleKeyPressed(p, key, keyCode) {
  keys[keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions (HUMAN mode only)
  if (gameState.controlMode === "HUMAN") {
    if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      initializeGame(p);
      p.logs.game_info.push({
        data: { phase: "INVESTIGATION_START", chapter: gameState.currentChapter },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING || 
          gameState.gamePhase === GAME_PHASES.INVESTIGATION ||
          gameState.gamePhase === GAME_PHASES.CLASS_TRIAL) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        const prevPhase = gameState.currentChapter > 0 ? 
          (gameState.collectedBullets.length === gameState.evidencePoints.length ? 
            GAME_PHASES.CLASS_TRIAL : GAME_PHASES.INVESTIGATION) : 
          GAME_PHASES.START;
        gameState.gamePhase = prevPhase;
      }
    }
    
    if (keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                            gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      restartGame(p);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  keys[keyCode] = false;
}

export function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentChapter = 0;
  gameState.score = 0;
  gameState.entities = [];
  gameState.player = null;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  
  p.logs.game_info.push({
    data: { phase: "RESTART" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Clear all keys first
  Object.keys(keys).forEach(k => keys[k] = false);
  
  // Set new keys based on action
  if (action.keys) {
    action.keys.forEach(keyCode => {
      keys[keyCode] = true;
    });
  }
  
  // Handle special actions
  if (action.space) {
    keys[32] = true;
  }
  if (action.fire) {
    keys[90] = true;
  }
  if (action.slowMo) {
    keys[16] = true;
  }
}