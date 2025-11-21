// collision.js - Collision detection and handling

import {
  gameState,
  TYPE_OBSTACLE_HIGH,
  TYPE_OBSTACLE_LOW,
  TYPE_GAP,
  TYPE_FISH,
  TYPE_RESCUED_PENGUIN,
  TYPE_POWERUP_SHIELD,
  TYPE_POWERUP_MAGNET,
  STATE_JUMPING,
  STATE_SLIDING,
  INVULNERABILITY_DURATION,
  SHIELD_DURATION,
  MAGNET_DURATION,
  POWERUP_SHIELD,
  POWERUP_MAGNET,
  MAGNET_RADIUS
} from './globals.js';

export function checkCollisions(p) {
  if (!gameState.player) return;

  const playerBox = gameState.player.getCollisionBox();

  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (!obstacle.active) continue;

    const obstBox = obstacle.getCollisionBox();
    
    if (checkAABB(playerBox, obstBox)) {
      handleObstacleCollision(p, obstacle);
    }
  }

  // Check item collisions
  for (const item of gameState.items) {
    if (!item.active || item.collected) continue;

    const itemBox = item.getCollisionBox();
    
    if (checkAABB(playerBox, itemBox)) {
      handleItemCollision(p, item);
    }
  }

  // Magnet effect
  if (gameState.powerUp.active && gameState.powerUp.type === POWERUP_MAGNET) {
    for (const item of gameState.items) {
      if (!item.active || item.collected) continue;
      if (item.type !== TYPE_FISH) continue;

      const dx = gameState.player.x - item.x;
      const dy = gameState.player.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAGNET_RADIUS) {
        // Pull fish towards player
        item.x += dx * 0.15;
        item.y += dy * 0.15;
      }
    }
  }
}

function checkAABB(box1, box2) {
  return box1.x < box2.x + box2.width &&
         box1.x + box1.width > box2.x &&
         box1.y < box2.y + box2.height &&
         box1.y + box1.height > box2.y;
}

function handleObstacleCollision(p, obstacle) {
  const player = gameState.player;
  
  // Check if player should take damage
  let shouldTakeDamage = false;

  if (obstacle.type === TYPE_OBSTACLE_HIGH && player.state !== STATE_SLIDING) {
    shouldTakeDamage = true;
  } else if (obstacle.type === TYPE_OBSTACLE_LOW && player.state !== STATE_JUMPING) {
    shouldTakeDamage = true;
  } else if (obstacle.type === TYPE_GAP && player.state !== STATE_JUMPING) {
    shouldTakeDamage = true;
  }

  if (shouldTakeDamage) {
    takeDamage(p);
    obstacle.active = false; // Remove obstacle after collision
  }
}

function takeDamage(p) {
  // Check if player is protected
  if (gameState.invulnerabilityTimer > 0) return;
  if (gameState.powerUp.active && gameState.powerUp.type === POWERUP_SHIELD) return;

  gameState.lives--;
  gameState.invulnerabilityTimer = INVULNERABILITY_DURATION;

  // Log player info
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.distanceTraveled,
    framecount: p.frameCount
  });

  if (gameState.lives <= 0) {
    gameState.gamePhase = "GAME_OVER";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", reason: "out_of_lives" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleItemCollision(p, item) {
  item.collected = true;
  item.active = false;

  switch (item.type) {
    case TYPE_FISH:
      gameState.fishCount++;
      gameState.score += 5;
      break;

    case TYPE_RESCUED_PENGUIN:
      gameState.score += 25;
      break;

    case TYPE_POWERUP_SHIELD:
      activatePowerUp(POWERUP_SHIELD, SHIELD_DURATION);
      break;

    case TYPE_POWERUP_MAGNET:
      activatePowerUp(POWERUP_MAGNET, MAGNET_DURATION);
      break;
  }

  // Log player info on item collection
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.distanceTraveled,
    framecount: p.frameCount
  });
}

function activatePowerUp(type, duration) {
  gameState.powerUp.active = true;
  gameState.powerUp.type = type;
  gameState.powerUp.timer = duration;
}

export function updateTimers() {
  // Update invulnerability timer
  if (gameState.invulnerabilityTimer > 0) {
    gameState.invulnerabilityTimer--;
  }

  // Update power-up timer
  if (gameState.powerUp.active && gameState.powerUp.timer > 0) {
    gameState.powerUp.timer--;
    if (gameState.powerUp.timer <= 0) {
      gameState.powerUp.active = false;
      gameState.powerUp.type = null;
    }
  }
}