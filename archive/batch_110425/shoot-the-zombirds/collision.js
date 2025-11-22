// collision.js - Collision detection and handling
import { gameState } from './globals.js';
import { createParticles } from './particles.js';

export function checkCollisions(p) {
  // Check bolt-zombird collisions
  for (let i = gameState.bolts.length - 1; i >= 0; i--) {
    const bolt = gameState.bolts[i];
    if (!bolt.alive) continue;
    
    for (let j = gameState.zombirds.length - 1; j >= 0; j--) {
      const zombird = gameState.zombirds[j];
      if (!zombird.alive) continue;
      
      // Circle collision
      const dist = p.dist(bolt.x, bolt.y, zombird.x, zombird.y);
      if (dist < zombird.size / 2 + 5) {
        // Hit!
        bolt.alive = false;
        
        const destroyed = zombird.takeDamage(gameState.boltDamage);
        
        if (destroyed) {
          // Zombird destroyed
          gameState.score += 10;
          gameState.coins += zombird.typeData.coins;
          gameState.zombirdsKilled++;
          
          // Create particles
          createParticles(p, zombird.x, zombird.y, zombird.typeData.color);
          
          // Remove zombird
          gameState.zombirds.splice(j, 1);
          const entityIndex = gameState.entities.indexOf(zombird);
          if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
          }
          
          p.logs.game_info.push({
            data: { event: 'zombird_killed', type: zombird.type, score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        break;
      }
    }
  }
}

export function checkZombirdLanded(p, zombird) {
  // Find a random healthy pumpkin
  const healthyPumpkins = gameState.pumpkins.filter(pumpkin => pumpkin.health > 0);
  
  if (healthyPumpkins.length > 0) {
    const targetPumpkin = healthyPumpkins[Math.floor(p.random(healthyPumpkins.length))];
    targetPumpkin.takeDamage();
    
    // Create impact particles
    createParticles(p, targetPumpkin.x, targetPumpkin.y, [255, 140, 0]);
    
    p.logs.game_info.push({
      data: { event: 'pumpkin_damaged', health: targetPumpkin.health },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkGameOver(p) {
  // Check if all pumpkins destroyed
  const alivePumpkins = gameState.pumpkins.filter(pumpkin => pumpkin.health > 0);
  
  if (alivePumpkins.length === 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    
    p.logs.game_info.push({
      data: { event: 'game_over_lose', wave: gameState.wave, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}