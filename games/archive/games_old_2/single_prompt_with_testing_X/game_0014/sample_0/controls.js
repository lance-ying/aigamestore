// controls.js
import { gameState, PHASE_PLAYING } from './globals.js';
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;

export function handlePlayerControls(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.monsterActivated) return;
  if (gameState.movesRemaining <= 0) return;
  
  const now = Date.now();
  if (now - gameState.lastMoveTime < gameState.moveDelay) return;
  
  if (!gameState.selectedBlock) return;
  
  const moveAmount = 5;
  let moved = false;
  
  // Arrow keys or WASD
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // Left
    gameState.selectedBlock.move(-moveAmount, 0);
    moved = true;
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // Right
    gameState.selectedBlock.move(moveAmount, 0);
    moved = true;
  }
  if (p.keyIsDown(38) || p.keyIsDown(87)) { // Up
    gameState.selectedBlock.move(0, -moveAmount);
    moved = true;
  }
  if (p.keyIsDown(40) || p.keyIsDown(83)) { // Down
    gameState.selectedBlock.move(0, moveAmount);
    moved = true;
  }
  
  if (moved) {
    gameState.movesRemaining--;
    gameState.lastMoveTime = now;
    
    p.logs.player_info.push({
      screen_x: gameState.selectedBlock.body.position.x,
      screen_y: gameState.selectedBlock.body.position.y,
      game_x: gameState.selectedBlock.body.position.x,
      game_y: gameState.selectedBlock.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleTestMode(p) {
  const mode = gameState.controlMode;
  
  if (mode === "TEST_1") {
    // Test basic block movement
    if (gameState.gamePhase === PHASE_PLAYING && !gameState.monsterActivated) {
      if (gameState.movesRemaining > 0) {
        if (!gameState.selectedBlock && gameState.movableBlocks.length > 0) {
          // Select first block
          gameState.selectedBlock = gameState.movableBlocks[0];
          gameState.selectedBlock.select();
        }
        
        // Move block in a pattern
        if (gameState.selectedBlock) {
          const moveInterval = 10;
          if (p.frameCount % moveInterval === 0) {
            if (gameState.movesRemaining > 5) {
              gameState.selectedBlock.move(5, 0);
            } else {
              gameState.selectedBlock.move(0, 5);
            }
            gameState.movesRemaining--;
            gameState.lastMoveTime = Date.now();
          }
        }
      }
    }
  } else if (mode === "TEST_2") {
    // Test win scenario - build proper barriers
    if (gameState.gamePhase === PHASE_PLAYING && !gameState.monsterActivated) {
      if (gameState.movesRemaining > 0) {
        if (!gameState.selectedBlock && gameState.movableBlocks.length > 0) {
          gameState.selectedBlock = gameState.movableBlocks[0];
          gameState.selectedBlock.select();
        }
        
        if (gameState.selectedBlock) {
          const moveInterval = 8;
          if (p.frameCount % moveInterval === 0) {
            // Move blocks to center to create barrier
            const targetX = 280;
            const currentX = gameState.selectedBlock.body.position.x;
            
            if (Math.abs(currentX - targetX) > 10) {
              if (currentX < targetX) {
                gameState.selectedBlock.move(5, 0);
              } else {
                gameState.selectedBlock.move(-5, 0);
              }
            } else {
              gameState.selectedBlock.move(0, 5);
            }
            
            gameState.movesRemaining--;
            gameState.lastMoveTime = Date.now();
          }
        }
      }
    }
  }
}