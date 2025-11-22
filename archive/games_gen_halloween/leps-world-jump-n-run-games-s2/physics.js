// physics.js - Physics and collision detection
import { gameState } from './globals.js';

export function handleCollisions(p, player, platforms) {
  const playerBounds = player.getBounds();
  
  // Platform collision
  player.grounded = false;
  
  for (const platform of platforms) {
    const platBounds = platform.getBounds();
    
    // Check collision
    if (p.collideRectRect(
      playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
      platBounds.x, platBounds.y, platBounds.width, platBounds.height
    )) {
      // Determine collision side
      const playerBottom = playerBounds.y + playerBounds.height;
      const playerTop = playerBounds.y;
      const playerLeft = playerBounds.x;
      const playerRight = playerBounds.x + playerBounds.width;
      
      const platTop = platBounds.y;
      const platBottom = platBounds.y + platBounds.height;
      const platLeft = platBounds.x;
      const platRight = platBounds.x + platBounds.width;
      
      // Bottom collision (landing on platform)
      if (player.vy >= 0 && playerBottom > platTop && playerBottom < platTop + 10) {
        player.y = platTop - playerBounds.height;
        player.vy = 0;
        player.grounded = true;
      }
      // Top collision (hitting head)
      else if (player.vy < 0 && playerTop < platBottom && playerTop > platBottom - 10) {
        player.y = platBottom;
        player.vy = 0;
      }
      // Side collisions
      else if (playerRight > platLeft && playerLeft < platLeft) {
        player.x = platLeft - playerBounds.width;
        player.vx = 0;
      } else if (playerLeft < platRight && playerRight > platRight) {
        player.x = platRight;
        player.vx = 0;
      }
    }
  }
}

export function checkEnemyCollision(p, player, enemy) {
  const playerBounds = player.getBounds();
  const enemyBounds = enemy.getBounds();
  
  return p.collideRectRect(
    playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
    enemyBounds.x, enemyBounds.y, enemyBounds.width, enemyBounds.height
  );
}

export function checkCoinCollision(p, player, coin) {
  const playerBounds = player.getBounds();
  const coinBounds = coin.getBounds();
  
  return p.collideRectRect(
    playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
    coinBounds.x, coinBounds.y, coinBounds.width, coinBounds.height
  );
}

export function checkGoalCollision(p, player, goal) {
  const playerBounds = player.getBounds();
  const goalBounds = goal.getBounds();
  
  return p.collideRectRect(
    playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
    goalBounds.x, goalBounds.y, goalBounds.width, goalBounds.height
  );
}