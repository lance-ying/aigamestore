// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, RECIPES, LEVEL_CONFIGS } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SUSHI SPRINT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text("Restaurant Management Simulation", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Manage your sushi restaurant",
    "• Click customers with ! to take orders",
    "• Orders auto-prepare at stations",
    "• Click ready stations (✓) to serve",
    "• Click customers with $ to collect payment",
    "• Click dirty tables to clean them",
    "",
    "CONTROLS:",
    "• Arrow Keys: Scroll camera",
    "• Space/ESC: Pause game",
    "• R: Restart to menu",
    "• ENTER: Start game",
    "",
    "MEET OBJECTIVES BEFORE TIME RUNS OUT!"
  ];
  
  let y = 170;
  for (const line of instructions) {
    p.text(line, 80, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function drawPlaying(p) {
  // Background
  p.background(180, 160, 140);
  
  // Draw floor pattern
  p.push();
  p.translate(-gameState.cameraX, -gameState.cameraY);
  
  // Floor tiles
  p.stroke(160, 140, 120);
  p.strokeWeight(1);
  for (let x = 0; x < 800; x += 50) {
    for (let y = 0; y < 600; y += 50) {
      p.fill((x + y) % 100 === 0 ? 190 : 180, 160, 140);
      p.rect(x, y, 50, 50);
    }
  }
  
  // Draw entrance area
  p.fill(150, 120, 100);
  p.noStroke();
  p.rect(0, 150, 80, 100);
  p.fill(100, 80, 60);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("ENTRANCE", 40, 200);
  
  // Draw all entities
  for (const entity of gameState.entities) {
    entity.draw(p);
  }
  
  p.pop();
  
  // HUD
  drawHUD(p);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawHUD(p) {
  // Top bar background
  p.fill(40, 40, 60, 230);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Score
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 8);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`GOLD: $${gameState.gold}`, 10, 8);
  
  // Level and Day
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`LEVEL ${gameState.currentLevel} - DAY ${gameState.gameDay}/${gameState.maxGameDays}`, CANVAS_WIDTH / 2, 10);
  
  // Objectives sidebar
  p.fill(40, 40, 60, 230);
  p.rect(0, 40, 150, 120);
  
  p.fill(255, 255, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("OBJECTIVES:", 5, 45);
  
  const obj = gameState.levelObjectives;
  p.fill(200, 200, 200);
  p.textSize(10);
  
  const goldDone = gameState.gold >= obj.goldTarget;
  const custDone = gameState.customersServed >= obj.customersTarget;
  const repDone = gameState.reputation >= obj.reputationTarget;
  
  p.fill(...(goldDone ? [100, 255, 100] : [255, 255, 255]));
  p.text(`Gold: ${gameState.gold}/${obj.goldTarget}`, 5, 65);
  
  p.fill(...(custDone ? [100, 255, 100] : [255, 255, 255]));
  p.text(`Served: ${gameState.customersServed}/${obj.customersTarget}`, 5, 80);
  
  p.fill(...(repDone ? [100, 255, 100] : [255, 255, 255]));
  p.text(`Rep: ${gameState.reputation}/${obj.reputationTarget}`, 5, 95);
  
  // Inventory
  p.fill(255, 255, 200);
  p.textSize(10);
  p.text("INVENTORY:", 5, 110);
  p.fill(200, 200, 200);
  p.textSize(8);
  let invY = 125;
  const importantIngredients = ['rice', 'tuna', 'salmon', 'shrimp'];
  for (const ing of importantIngredients) {
    if (gameState.ingredients[ing] > 0) {
      p.text(`${ing}: ${gameState.ingredients[ing]}`, 5, invY);
      invY += 10;
    }
  }
  
  // Bottom UI buttons
  p.fill(60, 100, 60);
  p.stroke(100, 150, 100);
  p.strokeWeight(2);
  p.rect(10, 365, 85, 25, 5);
  
  p.fill(60, 60, 100);
  p.stroke(100, 100, 150);
  p.rect(110, 365, 105, 25, 5);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(11);
  p.text("BUY ($50)", 52, 377);
  p.text("UNLOCK RECIPE", 162, 377);
}

export function drawGameOver(p) {
  p.background(20, 20, 40);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Victory screen
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 80);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
    p.text(`Gold Earned: $${gameState.gold}`, CANVAS_WIDTH / 2, 180);
    p.text(`Customers Served: ${gameState.customersServed}`, CANVAS_WIDTH / 2, 210);
    p.text(`Final Reputation: ${gameState.reputation}`, CANVAS_WIDTH / 2, 240);
    
    if (gameState.currentLevel < 5) {
      p.fill(200, 255, 200);
      p.textSize(16);
      p.text("Ready for the next challenge?", CANVAS_WIDTH / 2, 290);
    } else {
      p.fill(255, 215, 0);
      p.textSize(24);
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 290);
      p.fill(200, 200, 255);
      p.textSize(16);
      p.text("You've mastered all levels!", CANVAS_WIDTH / 2, 320);
    }
  } else {
    // Game over screen
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 80);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text(gameState.failureReason, CANVAS_WIDTH / 2, 140);
    
    p.fill(255);
    p.textSize(16);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
    p.text(`Gold: $${gameState.gold}`, CANVAS_WIDTH / 2, 220);
    p.text(`Customers Served: ${gameState.customersServed}`, CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}