// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.loop();
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay input
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentVignette) {
      gameState.currentVignette.handleInput(p, p.keyCode);
    }
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const action = get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    // Simulate key press
    p.keyCode = action.keyCode;
    
    if (gameState.currentVignette) {
      gameState.currentVignette.handleInput(p, action.keyCode);
    }
    
    // Log automated input
    p.logs.inputs.push({
      input_type: "automated",
      data: { keyCode: action.keyCode, mode: gameState.controlMode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentVignetteIndex = 0;
  gameState.completedVignettes = 0;
  
  if (gameState.storyBeats.length > 0) {
    gameState.currentVignette = gameState.storyBeats[0];
  }
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentVignetteIndex = 0;
  gameState.completedVignettes = 0;
  gameState.currentVignette = null;
  
  p.logs.game_info.push({
    data: { phase: "START", action: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.loop();
}