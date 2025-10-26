// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p) {
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    return { action: 'START_GAME' };
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      return { action: 'PAUSE' };
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      return { action: 'UNPAUSE' };
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      return { action: 'RESTART' };
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Arrow keys - Move cursor
    if (keyCode === 37) return { action: 'MOVE_LEFT' };
    if (keyCode === 38) return { action: 'MOVE_UP' };
    if (keyCode === 39) return { action: 'MOVE_RIGHT' };
    if (keyCode === 40) return { action: 'MOVE_DOWN' };
    
    // Space - Rotate clockwise
    if (keyCode === 32) return { action: 'ROTATE_CW' };
    
    // Shift - Rotate counter-clockwise
    if (keyCode === 16) return { action: 'ROTATE_CCW' };
    
    // Z - Start water flow
    if (keyCode === 90) return { action: 'START_WATER' };
  }
  
  // Level complete screen
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (keyCode === 90) return { action: 'NEXT_LEVEL' };
  }
  
  return null;
}

export function getTestAction(controlMode, p) {
  // Start game if in START phase
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount === 30) {
      return { action: 'START_GAME' };
    }
  }
  
  // Basic testing - just move cursor around
  if (controlMode === 'TEST_1') {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const frame = p.frameCount;
      if (frame % 20 === 0) {
        const actions = ['MOVE_RIGHT', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_UP'];
        return { action: actions[Math.floor(frame / 20) % 4] };
      }
    }
  }
  
  // Win test - solve level 1
  if (controlMode === 'TEST_2') {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const frame = p.frameCount;
      const sequence = [
        { frame: 60, action: 'MOVE_RIGHT' },
        { frame: 70, action: 'ROTATE_CW' },
        { frame: 80, action: 'MOVE_DOWN' },
        { frame: 90, action: 'ROTATE_CW' },
        { frame: 100, action: 'MOVE_DOWN' },
        { frame: 110, action: 'ROTATE_CW' },
        { frame: 120, action: 'MOVE_RIGHT' },
        { frame: 130, action: 'ROTATE_CW' },
        { frame: 140, action: 'MOVE_RIGHT' },
        { frame: 150, action: 'ROTATE_CW' },
        { frame: 200, action: 'START_WATER' }
      ];
      
      for (const seq of sequence) {
        if (frame === seq.frame) {
          return { action: seq.action };
        }
      }
    }
  }
  
  return null;
}