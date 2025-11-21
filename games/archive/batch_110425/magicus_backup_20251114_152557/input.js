// input.js - Input handling

import { gameState, GRID_SIZE, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { swapCells, canSwap } from './grid.js';
import { castSpell } from './combat.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.animating || !gameState.isPlayerTurn) return;
  
  // Arrow keys - cursor movement
  if (keyCode === 37) { // LEFT
    gameState.cursor.x = Math.max(0, gameState.cursor.x - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursor.x = Math.min(GRID_SIZE - 1, gameState.cursor.x + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursor.y = Math.max(0, gameState.cursor.y - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursor.y = Math.min(GRID_SIZE - 1, gameState.cursor.y + 1);
  }
  
  // Space - select/swap
  else if (keyCode === 32) {
    if (!gameState.selectedCell) {
      gameState.selectedCell = { x: gameState.cursor.x, y: gameState.cursor.y };
    } else {
      const dx = Math.abs(gameState.selectedCell.x - gameState.cursor.x);
      const dy = Math.abs(gameState.selectedCell.y - gameState.cursor.y);
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        if (canSwap(gameState.grid, 
                   gameState.selectedCell.x, gameState.selectedCell.y,
                   gameState.cursor.x, gameState.cursor.y)) {
          swapCells(gameState.grid,
                   gameState.selectedCell.x, gameState.selectedCell.y,
                   gameState.cursor.x, gameState.cursor.y);
          
          gameState.isPlayerTurn = false;
          gameState.turnCount++;
        }
      }
      gameState.selectedCell = null;
    }
  }
  
  // Z - cast spell
  else if (keyCode === 90) {
    for (let i = 0; i < 5; i++) {
      if (gameState.elementalMeters[i] >= gameState.meterMax) {
        const result = castSpell(i, p);
        if (result) {
          gameState.currentEnemy.takeDamage(result.damage);
          gameState.score += result.damage;
          
          // Show spell effect
          gameState.animating = true;
          gameState.damageDealt = result.damage;
          gameState.animationTimer = 0;
        }
        break;
      }
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Log automated input
  p.logs.inputs.push({
    input_type: "automated",
    data: { action: action },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.animating || !gameState.isPlayerTurn) return;
  
  if (action.type === 'move') {
    gameState.cursor.x = action.x;
    gameState.cursor.y = action.y;
  } else if (action.type === 'select') {
    gameState.selectedCell = { x: gameState.cursor.x, y: gameState.cursor.y };
  } else if (action.type === 'swap') {
    if (gameState.selectedCell) {
      const dx = Math.abs(gameState.selectedCell.x - gameState.cursor.x);
      const dy = Math.abs(gameState.selectedCell.y - gameState.cursor.y);
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        if (canSwap(gameState.grid, 
                   gameState.selectedCell.x, gameState.selectedCell.y,
                   gameState.cursor.x, gameState.cursor.y)) {
          swapCells(gameState.grid,
                   gameState.selectedCell.x, gameState.selectedCell.y,
                   gameState.cursor.x, gameState.cursor.y);
          
          gameState.isPlayerTurn = false;
          gameState.turnCount++;
        }
      }
      gameState.selectedCell = null;
    }
  } else if (action.type === 'spell') {
    for (let i = 0; i < 5; i++) {
      if (gameState.elementalMeters[i] >= gameState.meterMax) {
        const result = castSpell(i, p);
        if (result) {
          gameState.currentEnemy.takeDamage(result.damage);
          gameState.score += result.damage;
          
          gameState.animating = true;
          gameState.damageDealt = result.damage;
          gameState.animationTimer = 0;
        }
        break;
      }
    }
  }
}