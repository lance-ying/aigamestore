// collision.js - Collision detection functions
import { gameState } from './globals.js';

export function checkCollisions(p, player) {
  const playerBox = player.getBoundingBox();
  
  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (!obstacle.active) continue;
    
    // Only check collision if obstacle is close enough (in z-space)
    if (obstacle.z > 150) continue;
    
    // Skip collision if jetpack is active
    if (player.jetpackActive) continue;
    
    const obstacleBoxes = obstacle.getBoundingBoxes();
    
    for (const box of obstacleBoxes) {
      if (boxCollision(playerBox, box)) {
        // Collision detected
        if (player.hoverboardActive) {
          // Use hoverboard protection
          player.hoverboardActive = false;
          obstacle.active = false; // Remove obstacle
          
          // Log event
          p.logs.player_info.push({
            screen_x: player.x,
            screen_y: player.y,
            game_x: player.x,
            game_y: player.y,
            event: "hoverboard_used",
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Game over
          return { collision: true, type: 'obstacle' };
        }
      }
    }
  }
  
  // Check coin collisions
  for (const coin of gameState.coins) {
    if (!coin.active || coin.collected) continue;
    
    // Only check collision if coin is close enough
    if (coin.z > 150) continue;
    
    const coinBox = coin.getBoundingBox();
    const magnetRadius = 150;
    
    // Auto-collect with magnet or jetpack
    if (player.magnetActive || player.jetpackActive) {
      const { screenX } = coin.getScreenPosition();
      const distance = p.dist(player.x, player.y, screenX, coinBox.y + coinBox.height / 2);
      if (distance < magnetRadius) {
        collectCoin(p, coin);
      }
    } else if (boxCollision(playerBox, coinBox)) {
      collectCoin(p, coin);
    }
  }
  
  // Check powerup collisions
  for (const powerup of gameState.powerups) {
    if (!powerup.active || powerup.collected) continue;
    
    // Only check collision if powerup is close enough
    if (powerup.z > 150) continue;
    
    const powerupBox = powerup.getBoundingBox();
    
    if (boxCollision(playerBox, powerupBox)) {
      collectPowerup(p, player, powerup);
    }
  }
  
  return { collision: false };
}

function boxCollision(box1, box2) {
  return box1.x < box2.x + box2.width &&
         box1.x + box1.width > box2.x &&
         box1.y < box2.y + box2.height &&
         box1.y + box1.height > box2.y;
}

function collectCoin(p, coin) {
  coin.collected = true;
  coin.active = false;
  
  const level = gameState.currentLevel;
  const multiplier = level < 5 ? gameState.currentLevel + 1 : 3;
  const points = Math.floor(10 * multiplier);
  
  gameState.coinsCollected++;
  gameState.score += points;
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    event: "coin_collected",
    points: points,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function collectPowerup(p, player, powerup) {
  powerup.collected = true;
  powerup.active = false;
  
  const level = gameState.currentLevel;
  const multiplier = level < 5 ? gameState.currentLevel + 1 : 3;
  const points = Math.floor(50 * multiplier);
  
  gameState.score += points;
  
  if (powerup.type === 'jetpack') {
    player.activateJetpack(180); // 3 seconds at 60fps
  } else if (powerup.type === 'hoverboard') {
    player.activateHoverboard();
  } else if (powerup.type === 'magnet') {
    player.activateMagnet(300); // 5 seconds at 60fps
  }
  
  p.logs.player_info.push({
    screen_x: player.x,
    screen_y: player.y,
    game_x: player.x,
    game_y: player.y,
    event: "powerup_collected",
    powerup_type: powerup.type,
    points: points,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}