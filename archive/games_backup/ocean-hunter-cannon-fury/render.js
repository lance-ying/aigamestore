import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { drawCannon } from './cannon.js';
import { drawUI } from './ui.js';

export function renderGame(p) {
  // Background
  p.background(0, 100, 200);
  
  // Draw ambient bubbles
  drawBubbles(p);
  
  if (gameState.gamePhase === 'START' || 
      gameState.gamePhase === 'GAME_OVER_WIN' || 
      gameState.gamePhase === 'GAME_OVER_LOSE') {
    drawUI(p);
    return;
  }
  
  // Draw cannon
  drawCannon(p);
  
  // Draw all entities
  for (const entity of gameState.entities) {
    if (entity.draw) {
      entity.draw();
    }
  }
  
  // Draw particles
  for (const particle of gameState.particles) {
    particle.draw();
  }
  
  // Draw floating texts
  for (const text of gameState.floatingTexts) {
    text.draw();
  }
  
  // Draw UI overlay
  drawUI(p);
}

// Ambient bubble effect
const bubbles = [];
function drawBubbles(p) {
  // Initialize bubbles once
  if (bubbles.length === 0) {
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: p.random(CANVAS_WIDTH),
        y: p.random(CANVAS_HEIGHT),
        size: p.random(3, 8),
        speed: p.random(0.3, 0.8)
      });
    }
  }
  
  // Update and draw bubbles
  p.push();
  p.noStroke();
  for (const bubble of bubbles) {
    bubble.y -= bubble.speed;
    if (bubble.y < -10) {
      bubble.y = CANVAS_HEIGHT + 10;
      bubble.x = p.random(CANVAS_WIDTH);
    }
    
    p.fill(150, 200, 255, 100);
    p.circle(bubble.x, bubble.y, bubble.size);
    p.fill(200, 230, 255, 150);
    p.circle(bubble.x - bubble.size * 0.2, bubble.y - bubble.size * 0.2, bubble.size * 0.4);
  }
  p.pop();
}