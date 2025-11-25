// input_handler.js - Input handling for human and automated testing

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN } from './globals.js';
import { handleInteraction, handleCooking } from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.controlMode === CONTROL_HUMAN) {
    handleHumanInput(p);
  } else {
    handleAutomatedInput(p);
  }
}

function handleHumanInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Movement
  if (p.keyIsDown(KEY_LEFT)) {
    gameState.player.moveLeft();
  }
  if (p.keyIsDown(KEY_RIGHT)) {
    gameState.player.moveRight();
  }
}

function handleAutomatedInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const action = get_automated_testing_action(gameState);
  
  if (action.left) {
    gameState.player.moveLeft();
  }
  if (action.right) {
    gameState.player.moveRight();
  }
  if (action.jump) {
    gameState.player.jump();
  }
  if (action.interact) {
    handleInteraction(p);
  }
  if (action.cook) {
    handleCooking(p);
  }
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
    
    // Phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === KEY_ESC) {
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
    
    if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: { phase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay controls (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_HUMAN) {
      if (p.keyCode === KEY_SPACE) {
        gameState.player.jump();
        handleInteraction(p);
      }
      if (p.keyCode === KEY_Z) {
        handleCooking(p);
      }
    }
  };
}