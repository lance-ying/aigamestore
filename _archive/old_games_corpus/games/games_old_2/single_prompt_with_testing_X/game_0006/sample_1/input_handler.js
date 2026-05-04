// input_handler.js - Input handling for player control

import { gameState, PHASE_PLAYING, PHASE_PAUSED, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function handlePlayerInput(p) {
  if (!gameState.player || gameState.controlMode !== "HUMAN") return;
  
  let moveX = 0;
  let moveY = 0;
  
  // Arrow key movement
  if (p.keyIsDown(37)) moveX -= 1; // LEFT
  if (p.keyIsDown(39)) moveX += 1; // RIGHT
  if (p.keyIsDown(38)) moveY -= 1; // UP
  if (p.keyIsDown(40)) moveY += 1; // DOWN
  
  if (moveX !== 0 || moveY !== 0) {
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    moveX /= magnitude;
    moveY /= magnitude;
    
    const targetX = gameState.player.x + moveX * 50;
    const targetY = gameState.player.y + moveY * 50;
    
    gameState.player.moveTowards(
      p.constrain(targetX, 0, CANVAS_WIDTH),
      p.constrain(targetY, 0, CANVAS_HEIGHT)
    );
  }
}

export function handleAutomatedInput(p, action) {
  if (!gameState.player || gameState.controlMode === "HUMAN") return;
  
  if (action && action.keyCode) {
    let moveX = 0;
    let moveY = 0;
    
    if (action.keyCode === 37) moveX -= 1; // LEFT
    if (action.keyCode === 39) moveX += 1; // RIGHT
    if (action.keyCode === 38) moveY -= 1; // UP
    if (action.keyCode === 40) moveY += 1; // DOWN
    
    if (moveX !== 0 || moveY !== 0) {
      const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= magnitude;
      moveY /= magnitude;
      
      const targetX = gameState.player.x + moveX * 50;
      const targetY = gameState.player.y + moveY * 50;
      
      gameState.player.moveTowards(
        p.constrain(targetX, 0, CANVAS_WIDTH),
        p.constrain(targetY, 0, CANVAS_HEIGHT)
      );
    }
  }
}