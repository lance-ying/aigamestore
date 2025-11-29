// controls.js - Input handling

import { gameState } from './globals.js';
import { rotatePiece, movePiece, hardDrop } from './tetromino.js';

export function handleGameplayInput(p) {
  if (gameState.controlMode !== "HUMAN") return;
  
  const currentTime = Date.now();
  
  // Rotation (immediate, no repeat)
  if (p.keyIsDown(38) || p.keyIsDown(87) || p.keyIsDown(32)) { // UP, W, SPACE
    if (!gameState.keysPressed.rotate) {
      rotatePiece();
      gameState.keysPressed.rotate = true;
    }
  } else {
    gameState.keysPressed.rotate = false;
  }
  
  // Hard drop (immediate, no repeat)
  if (p.keyIsDown(16)) { // SHIFT
    if (!gameState.keysPressed.hardDrop) {
      hardDrop();
      gameState.keysPressed.hardDrop = true;
    }
  } else {
    gameState.keysPressed.hardDrop = false;
  }
  
  // Horizontal movement with DAS (Delayed Auto Shift)
  const moveLeft = p.keyIsDown(37) || p.keyIsDown(65); // LEFT, A
  const moveRight = p.keyIsDown(39) || p.keyIsDown(68); // RIGHT, D
  
  if (moveLeft && !moveRight) {
    if (!gameState.keysPressed.left) {
      movePiece(-1, 0);
      gameState.keysPressed.left = true;
      gameState.lastMoveTime = currentTime;
    } else if (currentTime - gameState.lastMoveTime > gameState.moveRepeatDelay) {
      if (currentTime - gameState.lastMoveTime > gameState.moveRepeatDelay + gameState.moveRepeatRate) {
        movePiece(-1, 0);
        gameState.lastMoveTime = currentTime;
      }
    }
  } else {
    gameState.keysPressed.left = false;
  }
  
  if (moveRight && !moveLeft) {
    if (!gameState.keysPressed.right) {
      movePiece(1, 0);
      gameState.keysPressed.right = true;
      gameState.lastMoveTime = currentTime;
    } else if (currentTime - gameState.lastMoveTime > gameState.moveRepeatDelay) {
      if (currentTime - gameState.lastMoveTime > gameState.moveRepeatDelay + gameState.moveRepeatRate) {
        movePiece(1, 0);
        gameState.lastMoveTime = currentTime;
      }
    }
  } else {
    gameState.keysPressed.right = false;
  }
  
  // Soft drop
  gameState.softDrop = p.keyIsDown(40) || p.keyIsDown(83); // DOWN, S
}