// ui.js - UI rendering
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export function drawStartScreen(p) {
  p.background(10, 10, 20);
  
  // Title with glow
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 200, 255, 100);
  p.noStroke();
  p.textSize(48);
  p.text("CAVE RUNNER", CANVAS_WIDTH / 2 + 2, 80 + 2);
  p.fill(100, 200, 255);
  p.text("CAVE RUNNER", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(200);
  p.text("Navigate your UFO through dangerous caves", CANVAS_WIDTH / 2, 140);
  p.text("Collect gems and return to the surface!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textAlign(p.LEFT);
  p.textSize(12);
  p.fill(180, 180, 200);
  
  const startX = 120;
  const startY = 210;
  const lineHeight = 20;
  
  p.text("↑ Arrow: Thrust upward", startX, startY);
  p.text("← → Arrows: Steer left/right", startX, startY + lineHeight);
  p.text("SHIFT: Boost (extra fuel)", startX, startY + lineHeight * 2);
  p.text("SPACE: Landing gear", startX, startY + lineHeight * 3);
  
  // Tips
  p.textSize(11);
  p.fill(150, 150, 170);
  p.text("• Land at fuel stations to refuel", startX, startY + lineHeight * 5);
  p.text("• Deeper gems are worth more points", startX, startY + lineHeight * 6);
  p.text("• Avoid walls and spikes!", startX, startY + lineHeight * 7);
  
  // Start prompt
  p.textAlign(p.CENTER);
  p.textSize(16);
  const alpha = Math.abs(Math.sin(Date.now() * 0.003)) * 255;
  p.fill(255, 255, 0, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawPausedIndicator(p) {
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 0);
  p.noStroke();
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOver(p, won) {
  p.background(0, 0, 0, 200);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.noStroke();
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("SUCCESS!", CANVAS_WIDTH / 2, 140);
    
    p.fill(255);
    p.textSize(18);
    p.text(`Gems Collected: ${gameState.gemsCollected}`, CANVAS_WIDTH / 2, 200);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("CRASHED!", CANVAS_WIDTH / 2, 140);
    
    p.fill(255);
    p.textSize(18);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255, 255, 0);
  p.textSize(16);
  const alpha = Math.abs(Math.sin(Date.now() * 0.003)) * 255;
  p.fill(255, 255, 0, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
}

export function drawHUD(p) {
  // Fuel bar
  p.fill(40, 40, 50);
  p.noStroke();
  p.rect(10, 10, 150, 20);
  
  const fuelPercent = gameState.fuel / gameState.maxFuel;
  const fuelColor = fuelPercent > 0.5 ? [100, 255, 100] : 
                    fuelPercent > 0.25 ? [255, 255, 100] : 
                    [255, 100, 100];
  p.fill(...fuelColor);
  p.rect(10, 10, 150 * fuelPercent, 20);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`FUEL: ${Math.floor(gameState.fuel)}`, 15, 13);
  
  // Score
  p.fill(40, 40, 50);
  p.rect(10, 40, 150, 25);
  p.fill(255, 200, 0);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, 15, 45);
  
  // Gems collected
  p.fill(40, 40, 50);
  p.rect(10, 70, 150, 20);
  p.fill(100, 200, 255);
  p.textSize(12);
  p.text(`GEMS: ${gameState.gemsCollected}`, 15, 73);
  
  // Depth indicator
  const depth = Math.max(0, Math.floor((gameState.player.y - 100) / 10));
  p.fill(40, 40, 50);
  p.rect(CANVAS_WIDTH - 160, 10, 150, 20);
  p.fill(200, 200, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`DEPTH: ${depth}m`, CANVAS_WIDTH - 15, 13);
  
  // Return message
  if (gameState.gemsCollected > 0 && gameState.player.y < 150) {
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255, 255, 0);
    p.textSize(16);
    p.text("Return to surface to complete mission!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function drawBackground(p) {
  // Sky gradient at surface
  if (gameState.cameraY < 200) {
    for (let y = 0; y < 200; y++) {
      const screenY = y - gameState.cameraY;
      if (screenY >= 0 && screenY < CANVAS_HEIGHT) {
        const alpha = 1 - (y / 200);
        p.stroke(30 + alpha * 70, 30 + alpha * 100, 50 + alpha * 150);
        p.line(0, screenY, CANVAS_WIDTH, screenY);
      }
    }
  }
  
  // Stars in background
  p.randomSeed(42);
  for (let i = 0; i < 50; i++) {
    const x = p.random(CANVAS_WIDTH);
    const y = p.random(-100, 100);
    const screenY = y - (gameState.cameraY * 0.5);
    
    if (screenY >= 0 && screenY < CANVAS_HEIGHT) {
      p.fill(255, 255, 255, 200);
      p.noStroke();
      p.ellipse(x, screenY, 2, 2);
    }
  }
}