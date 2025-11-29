import { gameState, GAME_PHASES } from './globals.js';
import { checkDifferenceClick, useHint } from './gameLogic.js';

export function runTestController(p) {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  if (gameState.controlMode === "TEST_1") {
    testBasicGameplay(p);
  } else if (gameState.controlMode === "TEST_2") {
    testWinCondition(p);
  }
}

function testBasicGameplay(p) {
  // Auto-start game
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount === 10) {
    p.keyPressed = () => {};
    p.key = 'Enter';
    p.keyCode = 13;
    const event = { key: 'Enter', keyCode: 13 };
    window.gameInstance._onkeydown(event);
  }
  
  // Try some incorrect clicks and hints during gameplay
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (p.frameCount % 60 === 30) {
      // Click random location (likely incorrect)
      const randomX = 50 + Math.random() * 200;
      const randomY = 100 + Math.random() * 250;
      checkDifferenceClick(p, randomX, randomY);
    }
    
    if (p.frameCount % 180 === 90 && gameState.hintsRemaining > 0) {
      // Use a hint
      useHint(p);
    }
  }
}

function testWinCondition(p) {
  // Auto-start and auto-complete by finding all differences
  if (gameState.gamePhase === GAME_PHASES.START && p.frameCount === 10) {
    p.key = 'Enter';
    p.keyCode = 13;
    const event = { key: 'Enter', keyCode: 13 };
    window.gameInstance._onkeydown(event);
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Find all unfound differences automatically
    if (p.frameCount % 30 === 0) {
      for (let i = 0; i < gameState.differences.length; i++) {
        const diff = gameState.differences[i];
        if (!diff.isFound) {
          // Click on this difference
          const imageY = 45;
          const leftX = 10;
          checkDifferenceClick(p, leftX + diff.x, imageY + diff.y);
          break; // One per cycle
        }
      }
    }
  }
  
  // Auto-progress through level complete screens
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE && p.frameCount % 60 === 30) {
    p.key = 'Enter';
    p.keyCode = 13;
    const event = { key: 'Enter', keyCode: 13 };
    window.gameInstance._onkeydown(event);
  }
}