// rendering.js - Game rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Background
  p.background(30, 20, 40);
  
  // Render ground pattern
  renderGround(p);
  
  // Render pickups
  for (const pickup of gameState.pickups) {
    pickup.render(p, gameState.camera);
  }
  
  // Render projectiles
  for (const proj of gameState.projectiles) {
    proj.render(p, gameState.camera);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p, gameState.camera);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p, gameState.camera);
  }
  
  // Render particles
  for (const particle of gameState.particles) {
    particle.render(p, gameState.camera);
  }
}

function renderGround(p) {
  const camera = gameState.camera;
  const tileSize = 40;
  
  p.push();
  p.noStroke();
  
  const startX = Math.floor((camera.x - CANVAS_WIDTH / 2) / tileSize) * tileSize;
  const startY = Math.floor((camera.y - CANVAS_HEIGHT / 2) / tileSize) * tileSize;
  
  for (let x = startX; x < camera.x + CANVAS_WIDTH / 2 + tileSize; x += tileSize) {
    for (let y = startY; y < camera.y + CANVAS_HEIGHT / 2 + tileSize; y += tileSize) {
      const screenX = x - camera.x + CANVAS_WIDTH / 2;
      const screenY = y - camera.y + CANVAS_HEIGHT / 2;
      
      // Checkerboard pattern
      const checker = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2;
      p.fill(checker === 0 ? 35 : 25, checker === 0 ? 25 : 15, checker === 0 ? 45 : 35);
      p.rect(screenX, screenY, tileSize, tileSize);
    }
  }
  
  p.pop();
}