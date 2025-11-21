// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderGame(p) {
  // Background with gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(70, 130, 180), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render entities
  for (const platform of gameState.platforms) {
    platform.render();
  }
  
  for (const obstacle of gameState.obstacles) {
    obstacle.render();
  }
  
  for (const token of gameState.tokens) {
    token.update();
    token.render();
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Tokens
  p.text(`Tokens: ${gameState.tokensCollected}/${gameState.totalTokens}`, 10, 30);
  
  // Time
  const elapsedTime = ((Date.now() - gameState.levelStartTime) / 1000).toFixed(1);
  p.text(`Time: ${elapsedTime}s`, 10, 50);
  
  // Speed indicator
  p.text(`Speed: ${gameState.gameSpeed.toFixed(1)}x`, 10, 70);
  
  // Current color indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Color:`, CANVAS_WIDTH - 60, 10);
  if (gameState.player) {
    if (gameState.player.color === "PINK") {
      p.fill(255, 100, 150);
    } else {
      p.fill(255, 220, 50);
    }
    p.ellipse(CANVAS_WIDTH - 20, 20, 25, 25);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.background(70, 130, 180);
  
  p.push();
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title with animation
  p.textSize(48);
  const titleY = 80 + p.sin(p.frameCount * 0.05) * 5;
  p.fill(255, 220, 50);
  p.text("CHAMELEON RUN", CANVAS_WIDTH / 2, titleY);
  
  // Chameleon icons
  p.fill(255, 100, 150);
  p.ellipse(150, titleY, 30, 30);
  p.fill(255, 220, 50);
  p.ellipse(450, titleY, 30, 30);
  
  // Instructions
  p.textSize(16);
  p.fill(255);
  p.text("Match your color to the platforms!", CANVAS_WIDTH / 2, 150);
  p.text("Avoid black obstacles and gaps!", CANVAS_WIDTH / 2, 175);
  
  // Objectives
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text("OBJECTIVES:", 80, 220);
  p.text("• Collect all tokens", 80, 245);
  p.text("• Complete the level", 80, 270);
  p.text("• Survive increasing speed!", 80, 295);
  
  // Controls
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(255, 220, 50);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 330);
  p.fill(255);
  p.textSize(12);
  p.text("↑ / SPACE: Jump  |  ← : Pink  |  → : Yellow", CANVAS_WIDTH / 2, 355);
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 150);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 150, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255, 255, 150);
    p.text("🌟 🌟 🌟", CANVAS_WIDTH / 2, 160);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.fill(255, 150, 150);
    p.text(gameState.deathReason, CANVAS_WIDTH / 2, 160);
  }
  
  // Stats
  p.textSize(18);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Tokens: ${gameState.tokensCollected}/${gameState.totalTokens}`, CANVAS_WIDTH / 2, 250);
  
  const finalTime = ((Date.now() - gameState.levelStartTime) / 1000).toFixed(1);
  p.text(`Time: ${finalTime}s`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.textSize(20);
  const alpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 100, 255);
  p.fill(255, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  
  p.pop();
}