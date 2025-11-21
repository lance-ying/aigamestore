// testing.js - Automated testing modes

import { gameState } from './globals.js';
import { rotatePiece, movePiece, hardDrop } from './tetromino.js';

export function initializeTestMode() {
  gameState.testActions = [];
  gameState.testActionIndex = 0;
  
  if (gameState.controlMode === "TEST_1") {
    // Test basic movement, rotation, and soft drop
    gameState.testActions = [
      { frame: 60, action: 'moveLeft' },
      { frame: 70, action: 'moveLeft' },
      { frame: 90, action: 'rotate' },
      { frame: 110, action: 'moveRight' },
      { frame: 120, action: 'moveRight' },
      { frame: 130, action: 'moveRight' },
      { frame: 150, action: 'rotate' },
      { frame: 170, action: 'softDrop' },
      { frame: 200, action: 'stopSoftDrop' },
      { frame: 220, action: 'moveLeft' },
      { frame: 240, action: 'rotate' },
      { frame: 260, action: 'hardDrop' },
      { frame: 300, action: 'moveRight' },
      { frame: 320, action: 'rotate' },
      { frame: 340, action: 'softDrop' },
      { frame: 380, action: 'stopSoftDrop' },
      { frame: 420, action: 'moveLeft' },
      { frame: 440, action: 'moveLeft' },
      { frame: 460, action: 'hardDrop' }
    ];
  } else if (gameState.controlMode === "TEST_2") {
    // Test line clearing - create complete lines
    gameState.testActions = [
      // Fill bottom row strategically
      { frame: 30, action: 'moveLeft' },
      { frame: 40, action: 'moveLeft' },
      { frame: 50, action: 'moveLeft' },
      { frame: 60, action: 'hardDrop' },
      
      { frame: 90, action: 'moveLeft' },
      { frame: 100, action: 'moveLeft' },
      { frame: 110, action: 'hardDrop' },
      
      { frame: 140, action: 'moveLeft' },
      { frame: 150, action: 'hardDrop' },
      
      { frame: 180, action: 'hardDrop' },
      
      { frame: 210, action: 'moveRight' },
      { frame: 220, action: 'hardDrop' },
      
      { frame: 250, action: 'moveRight' },
      { frame: 260, action: 'moveRight' },
      { frame: 270, action: 'hardDrop' },
      
      { frame: 300, action: 'moveRight' },
      { frame: 310, action: 'moveRight' },
      { frame: 320, action: 'moveRight' },
      { frame: 330, action: 'hardDrop' },
      
      { frame: 360, action: 'rotate' },
      { frame: 370, action: 'moveRight' },
      { frame: 380, action: 'moveRight' },
      { frame: 390, action: 'moveRight' },
      { frame: 400, action: 'moveRight' },
      { frame: 410, action: 'hardDrop' }
    ];
  }
}

export function executeTestActions(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const currentFrame = p.frameCount;
  
  // Execute all actions for current frame
  while (gameState.testActionIndex < gameState.testActions.length) {
    const action = gameState.testActions[gameState.testActionIndex];
    
    if (action.frame > currentFrame) break;
    
    switch (action.action) {
      case 'moveLeft':
        movePiece(-1, 0);
        break;
      case 'moveRight':
        movePiece(1, 0);
        break;
      case 'rotate':
        rotatePiece();
        break;
      case 'hardDrop':
        hardDrop();
        break;
      case 'softDrop':
        gameState.softDrop = true;
        break;
      case 'stopSoftDrop':
        gameState.softDrop = false;
        break;
    }
    
    gameState.testActionIndex++;
  }
}