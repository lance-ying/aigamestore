// ui.js - UI rendering and HUD

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, AREAS } from './globals.js';

export function drawHUD(p) {
  p.push();
  
  // Top bar background
  p.fill(40, 30, 20, 200);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Acorn count
  p.fill(255, 215, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.text(`🌰 ${Math.floor(gameState.acorns)}`, 20, 20);
  
  // Scavenger info
  if (gameState.scavengers > 0) {
    p.textSize(12);
    p.fill(180, 200, 180);
    const rate = gameState.scavengers * gameState.scavengerRate;
    p.text(`+${rate.toFixed(1)}/sec`, 20, 40);
  }
  
  // Score
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(200, 200, 255);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 20);
  
  // Current area
  p.textSize(16);
  p.fill(255, 230, 180);
  p.text(gameState.currentArea, CANVAS_WIDTH / 2, 40);
  
  // Navigation hint
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(11);
  p.fill(180);
  p.text("← → Change Area", CANVAS_WIDTH - 20, 30);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 200, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 5);
  }
  
  p.pop();
}

export function drawStartScreen(p) {
  p.background(40, 60, 80);
  
  // Draw decorative background
  for (let i = 0; i < 20; i++) {
    const x = (i * 123 + 50) % CANVAS_WIDTH;
    const y = (i * 77 + 100) % CANVAS_HEIGHT;
    p.fill(60, 80, 100, 100);
    p.circle(x, y, 30 + (i % 3) * 20);
  }
  
  // Title
  p.fill(255, 215, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("IDLE ACORNS", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Build Your Woodland Empire", CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(50, 40, 30, 220);
  p.rect(50, 160, CANVAS_WIDTH - 100, 180, 10);
  
  p.fill(255, 230, 180);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("HOW TO PLAY:", 70, 175);
  
  p.textSize(12);
  p.fill(220, 210, 180);
  const instructions = [
    "• Collect acorns manually (SPACE) or buy scavengers",
    "• Navigate areas with Arrow Keys (←→)",
    "• Purchase upgrades in the SHOP (Z)",
    "• Unlock POND, GARDEN, and CAMPFIRE areas",
    "• Fish, grow crops, and craft items",
    "• Goal: Craft 24 items & max all upgrades!",
    "",
    "Controls:",
    "  SPACE: Collect/Cast/Plant/Cook",
    "  Z: Purchase/Catch/Harvest/Trade",
    "  Shift: Toggle auto-collect",
    "  ESC: Pause    R: Restart"
  ];
  
  let y = 200;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 16;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(Date.now() / 300) * 20 + 235;
  p.fill(pulse, 255, pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.background(20, 30, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(18);
  p.fill(220, 220, 220);
  if (isWin) {
    p.text("You've mastered the woodland economy!", CANVAS_WIDTH / 2, 150);
  } else {
    p.text("Keep trying to build your empire!", CANVAS_WIDTH / 2, 150);
  }
  
  // Stats box
  p.fill(50, 40, 60, 220);
  p.rect(100, 180, CANVAS_WIDTH - 200, 140, 10);
  
  p.fill(255, 230, 180);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("FINAL STATISTICS", CANVAS_WIDTH / 2, 195);
  
  p.textSize(14);
  p.fill(220, 210, 180);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Total Score: ${gameState.score}`, 120, 225);
  p.text(`Acorns Collected: ${gameState.totalAcornsCollected}`, 120, 245);
  p.text(`Items Crafted: ${gameState.craftedItems}/${gameState.targetCraftedItems}`, 120, 265);
  p.text(`Scavengers: ${gameState.scavengers}/${gameState.maxScavengers}`, 120, 285);
  p.text(`Areas Unlocked: ${gameState.unlockedAreas.length}/4`, 120, 305);
  
  // Restart prompt
  p.fill(255, 215, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(Date.now() / 300) * 20 + 235;
  p.fill(pulse, 235, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}