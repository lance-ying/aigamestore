// physics.js - Physics and collision detection

import { 
  RING_REWARD,
  WRONG_RING_PENALTY,
  OBSTACLE_PENALTY,
  PLAYER_COLORS
} from './globals.js';

export function checkRingCollisions(gameState, p) {
  const player = gameState.player;
  const neckLength = gameState.neckLength;
  
  gameState.rings.forEach(ring => {
    if (!ring.collected && ring.checkCollision(player, neckLength)) {
      ring.collected = true;
      
      if (ring.colorIndex === gameState.playerColor) {
        // Correct color
        gameState.neckLength += RING_REWARD;
        gameState.score += 10;
        
        p.logs.game_info.push({
          event: "ring_collected_correct",
          data: { colorIndex: ring.colorIndex, reward: RING_REWARD },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Wrong color
        gameState.neckLength = Math.max(0, gameState.neckLength - WRONG_RING_PENALTY);
        gameState.score = Math.max(0, gameState.score - 5);
        
        p.logs.game_info.push({
          event: "ring_collected_wrong",
          data: { colorIndex: ring.colorIndex, penalty: WRONG_RING_PENALTY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  });
}

export function checkObstacleCollisions(gameState, p) {
  const player = gameState.player;
  const neckLength = gameState.neckLength;
  
  gameState.obstacles.forEach(obstacle => {
    if (obstacle.checkCollision(player, neckLength)) {
      if (!obstacle.passed) {
        obstacle.passed = true;
        
        if (obstacle.type === "zipline" && neckLength < obstacle.minNeckHeight) {
          // Failed zipline
          gameState.neckLength = Math.max(0, gameState.neckLength - OBSTACLE_PENALTY);
          
          p.logs.game_info.push({
            event: "obstacle_hit_zipline",
            data: { type: obstacle.type, penalty: OBSTACLE_PENALTY },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (obstacle.type !== "zipline") {
          // Hit barrier
          gameState.neckLength = Math.max(0, gameState.neckLength - OBSTACLE_PENALTY);
          
          p.logs.game_info.push({
            event: "obstacle_hit",
            data: { type: obstacle.type, penalty: OBSTACLE_PENALTY },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  });
}

export function updateEntities(gameState, speed) {
  // Update rings
  gameState.rings.forEach(ring => ring.update(speed));
  gameState.rings = gameState.rings.filter(ring => !ring.isOffScreen());
  
  // Update obstacles
  gameState.obstacles.forEach(obstacle => obstacle.update(speed));
  gameState.obstacles = gameState.obstacles.filter(obstacle => !obstacle.isOffScreen());
}