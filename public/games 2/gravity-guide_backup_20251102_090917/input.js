// input.js - Input handling for both human and AI control

import { gameState, KEY_ENTER, KEY_ESC, KEY_R, KEY_LEFT, KEY_RIGHT, KEY_Q, KEY_E, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_LEVEL_COMPLETE, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { initLevel } from './levelManager.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase-specific controls
  if (keyCode === KEY_ENTER) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      startNextLevel(p);
    }
  } else if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      gameState.levelStartTime = Date.now() - (gameState.levelObjectives.timeLimit - gameState.levelObjectives.timeRemaining) * 1000;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === KEY_R) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_LEVEL_COMPLETE ||
        gameState.gamePhase === PHASE_PAUSED) {
      resetGame(p);
    }
  }

  // Gameplay controls - TAP BASED (single discrete action per keypress)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.player) {
    if (keyCode === KEY_LEFT) {
      gameState.player.moveLeft();
    } else if (keyCode === KEY_RIGHT) {
      gameState.player.moveRight();
    } else if (keyCode === KEY_Q) {
      gameState.player.tiltLeftAction();
    } else if (keyCode === KEY_E) {
      gameState.player.tiltRightAction();
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // No action needed for tap-based controls - keys don't need to be held
}

function startGame(p) {
  gameState.score = 0;
  gameState.currentLevel = 1;
  initLevel(1);
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startNextLevel(p) {
  gameState.currentLevel++;
  initLevel(gameState.currentLevel);
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.levelScore = 0;
  gameState.fallingObjects = [];
  gameState.obstacles = [];
  gameState.entities = [];
  gameState.player = null;
  gameState.targetZone = null;
  gameState.inputState = { left: false, right: false, tiltLeft: false, tiltRight: false };
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// AI Controller for automated testing - returns discrete action commands
export function getAIAction(testMode) {
  if (!gameState.player || !gameState.targetZone) {
    return { left: false, right: false };
  }

  const action = { left: false, right: false };

  if (testMode === 'TEST_1') {
    // Basic AI: Follow target zone
    const playerX = gameState.player.x;
    const targetX = gameState.targetZone.x;
    const threshold = 20;

    if (playerX < targetX - threshold) {
      action.right = true;
    } else if (playerX > targetX + threshold) {
      action.left = true;
    }
  } else if (testMode === 'TEST_2') {
    // Advanced AI: Predict object trajectory and position accordingly
    let targetX = gameState.targetZone.x;
    
    // Find closest falling object
    let closestObj = null;
    let closestDist = Infinity;
    
    for (const obj of gameState.fallingObjects) {
      if (obj.active && obj.y < CANVAS_HEIGHT - 100) {
        const dist = Math.abs(obj.x - gameState.player.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestObj = obj;
        }
      }
    }

    if (closestObj) {
      targetX = closestObj.x;
    }

    const playerX = gameState.player.x;
    const threshold = 15;

    if (playerX < targetX - threshold) {
      action.right = true;
    } else if (playerX > targetX + threshold) {
      action.left = true;
    }
  }

  return action;
}