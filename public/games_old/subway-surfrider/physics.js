import { CANVAS_HEIGHT } from './globals.js';

// Check collision between player and obstacle
export function checkCollision(p, player, obstacle) {
  if (!obstacle || obstacle.y > CANVAS_HEIGHT + 50) return false;
  
  // Check if player can avoid this obstacle type based on their current state
  if (obstacle.type === 'barrier' && player.isJumping) {
    // Player is jumping over a barrier - no collision
    return false;
  }
  
  if (obstacle.type === 'tunnel' && player.isSliding) {
    // Player is sliding under a tunnel - no collision
    return false;
  }
  
  // For trains, player cannot avoid by jumping or sliding - must change lanes
  
  const playerRect = player.getCollisionRect();
  const obstacleRect = obstacle.getCollisionRect();
  
  return p.collideRectRect(
    playerRect.x, playerRect.y, playerRect.width, playerRect.height,
    obstacleRect.x, obstacleRect.y, obstacleRect.width, obstacleRect.height
  );
}

// Check collision between player and coin
export function checkCoinCollision(p, player, coin) {
  if (!coin || coin.collected || coin.y > CANVAS_HEIGHT + 50) return false;
  
  const playerRect = player.getCollisionRect();
  
  return p.collideRectCircle(
    playerRect.x, playerRect.y, playerRect.width, playerRect.height,
    coin.x, coin.y, coin.radius * 2
  );
}

// Check if obstacle is ahead in the same lane
export function isObstacleAhead(player, obstacles, distance) {
  return obstacles.some(obstacle => {
    const obstacleY = obstacle.getActualY();
    return obstacle.laneIndex === player.laneIndex && 
           Math.abs(obstacleY - player.y) <= distance;
  });
}

// Check if a specific type of obstacle is ahead
export function isObstacleTypeAhead(player, obstacles, type, distance) {
  return obstacles.some(obstacle => {
    const obstacleY = obstacle.getActualY();
    return obstacle.laneIndex === player.laneIndex && 
           obstacle.type === type &&
           Math.abs(obstacleY - player.y) <= distance;
  });
}

// Find the closest obstacle ahead
export function getClosestObstacleAhead(player, obstacles) {
  let closestDist = Infinity;
  let closestObstacle = null;
  
  for (const obstacle of obstacles) {
    const obstacleY = obstacle.getActualY();
    if (obstacle.laneIndex === player.laneIndex && Math.abs(obstacleY - player.y) < 100) {
      const dist = Math.abs(obstacleY - player.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestObstacle = obstacle;
      }
    }
  }
  
  return { obstacle: closestObstacle, distance: closestDist };
}

// Find the closest coin ahead
export function getClosestCoinAhead(player, coins) {
  let closestDist = Infinity;
  let closestCoin = null;
  
  for (const coin of coins) {
    if (!coin.collected) {
      const dist = Math.sqrt(
        Math.pow(coin.x - player.x, 2) + 
        Math.pow(coin.y - player.y, 2)
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestCoin = coin;
      }
    }
  }
  
  return { coin: closestCoin, distance: closestDist };
}

// Check if a lane is safer to move to
export function isSaferLane(player, obstacles, targetLaneIndex, lookAheadDistance) {
  const obstaclesInCurrentLane = obstacles.filter(o => {
    const obstacleY = o.getActualY();
    return o.laneIndex === player.laneIndex && 
           Math.abs(obstacleY - player.y) < lookAheadDistance;
  }).length;
  
  const obstaclesInTargetLane = obstacles.filter(o => {
    const obstacleY = o.getActualY();
    return o.laneIndex === targetLaneIndex && 
           Math.abs(obstacleY - player.y) < lookAheadDistance;
  }).length;
  
  return obstaclesInTargetLane < obstaclesInCurrentLane;
}