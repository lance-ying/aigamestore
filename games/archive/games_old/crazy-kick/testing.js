// testing.js - Automated testing functionality

import { gameState, GAME_PHASES } from './globals.js';
import { handleKeyPressed } from './input.js';

export function handleTestingMode(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.controlMode === 'TEST_1') {
    testBasicMovement(p);
  } else if (gameState.controlMode === 'TEST_2') {
    testWinScenario(p);
  }
}

function testBasicMovement(p) {
  // Auto-start the game
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      handleKeyPressed(p);
    }
    return;
  }
  
  // Auto-advance levels
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (p.frameCount % 60 === 0) {
      p.keyCode = 13;
      p.key = 'Enter';
      handleKeyPressed(p);
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    // Simple movement towards goal
    const targetX = 520;
    const targetY = 200;
    
    if (gameState.player.x < targetX) {
      p.keyCode = 39; // RIGHT
      p.keyIsDown = (k) => k === 39;
    } else if (gameState.player.y < targetY - 10) {
      p.keyCode = 40; // DOWN
      p.keyIsDown = (k) => k === 40;
    } else if (gameState.player.y > targetY + 10) {
      p.keyCode = 38; // UP
      p.keyIsDown = (k) => k === 38;
    }
  }
}

function testWinScenario(p) {
  // Auto-start the game
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      handleKeyPressed(p);
    }
    return;
  }
  
  // Auto-advance levels
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (p.frameCount % 30 === 0) {
      p.keyCode = 13;
      p.key = 'Enter';
      handleKeyPressed(p);
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    // Aggressive movement towards goal
    if (gameState.player.x < 520) {
      p.keyCode = 39;
      p.keyIsDown = (k) => k === 39;
      
      // Use dash frequently
      if (p.frameCount % 60 === 0) {
        p.keyCode = 32;
        handleKeyPressed(p);
      }
    } else {
      // Move into goal area
      const goalY = 200;
      if (Math.abs(gameState.player.y - goalY) > 5) {
        if (gameState.player.y < goalY) {
          p.keyCode = 40;
          p.keyIsDown = (k) => k === 40;
        } else {
          p.keyCode = 38;
          p.keyIsDown = (k) => k === 38;
        }
      }
    }
  }
}