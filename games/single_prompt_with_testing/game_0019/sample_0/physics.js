// physics.js
import { gameState } from './globals.js';

export function checkPlatformCollision(p, player, platform) {
  const playerLeft = player.x - player.width / 2;
  const playerRight = player.x + player.width / 2;
  const playerTop = player.y - player.height / 2;
  const playerBottom = player.y + player.height / 2;

  const platLeft = platform.x;
  const platRight = platform.x + platform.width;
  const platTop = platform.y;
  const platBottom = platform.y + platform.height;

  // Check for collision
  if (playerRight > platLeft && playerLeft < platRight &&
      playerBottom > platTop && playerTop < platBottom) {
    
    // Determine collision side
    const overlapLeft = playerRight - platLeft;
    const overlapRight = platRight - playerLeft;
    const overlapTop = playerBottom - platTop;
    const overlapBottom = platBottom - playerTop;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && player.velY > 0) {
      // Landing on top
      player.y = platTop - player.height / 2;
      player.velY = 0;
      player.onGround = true;
      player.stopGroundPound();
      return 'top';
    } else if (minOverlap === overlapBottom && player.velY < 0) {
      // Hitting from bottom
      player.y = platBottom + player.height / 2;
      player.velY = 0;
      return 'bottom';
    } else if (minOverlap === overlapLeft) {
      // Hitting from left
      player.x = platLeft - player.width / 2;
      player.velX = 0;
      return 'left';
    } else if (minOverlap === overlapRight) {
      // Hitting from right
      player.x = platRight + player.width / 2;
      player.velX = 0;
      return 'right';
    }
  }
  return null;
}

export function checkPizzaCollision(p, player, pizza) {
  if (pizza.collected) return false;
  
  const dist = p.dist(player.x, player.y, pizza.x, pizza.y);
  return dist < (player.width / 2 + pizza.size / 2);
}

export function checkBlockCollision(p, player, block) {
  if (block.destroyed) return false;
  
  const playerLeft = player.x - player.width / 2;
  const playerRight = player.x + player.width / 2;
  const playerTop = player.y - player.height / 2;
  const playerBottom = player.y + player.height / 2;

  const blockLeft = block.x;
  const blockRight = block.x + block.size;
  const blockTop = block.y;
  const blockBottom = block.y + block.size;

  return playerRight > blockLeft && playerLeft < blockRight &&
         playerBottom > blockTop && playerTop < blockBottom;
}

export function checkExitCollision(p, player, exit) {
  const playerLeft = player.x - player.width / 2;
  const playerRight = player.x + player.width / 2;
  const playerTop = player.y - player.height / 2;
  const playerBottom = player.y + player.height / 2;

  const exitLeft = exit.x;
  const exitRight = exit.x + exit.width;
  const exitTop = exit.y;
  const exitBottom = exit.y + exit.height;

  return playerRight > exitLeft && playerLeft < exitRight &&
         playerBottom > exitTop && playerTop < exitBottom;
}