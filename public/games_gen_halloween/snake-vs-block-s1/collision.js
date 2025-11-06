// collision.js - Collision detection and handling
import { gameState } from './globals.js';

export function checkCollisions() {
  if (!gameState.player || gameState.snakeSegments.length === 0) return;
  
  const head = gameState.snakeSegments[0];
  
  // Check block collisions
  for (let block of gameState.blocks) {
    if (block.collidesWith(head)) {
      handleBlockCollision(block);
    }
  }
  
  // Check orb collisions
  for (let orb of gameState.orbs) {
    if (orb.collidesWith(head)) {
      handleOrbCollection(orb);
    }
  }
}

function handleBlockCollision(block) {
  if (block.hit) return;
  
  block.hit = true;
  gameState.blocksHit++;
  
  // Reduce snake length
  const reduction = Math.min(block.value, gameState.snakeLength);
  gameState.snakeLength -= reduction;
  
  // Remove segments
  const segmentsToRemove = Math.min(reduction, gameState.snakeSegments.length);
  gameState.snakeSegments.splice(-segmentsToRemove);
  
  // Check game over
  if (gameState.snakeLength <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}

function handleOrbCollection(orb) {
  if (orb.collected) return;
  
  orb.collected = true;
  gameState.orbsCollected++;
  
  // Increase snake length
  gameState.snakeLength += orb.value;
  gameState.score += orb.value * 10;
  
  // Add segments (will be added in next update)
}