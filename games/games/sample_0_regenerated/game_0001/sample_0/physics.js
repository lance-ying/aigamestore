// Physics and collision detection
import { gameState } from './globals.js';

export function updatePhysics(p) {
  // Update all entities with physics
  gameState.entities.forEach(entity => {
    if (entity.update && typeof entity.update === 'function') {
      entity.update(p);
    }
  });
  
  // Check collisions
  checkCollisions(p);
  
  // Clean up collected/dead entities
  cleanupEntities();
}

export function checkCollisions(p) {
  if (!gameState.player || !gameState.player.isAlive) return;
  
  const player = gameState.player;
  
  // Check coin collection
  gameState.collectibles.forEach(coin => {
    coin.checkCollection(player);
  });
  
  // Check obstacle collisions
  gameState.obstacles.forEach(obstacle => {
    if (obstacle.checkCollision(player)) {
      // Collision detected
      player.die();
      
      // Log collision
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { 
            event: 'collision',
            obstacleType: obstacle.type,
            playerLane: player.currentLane,
            obstacleZ: obstacle.z
          },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  });
}

export function cleanupEntities() {
  // Remove collected coins
  gameState.collectibles = gameState.collectibles.filter(coin => !coin.collected);
  
  // Remove obstacles that are far behind player
  if (gameState.player) {
    gameState.obstacles = gameState.obstacles.filter(
      obstacle => obstacle.z > gameState.player.z - 200
    );
    
    gameState.segments = gameState.segments.filter(
      segment => segment.z > gameState.player.z - 300
    );
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Rebuild entities array
  gameState.entities = [
    gameState.player,
    ...gameState.segments,
    ...gameState.obstacles,
    ...gameState.collectibles
  ].filter(e => e !== null && e !== undefined);
}