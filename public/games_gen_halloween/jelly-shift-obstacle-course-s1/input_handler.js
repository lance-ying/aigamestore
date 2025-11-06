// input_handler.js - Input handling
import { 
  gameState, 
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  SHAPE_TALL, SHAPE_SHORT
} from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
    if (keyCode === 38) { // UP
      gameState.player.setShape(SHAPE_TALL);
    } else if (keyCode === 40) { // DOWN
      gameState.player.setShape(SHAPE_SHORT);
    }
  }
}

export function handleAutomatedInput(p, action) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (action && action.keyCode) {
    // Log automated input
    p.logs.inputs.push({
      input_type: "automated",
      data: { keyCode: action.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (action.keyCode === 38) { // UP
      gameState.player.setShape(SHAPE_TALL);
    } else if (action.keyCode === 40) { // DOWN
      gameState.player.setShape(SHAPE_SHORT);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.framesSinceStart = 0;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.level = 1;
  gameState.distance = 0;
  gameState.combo = 0;
  gameState.jellyFeverActive = false;
  gameState.jellyFeverTimer = 0;
  gameState.currentSpeed = gameState.baseSpeed;
  gameState.cameraOffsetX = 0;
  gameState.backgroundOffset = 0;
  gameState.obstaclesPassed = 0;
  gameState.framesSinceStart = 0;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}