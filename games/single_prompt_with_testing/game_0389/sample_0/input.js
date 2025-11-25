// input.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }

  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    // Human control
    gameState.keys.left = p.keyIsDown(37);
    gameState.keys.right = p.keyIsDown(39);
    gameState.keys.up = p.keyIsDown(38);
    gameState.keys.down = p.keyIsDown(40);
    gameState.keys.space = p.keyIsDown(32);
    gameState.keys.shift = p.keyIsDown(16);
  } else {
    // Automated testing control
    const action = get_automated_testing_action(gameState);
    
    gameState.keys.left = action.left || false;
    gameState.keys.right = action.right || false;
    gameState.keys.up = action.up || false;
    gameState.keys.down = action.down || false;
    gameState.keys.space = action.space || false;
    gameState.keys.shift = action.shift || false;
    gameState.keys.z = action.z || false;
  }

  // Gravity gun active when shift is held
  gameState.gravityGunActive = gameState.keys.shift;
}

export function setupKeyHandlers(p) {
  p.keyPressed = function() {
    // Log input
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
        pauseGame(p);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        unpauseGame(p);
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }

    // Gameplay keys (only in PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 90) { // Z - Toggle gravity gun mode
        gameState.gravityGunMode = gameState.gravityGunMode === "ATTRACT" ? "REPEL" : "ATTRACT";
      }
    }
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "pause" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.noLoop();
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "unpause" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  p.loop();
}