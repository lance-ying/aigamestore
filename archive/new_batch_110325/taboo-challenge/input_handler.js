// input_handler.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_LEFT, KEY_RIGHT, MODE_HUMAN } from './globals.js';
import { initializeGame, markCardCorrect, markCardSkip, markCardIncorrect, handleMenuNavigation } from './game_logic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    initializeGame(p);
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      gameState.roundStartTime += (Date.now() - gameState.pauseTime);
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, action: "resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    resetGame();
    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Menu navigation
  if (gameState.gamePhase === PHASE_START) {
    if (keyCode === KEY_LEFT) {
      handleMenuNavigation("left");
    } else if (keyCode === KEY_RIGHT) {
      handleMenuNavigation("right");
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (keyCode === KEY_SPACE) {
      // Mark as correct or skip (we'll use correct for simplicity)
      markCardCorrect(p);
    } else if (keyCode === KEY_SHIFT) {
      // Mark as incorrect (taboo word used)
      markCardIncorrect(p);
    }
  }
}

export function resetGame() {
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.currentRound = 0;
  gameState.roundScores = [];
  gameState.cardsCompleted = 0;
  gameState.cardsSkipped = 0;
  gameState.cardsIncorrect = 0;
  gameState.menuSelection = 0;
  gameState.entities = [];
  gameState.currentCard = null;
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = action.key;
  handleKeyPressed(p);
}