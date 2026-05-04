// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { initializeLevel } from './gameLogic.js';
import { handleClick, cleanNearestDirtyTable } from './gameLogic.js';

export function handleKeyPressed(p) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeLevel(1);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: "PLAYING", level: 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    gameState.gamePhase = GAME_PHASES.START;
    if (p.logs) {
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Arrow keys for camera scroll
    if (p.keyCode === 37 || p.keyCode === 65) { // Left/A
      gameState.cameraX = Math.max(0, gameState.cameraX - 10);
    }
    if (p.keyCode === 39 || p.keyCode === 68) { // Right/D
      gameState.cameraX = Math.min(200, gameState.cameraX + 10);
    }
    if (p.keyCode === 38 || p.keyCode === 87) { // Up/W
      gameState.cameraY = Math.max(0, gameState.cameraY - 10);
    }
    if (p.keyCode === 40 || p.keyCode === 83) { // Down/S
      gameState.cameraY = Math.min(200, gameState.cameraY + 10);
    }
    
    // Space - Pause
    if (p.keyCode === 32) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      if (p.logs) {
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export function handleMousePressed(p) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "mousePressed",
      data: { mouseX: p.mouseX, mouseY: p.mouseY },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleClick(p, p.mouseX, p.mouseY);
  }
}