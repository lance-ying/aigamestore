// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.PLAYING ||
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      restartGame(p);
    }
  }

  // Gameplay controls (only in PLAYING phase for HUMAN mode)
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    if (p.keyCode === 32) { // SPACE - Block
      if (gameState.player) {
        gameState.player.startBlock();
      }
    } else if (p.keyCode === 90) { // Z - Attack
      if (gameState.player) {
        gameState.player.attack();
      }
    }
  }
}

export function handleKeyReleased(p) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    if (p.keyCode === 32) { // SPACE - Stop blocking
      if (gameState.player) {
        gameState.player.stopBlock();
      }
    }
  }
}

export function processMovementInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;

  if (gameState.controlMode === "HUMAN") {
    const isSprinting = p.keyIsDown(16); // SHIFT
    
    if (p.keyIsDown(37)) { // LEFT
      gameState.player.moveLeft(isSprinting);
    } else if (p.keyIsDown(39)) { // RIGHT
      gameState.player.moveRight(isSprinting);
    }

    if (p.keyIsDown(38)) { // UP
      gameState.player.jump();
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.noLoop();
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_paused" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.loop();
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_resumed" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.loop();
}