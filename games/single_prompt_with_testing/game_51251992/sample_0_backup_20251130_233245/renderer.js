// Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawBody(p, body, color) {
  p.push();
  p.translate(body.position.x, body.position.y);
  p.rotate(body.angle);
  p.fill(color);
  p.noStroke();
  
  if (body.label.includes('circle') || body.circleRadius) {
    p.circle(0, 0, body.circleRadius * 2);
  } else {
    p.rectMode(p.CENTER);
    // Approximate rect from bounds if vertices complex, else assume rect
    const w = body.bounds.max.x - body.bounds.min.x;
    const h = body.bounds.max.y - body.bounds.min.y;
    p.rect(0, 0, w, h);
  }
  p.pop();
}

export function renderGame(p) {
  // 1. Background
  p.background(20);
  
  // 2. World Rendering (Camera Transform)
  p.push();
  p.translate(-gameState.camera.x, -gameState.camera.y);
  
  // Grid lines for "Dungeon" feel
  p.stroke(40);
  p.strokeWeight(1);
  const gridSize = 40;
  const startX = Math.floor(gameState.camera.x / gridSize) * gridSize;
  const startY = Math.floor(gameState.camera.y / gridSize) * gridSize;
  
  for (let x = startX; x < startX + CANVAS_WIDTH + gridSize; x += gridSize) {
    p.line(x, gameState.camera.y, x, gameState.camera.y + CANVAS_HEIGHT);
  }
  for (let y = startY; y < startY + CANVAS_HEIGHT + gridSize; y += gridSize) {
    p.line(gameState.camera.x, y, gameState.camera.x + CANVAS_WIDTH, y);
  }

  // Draw Walls
  gameState.walls.forEach(wall => wall.render(p));
  
  // Draw Entities
  gameState.entities.forEach(entity => {
    if (entity.render) entity.render(p);
  });
  
  // Draw Player
  if (gameState.player) gameState.player.render(p);
  
  p.pop();
  
  // 3. UI Layer (Static)
  renderUI(p);
}

function renderUI(p) {
  // Score
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${Math.floor(gameState.score)}`, 20, 20);
  
  // Controls Hint
  p.textSize(12);
  p.fill(150);
  p.text("WASD: Move | SPACE: Dash | Z: Attack", 20, CANVAS_HEIGHT - 30);
}

export function renderStartScreen(p) {
  p.background(20);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.fill('#f1c40f');
  p.textSize(32);
  p.text("ONEBIT PHYSICS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
  
  p.fill(255);
  p.textSize(16);
  p.text("Survive the endless descent.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
  
  // Class Selection
  p.text("SELECT CLASS:", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
  
  p.fill(gameState.selectedClass === "WARRIOR" ? '#4a90e2' : 100);
  p.text("[1] WARRIOR (Melee, Durable)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
  
  p.fill(gameState.selectedClass === "WIZARD" ? '#9b59b6' : 100);
  p.text("[2] WIZARD (Ranged, Fragile)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
  
  p.fill(255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
}

export function renderPaused(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(gameState.gamePhase === "GAME_OVER_WIN" ? '#2ecc71' : '#e74c3c');
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(gameState.gamePhase === "GAME_OVER_WIN" ? "YOU SURVIVED!" : "YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  p.textSize(16);
  p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
}