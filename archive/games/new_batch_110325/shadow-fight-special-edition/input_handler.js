// input_handler.js - Handle keyboard and automated testing inputs

import {
  gameState,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { startGame, resetGame, togglePause, advanceToNextProvince } from './game_logic.js';

export function handleKeyPressed(p) {
  // Log the input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (gameState.showUpgradeMenu) {
      advanceToNextProvince(p);
    }
    return;
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      togglePause(p);
    }
    return;
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay inputs only during PLAYING phase
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;
  
  // Record input for combo system
  if (p.keyCode === KEY_UP) {
    gameState.player.recordInput('jump', p.frameCount);
    gameState.player.jump();
  }
  
  if (p.keyCode === KEY_DOWN) {
    gameState.player.recordInput('crouch', p.frameCount);
    gameState.player.crouch();
  }
  
  if (p.keyCode === KEY_Z) {
    gameState.player.recordInput('punch', p.frameCount);
    gameState.player.attack('punch', p);
  }
  
  if (p.keyCode === KEY_SPACE) {
    gameState.player.recordInput('kick', p.frameCount);
    gameState.player.attack('kick', p);
  }
}

export function handleKeyReleased(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;
  
  if (p.keyCode === KEY_DOWN) {
    gameState.player.standUp();
  }
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;
  
  // Continuous movement
  if (p.keyIsDown(KEY_LEFT)) {
    gameState.player.recordInput('left', p.frameCount);
    gameState.player.moveLeft();
  } else if (p.keyIsDown(KEY_RIGHT)) {
    gameState.player.recordInput('right', p.frameCount);
    gameState.player.moveRight();
  } else {
    gameState.player.stopMove();
  }
}

export function handleAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Reset movement
  if (gameState.player) {
    gameState.player.stopMove();
  }
  
  // Execute actions
  if (action.left && gameState.player) {
    gameState.player.recordInput('left', p.frameCount);
    gameState.player.moveLeft();
  }
  if (action.right && gameState.player) {
    gameState.player.recordInput('right', p.frameCount);
    gameState.player.moveRight();
  }
  if (action.up && gameState.player) {
    gameState.player.recordInput('jump', p.frameCount);
    gameState.player.jump();
  }
  if (action.down && gameState.player) {
    gameState.player.recordInput('crouch', p.frameCount);
    gameState.player.crouch();
  } else if (gameState.player) {
    gameState.player.standUp();
  }
  if (action.punch && gameState.player) {
    gameState.player.recordInput('punch', p.frameCount);
    gameState.player.attack('punch', p);
  }
  if (action.kick && gameState.player) {
    gameState.player.recordInput('kick', p.frameCount);
    gameState.player.attack('kick', p);
  }
}