// controls.js - Input handling and automated testing

import { gameState, GAME_PHASES } from './globals.js';
import { DrawnLine } from './entities.js';

export function handleHumanInput(p) {
  const speed = 3;
  
  // Move cursor with arrow keys
  if (p.keyIsDown(37)) { // LEFT
    gameState.cursorX = Math.max(10, gameState.cursorX - speed);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.cursorX = Math.min(590, gameState.cursorX + speed);
  }
  if (p.keyIsDown(38)) { // UP
    gameState.cursorY = Math.max(50, gameState.cursorY - speed);
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.cursorY = Math.min(390, gameState.cursorY + speed);
  }
}

export function handleSpacePress(p) {
  if (gameState.controlMode !== 'HUMAN') return;
  
  if (!gameState.drawingLine) {
    // Start drawing line
    gameState.drawingLine = true;
    gameState.lineStartX = gameState.cursorX;
    gameState.lineStartY = gameState.cursorY;
  } else {
    // Complete line
    const dx = gameState.cursorX - gameState.lineStartX;
    const dy = gameState.cursorY - gameState.lineStartY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 10 && gameState.lineDrawingUsed + length <= gameState.lineDrawingBudget) {
      const line = new DrawnLine(
        p,
        gameState.lineStartX,
        gameState.lineStartY,
        gameState.cursorX,
        gameState.cursorY
      );
      gameState.drawnLines.push(line);
      gameState.lineDrawingUsed += length;
    }
    
    gameState.drawingLine = false;
  }
}

export function clearAllLines() {
  gameState.drawnLines.forEach(line => line.destroy());
  gameState.drawnLines = [];
  gameState.lineDrawingUsed = 0;
  gameState.drawingLine = false;
}

// Automated test strategies
export function setupTestMode(mode) {
  gameState.testActions = [];
  gameState.testActionIndex = 0;
  gameState.testStartFrame = 0;
  
  if (mode === 'TEST_1') {
    // Test basic physics: draw a diagonal line
    gameState.testActions = [
      { frame: 30, action: 'drawLine', x1: 200, y1: 150, x2: 400, y2: 250 },
      { frame: 240, action: 'wait' }
    ];
  } else if (mode === 'TEST_2') {
    // Test win condition: optimal lines to fill cups
    gameState.testActions = [
      { frame: 20, action: 'drawLine', x1: 280, y1: 100, x2: 250, y2: 200 },
      { frame: 30, action: 'drawLine', x1: 250, y1: 200, x2: 200, y2: 280 },
      { frame: 40, action: 'drawLine', x1: 320, y1: 100, x2: 350, y2: 200 },
      { frame: 50, action: 'drawLine', x1: 350, y1: 200, x2: 400, y2: 280 },
      { frame: 600, action: 'wait' }
    ];
  }
}

export function executeTestActions(p) {
  if (gameState.testActions.length === 0) return;
  if (gameState.testStartFrame === 0) {
    gameState.testStartFrame = p.frameCount;
  }
  
  const currentFrame = p.frameCount - gameState.testStartFrame;
  
  // Execute actions for current frame
  gameState.testActions.forEach((testAction, index) => {
    if (currentFrame === testAction.frame && index >= gameState.testActionIndex) {
      if (testAction.action === 'drawLine') {
        const length = Math.sqrt(
          Math.pow(testAction.x2 - testAction.x1, 2) +
          Math.pow(testAction.y2 - testAction.y1, 2)
        );
        
        if (gameState.lineDrawingUsed + length <= gameState.lineDrawingBudget) {
          const line = new DrawnLine(
            p,
            testAction.x1,
            testAction.y1,
            testAction.x2,
            testAction.y2
          );
          gameState.drawnLines.push(line);
          gameState.lineDrawingUsed += length;
        }
      }
      gameState.testActionIndex = index + 1;
    }
  });
}