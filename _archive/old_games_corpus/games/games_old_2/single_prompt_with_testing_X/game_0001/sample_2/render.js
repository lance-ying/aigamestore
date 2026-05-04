// render.js - Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(135, 206, 235),
      p.color(255, 250, 205),
      inter
    );
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Clouds (parallax background)
  const cloudOffset = gameState.camera.x * 0.3;
  p.noStroke();
  p.fill(255, 255, 255, 180);
  
  for (let i = 0; i < 5; i++) {
    const x = (i * 250 - cloudOffset) % (CANVAS_WIDTH + 200) - 100;
    const y = 40 + i * 15;
    p.ellipse(x, y, 60, 30);
    p.ellipse(x + 25, y, 50, 25);
    p.ellipse(x - 20, y, 45, 20);
  }
}

export function renderUI(p) {
  const player = gameState.player;
  
  if (!player) return;
  
  // Health hearts
  p.push();
  p.fill(255, 50, 50);
  p.noStroke();
  for (let i = 0; i < player.maxHealth; i++) {
    const x = 20 + i * 35;
    const y = 20;
    
    if (i < player.health) {
      // Full heart
      p.push();
      p.translate(x, y);
      p.beginShape();
      p.vertex(0, 8);
      p.bezierVertex(-6, -2, -12, 2, 0, 14);
      p.bezierVertex(12, 2, 6, -2, 0, 8);
      p.endShape(p.CLOSE);
      p.pop();
    } else {
      // Empty heart
      p.stroke(255, 50, 50);
      p.strokeWeight(2);
      p.noFill();
      p.push();
      p.translate(x, y);
      p.beginShape();
      p.vertex(0, 8);
      p.bezierVertex(-6, -2, -12, 2, 0, 14);
      p.bezierVertex(12, 2, 6, -2, 0, 8);
      p.endShape(p.CLOSE);
      p.pop();
    }
  }
  p.pop();
  
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, 20, 50);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 0);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.stroke(34, 139, 34);
  p.strokeWeight(6);
  p.textSize(48);
  p.text("Lep's Adventure", CANVAS_WIDTH / 2, 80);
  
  // Character preview
  p.push();
  p.translate(CANVAS_WIDTH / 2, 150);
  
  // Draw Lep
  p.fill(34, 139, 34);
  p.noStroke();
  p.rect(-16, -8, 32, 28, 4);
  p.fill(255, 220, 177);
  p.ellipse(0, -24, 28, 28);
  p.fill(0, 100, 0);
  p.triangle(-16, -32, 16, -32, 0, -48);
  p.rect(-12, -34, 24, 6);
  p.fill(255, 215, 0);
  p.rect(-4, -34, 8, 6);
  p.fill(255, 140, 0);
  p.ellipse(-6, -14, 8, 12);
  p.ellipse(6, -14, 8, 12);
  p.ellipse(0, -10, 10, 8);
  p.fill(0);
  p.ellipse(-6, -24, 4, 6);
  p.ellipse(6, -24, 4, 6);
  
  p.pop();
  
  // Instructions
  p.noStroke();
  p.fill(255);
  p.textSize(18);
  p.text("Guide Lep through dangerous platforms!", CANVAS_WIDTH / 2, 220);
  p.text("Collect coins and avoid enemies!", CANVAS_WIDTH / 2, 245);
  p.text("Reach the flag to complete the level!", CANVAS_WIDTH / 2, 270);
  
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text("← → Arrow Keys: Move", CANVAS_WIDTH / 2, 310);
  p.text("SPACE: Jump", CANVAS_WIDTH / 2, 330);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 350);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(24);
  const pulse = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255 * pulse, 0);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

export function renderGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.fill(255, 215, 0);
    p.stroke(255, 140, 0);
    p.strokeWeight(4);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    // Stars
    p.fill(255, 255, 0);
    p.noStroke();
    for (let i = 0; i < 3; i++) {
      const x = CANVAS_WIDTH / 2 - 60 + i * 60;
      const y = 180;
      renderStar(p, x, y, 15, 5);
    }
  } else {
    p.fill(255, 50, 50);
    p.stroke(150, 0, 0);
    p.strokeWeight(4);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 140);
  }
  
  // Score
  p.noStroke();
  p.fill(255);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // Restart prompt
  p.fill(255, 255, 150);
  p.textSize(24);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
  
  p.pop();
}

function renderStar(p, x, y, r1, r2) {
  p.beginShape();
  for (let i = 0; i < 10; i++) {
    const angle = i * p.PI / 5;
    const r = i % 2 === 0 ? r1 : r2;
    const sx = x + r * p.cos(angle - p.PI / 2);
    const sy = y + r * p.sin(angle - p.PI / 2);
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}