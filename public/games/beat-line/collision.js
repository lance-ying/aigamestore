// collision.js - Collision detection

import { gameState, GAME_PHASE } from './globals.js';
import { LEVELS } from './levels.js';
import { Particle } from './entities.js';

export function checkCollisions(p) {
  if (!gameState.player.alive) return;

  const level = LEVELS[gameState.currentLevel];
  const player = gameState.player;

  // Skip collision checks during grace period after turn
  if (player.turnGracePeriod > 0) {
    return;
  }

  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (checkLineObstacleCollision(player, obstacle)) {
      handlePlayerDeath(p, "Hit obstacle!");
      return;
    }
  }

  // Check track boundaries
  if (!isPlayerOnTrack(player, level)) {
    handlePlayerDeath(p, "Fell off track!");
    return;
  }
}

function checkLineObstacleCollision(player, obstacle) {
  // Check if player head collides with obstacle
  const dx = player.x - obstacle.x;
  const dy = player.y - obstacle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < player.collisionRadius + obstacle.width / 2) {
    return true;
  }

  return false;
}

function isPlayerOnTrack(player, level) {
  const trackWidth = level.trackWidth;
  
  // Find nearest track segment
  let nearestDist = Infinity;
  let onTrack = false;

  for (const segment of gameState.trackSegments) {
    const segDist = Math.abs(segment.distance - player.getTraveledDistance());
    
    if (segDist < 100) { // Only check nearby segments
      // Check if player is within track bounds
      const direction = segment.direction;
      
      if (direction === "RIGHT" || direction === "LEFT") {
        // Track is horizontal
        const distFromCenter = Math.abs(player.y - segment.y);
        if (distFromCenter < trackWidth / 2 + 5) { // Added 5px tolerance
          onTrack = true;
          break;
        }
      } else {
        // Track is vertical
        const distFromCenter = Math.abs(player.x - segment.x);
        if (distFromCenter < trackWidth / 2 + 5) { // Added 5px tolerance
          onTrack = true;
          break;
        }
      }
    }
  }

  return onTrack;
}

function handlePlayerDeath(p, reason) {
  gameState.player.die();
  gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
  gameState.gameOverReason = reason;

  // Create death particles
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    const speed = 2 + Math.random() * 2;
    const particle = new Particle(
      gameState.player.x,
      gameState.player.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      60,
      [255, 200, 0]
    );
    gameState.particles.push(particle);
  }

  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, reason: reason },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}