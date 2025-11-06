// collision.js - Collision detection and handling

import { gameState, PHASE_GAME_OVER_LOSE, COLOR_PINK, COLOR_YELLOW } from './globals.js';

export function checkCollisions(p) {
  const player = gameState.player;
  
  // Check platform collisions
  let onPlatform = false;
  for (const platform of gameState.platforms) {
    if (platform.isPlayerOn(player)) {
      // Land on platform
      player.y = platform.y - player.size / 2;
      player.vy = 0;
      player.isGrounded = true;
      onPlatform = true;
      
      // Check color match
      if (player.color !== platform.color) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        gameState.deathReason = "Color mismatch!";
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, reason: gameState.deathReason },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      break;
    }
  }
  
  if (!onPlatform) {
    player.isGrounded = false;
  }
  
  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (obstacle.checkCollision(player)) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      gameState.deathReason = "Hit obstacle!";
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: gameState.deathReason },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Check token collection
  for (const token of gameState.tokens) {
    if (token.checkCollection(player)) {
      token.collected = true;
      gameState.tokensCollected++;
      gameState.score += 100;
    }
  }
  
  // Check if fell off screen
  if (player.y > 450) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    gameState.deathReason = "Fell off!";
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: gameState.deathReason },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}