// rendering.js - Main rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { drawUI } from './ui.js';
import { drawParticles } from './particles.js';

export function drawGame(p) {
  // Camera shake
  if (gameState.cameraShake > 0) {
    p.push();
    p.translate(
      p.random(-gameState.cameraShake, gameState.cameraShake),
      p.random(-gameState.cameraShake, gameState.cameraShake)
    );
  }
  
  // Sky gradient
  drawSky(p);
  
  // Terrain
  if (gameState.terrain) {
    gameState.terrain.draw();
  }
  
  // Entities
  if (gameState.player) {
    gameState.player.draw();
  }
  for (let enemy of gameState.enemies) {
    if (enemy.alive) {
      enemy.draw();
    }
  }
  
  // Projectiles
  for (let projectile of gameState.projectiles) {
    projectile.draw();
  }
  
  // Particles
  drawParticles(p, gameState);
  
  if (gameState.cameraShake > 0) {
    p.pop();
  }
  
  // UI (no camera shake)
  drawUI(p);
}

function drawSky(p) {
  // Gradient sky
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c1 = p.color(135, 206, 235); // Sky blue
    const c2 = p.color(255, 248, 220); // Light yellow
    const c = p.lerpColor(c1, c2, inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
}