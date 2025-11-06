// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderGoal } from './levels.js';

export function renderStartScreen(p) {
  p.background(135, 170, 200);
  
  // Draw decorative hills
  p.fill(100, 160, 100);
  p.noStroke();
  p.beginShape();
  p.vertex(0, CANVAS_HEIGHT);
  for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
    const y = CANVAS_HEIGHT - 80 - Math.sin(x * 0.01) * 30;
    p.vertex(x, y);
  }
  p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
  p.endShape(p.CLOSE);
  
  // Title
  p.fill(80, 60, 40);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("Old Man's Journey", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(60, 50, 40);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  const desc = "Guide the old man across whimsical landscapes\nby shaping the terrain beneath his feet.";
  p.text(desc, CANVAS_WIDTH / 2, 150);
  
  // Instructions
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "← → : Select terrain layer",
    "↑ ↓ : Raise or lower selected layer",
    "SPACE : Let the old man walk",
    "ESC : Pause/Unpause",
    "R : Restart level"
  ];
  
  let yPos = 200;
  instructions.forEach(inst => {
    p.text(inst, 150, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.fill(200, 100, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(200, 100, 50, 255 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
}

export function renderGame(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(
      p.color(135, 170, 220),
      p.color(200, 220, 240),
      inter
    );
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw clouds
  p.noStroke();
  p.fill(255, 255, 255, 150);
  drawCloud(p, 100 - gameState.cameraOffsetX * 0.3, 60, 60);
  drawCloud(p, 300 - gameState.cameraOffsetX * 0.3, 80, 50);
  drawCloud(p, 500 - gameState.cameraOffsetX * 0.3, 50, 70);
  
  // Draw terrain layers (back to front)
  for (let i = gameState.terrainLayers.length - 1; i >= 0; i--) {
    gameState.terrainLayers[i].render(gameState.cameraOffsetX);
  }
  
  // Draw goal
  renderGoal(p, gameState.cameraOffsetX);
  
  // Draw old man
  if (gameState.oldMan) {
    gameState.oldMan.render(gameState.cameraOffsetX);
  }
  
  // UI
  renderUI(p);
}

function drawCloud(p, x, y, size) {
  p.ellipse(x, y, size, size * 0.6);
  p.ellipse(x - size * 0.3, y, size * 0.7, size * 0.5);
  p.ellipse(x + size * 0.3, y, size * 0.7, size * 0.5);
}

function renderUI(p) {
  // Level indicator
  p.fill(80, 60, 40);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level ${gameState.currentLevel + 1} / ${gameState.totalLevels}`, 10, 10);
  
  // Selected layer indicator
  const selectedLayer = gameState.terrainLayers[gameState.selectedLayerIndex];
  if (selectedLayer && selectedLayer.canMove) {
    p.fill(255, 255, 100);
    p.textSize(12);
    p.text(`Selected Layer: ${gameState.selectedLayerIndex + 1}`, 10, 35);
  }
  
  // Instructions
  p.fill(60, 50, 40, 200);
  p.textSize(11);
  p.text("← → Select | ↑ ↓ Adjust | SPACE Walk", CANVAS_WIDTH - 250, 10);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(135, 170, 200);
  
  // Draw decorative elements
  p.fill(100, 160, 100);
  p.noStroke();
  p.beginShape();
  p.vertex(0, CANVAS_HEIGHT);
  for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
    const y = CANVAS_HEIGHT - 100 - Math.sin(x * 0.01 + p.frameCount * 0.02) * 20;
    p.vertex(x, y);
  }
  p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
  p.endShape(p.CLOSE);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(80, 60, 40);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("Journey Complete!", CANVAS_WIDTH / 2, 120);
    
    p.fill(60, 50, 40);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("The old man has reached his destination.", CANVAS_WIDTH / 2, 180);
    p.text("Thank you for guiding him home.", CANVAS_WIDTH / 2, 210);
    
    // Animated sun
    const sunSize = 60 + Math.sin(p.frameCount * 0.05) * 5;
    p.fill(255, 200, 100);
    p.noStroke();
    p.ellipse(CANVAS_WIDTH / 2, 280, sunSize, sunSize);
  }
  
  p.fill(200, 100, 50);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(200, 100, 50, 255 * pulse);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}