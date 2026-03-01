// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { startGame, selectChoice, navigateChoices } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    startGame();
    p.logs.game_info.push({
      data: { event: "game_started", phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { event: "game_paused", phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { event: "game_unpaused", phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // R - Restart (return to start screen)
  if (keyCode === 82) {
    gameState.gamePhase = GAME_PHASES.START;
    p.logs.game_info.push({
      data: { event: "game_restarted", phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Playing phase controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Prevent input while processing choice
    if (gameState.isProcessingChoice) {
      return;
    }
    
    // Arrow up
    if (keyCode === 38) {
      navigateChoices(-1);
    }
    // Arrow down
    if (keyCode === 40) {
      navigateChoices(1);
    }
    // Space - Select choice
    if (keyCode === 32) {
      selectChoice(gameState.selectedChoiceIndex);
    }
    // Z - Quick select first choice
    if (keyCode === 90) {
      selectChoice(0);
    }
  }
}

// processAutomatedInput function removed as it is no longer used.