// Physics and collision helpers
import { gameState } from './globals.js';

export function updatePhysics(p) {
  // Update moving platforms
  for (const platform of gameState.platforms) {
    if (platform.type === 'moving' && platform.update) {
      platform.update(p);
    }
  }
  
  // Update checkpoints
  for (const checkpoint of gameState.checkpoints) {
    if (checkpoint.update) {
      checkpoint.update(p);
    }
  }
  
  // Update crew members
  for (const crew of gameState.crewMembers) {
    if (crew.update) {
      crew.update(p);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update screen shake
  if (gameState.screenShake > 0) {
    gameState.screenShake *= 0.9;
    if (gameState.screenShake < 0.1) {
      gameState.screenShake = 0;
    }
  }
  
  // Update transition
  if (gameState.transitioning) {
    gameState.transitionTimer--;
    if (gameState.transitionTimer <= 0) {
      gameState.transitioning = false;
    }
  }
}

export function checkCollision(entity1, entity2) {
  return (
    entity1.x < entity2.x + entity2.width &&
    entity1.x + entity1.width > entity2.x &&
    entity1.y < entity2.y + entity2.height &&
    entity1.y + entity1.height > entity2.y
  );
}