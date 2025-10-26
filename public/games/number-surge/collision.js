// collision.js - Collision detection functions

import { gameState, GAME_PHASES } from './globals.js';

export function checkCollisions(p) {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const playerBounds = gameState.player.getBounds();
  
  // Check collisions with number blocks
  for (let entity of gameState.entities) {
    if (entity.constructor.name === 'NumberBlock' && entity.alive) {
      const blockBounds = entity.getBounds();
      
      if (checkAABB(playerBounds, blockBounds)) {
        if (entity.value <= gameState.player.value) {
          // Absorb the block
          gameState.player.absorb(entity);
          entity.startFadeOut();
          
          // Log absorption
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.levelProgress,
            absorbed_value: entity.value,
            new_value: gameState.player.value,
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Collision with larger number - game over
          gameOver(p, false);
          return;
        }
      }
    }
    
    // Check collisions with saws
    if (entity.constructor.name === 'ElectricSaw' && entity.alive) {
      const sawBounds = entity.getBounds();
      if (checkCircleRect(sawBounds, playerBounds)) {
        gameOver(p, false);
        return;
      }
    }
    
    // Check collisions with ditches
    if (entity.constructor.name === 'Ditch' && entity.alive) {
      const ditchBounds = entity.getBounds();
      if (checkAABB(playerBounds, ditchBounds)) {
        gameOver(p, false);
        return;
      }
    }
  }
}

function checkAABB(rect1, rect2) {
  return rect1.left < rect2.right &&
         rect1.right > rect2.left &&
         rect1.top < rect2.bottom &&
         rect1.bottom > rect2.top;
}

function checkCircleRect(circle, rect) {
  // Find closest point on rectangle to circle center
  let closestX = constrain(circle.x, rect.left, rect.right);
  let closestY = constrain(circle.y, rect.top, rect.bottom);
  
  // Calculate distance
  let distX = circle.x - closestX;
  let distY = circle.y - closestY;
  let distance = Math.sqrt(distX * distX + distY * distY);
  
  return distance < circle.radius;
}

function constrain(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function gameOver(p, isWin) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER;
  gameState.framesSincePhaseChange = 0;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER", win: isWin, finalScore: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}