// shooting.js - Shooting mechanics
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Bolt } from './entities.js';

export function fireBolt(p) {
  // Check fire rate
  if (p.frameCount - gameState.lastShotFrame < gameState.fireRate) {
    return;
  }
  
  gameState.lastShotFrame = p.frameCount;
  
  // Determine direction
  let dx = 0, dy = 0;
  if (gameState.aimDirection === 0) { // UP
    dy = -1;
  } else if (gameState.aimDirection === 1) { // RIGHT
    dx = 1;
  } else if (gameState.aimDirection === 2) { // DOWN
    dy = 1;
  } else { // LEFT
    dx = -1;
  }
  
  const speed = 8;
  
  // Create bolt
  const bolt = new Bolt(
    gameState.player.x,
    gameState.player.y,
    dx * speed,
    dy * speed
  );
  
  gameState.bolts.push(bolt);
  gameState.entities.push(bolt);
  
  // Multi-shot: fire additional bolts at angles
  if (gameState.multiShotDuration > 0) {
    const angleOffset = 0.3; // radians
    const baseAngle = Math.atan2(dy, dx);
    
    for (let i = -1; i <= 1; i += 2) {
      const angle = baseAngle + angleOffset * i;
      const bolt2 = new Bolt(
        gameState.player.x,
        gameState.player.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      gameState.bolts.push(bolt2);
      gameState.entities.push(bolt2);
    }
  }
  
  p.logs.inputs.push({
    input_type: 'shot',
    data: { direction: gameState.aimDirection },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}