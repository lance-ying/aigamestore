// gamelogic.js
import { 
  PHASE_PLAYING, PHASE_GAME_OVER_LOSE, MIN_NECK_LENGTH,
  gameState 
} from './globals.js';
import { spawnRings, spawnObstacles } from './spawner.js';
import { updateParticles } from './particles.js';

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.frameCounter++;
  gameState.distance += gameState.courseSpeed;
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
    
    // Log player position periodically
    if (gameState.frameCounter % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.distance,
        framecount: p.frameCount
      });
      
      // Track position history for automated testing
      gameState.positionHistory.push({
        x: gameState.player.x,
        y: gameState.player.y,
        frame: gameState.frameCounter
      });
      
      if (gameState.positionHistory.length > 100) {
        gameState.positionHistory.shift();
      }
    }
  }
  
  // Spawn entities
  spawnRings(p);
  spawnObstacles(p);
  
  // Update rings
  for (let i = gameState.rings.length - 1; i >= 0; i--) {
    const ring = gameState.rings[i];
    ring.update(p, gameState.courseSpeed);
    ring.checkCollision(p, gameState.player);
    
    if (ring.isOffScreen()) {
      gameState.rings.splice(i, 1);
    }
  }
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(p, gameState.courseSpeed);
    
    const collision = obstacle.checkCollision(p, gameState.player);
    if (collision) {
      endGame(p);
    }
    
    if (obstacle.isOffScreen()) {
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Update particles
  updateParticles(p, gameState.particles, gameState.courseSpeed);
  
  // Check game over conditions
  if (gameState.neckLength < MIN_NECK_LENGTH) {
    endGame(p);
  }
  
  // Increase difficulty over time
  if (gameState.distance > 2000 && gameState.courseSpeed < 3) {
    gameState.courseSpeed = 2.5;
  }
  if (gameState.distance > 5000 && gameState.courseSpeed < 4) {
    gameState.courseSpeed = 3;
  }
}

function endGame(p) {
  gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  
  // Calculate gems earned
  const gemsEarned = Math.floor(gameState.neckLength / 5);
  gameState.gems = gemsEarned;
  gameState.totalGems += gemsEarned;
  
  p.logs.game_info.push({
    data: { 
      phase: PHASE_GAME_OVER_LOSE, 
      event: "game_over",
      score: gameState.score,
      distance: gameState.distance,
      neckLength: gameState.neckLength,
      gemsEarned: gemsEarned
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}