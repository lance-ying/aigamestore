// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, NUM_LANES, GAME_LENGTH } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235); // Sky blue
  
  // Title
  p.fill(101, 67, 33);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("COFFEE STACK", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(50);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Collect cups and customize them!", CANVAS_WIDTH / 2, 150);
  p.text("Pass through gates to add coffee, sleeves, and lids", CANVAS_WIDTH / 2, 175);
  p.text("Avoid obstacles that destroy your cups", CANVAS_WIDTH / 2, 200);
  p.text("Serve customers at the end for coins!", CANVAS_WIDTH / 2, 225);
  
  // Controls
  p.textSize(14);
  p.text("Arrow Keys / A-D: Move between lanes", CANVAS_WIDTH / 2, 270);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.fill(255, 100, 0);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Background - gradient sky
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(200, 230, 255), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw lanes
  p.stroke(200);
  p.strokeWeight(2);
  for (let i = 1; i < NUM_LANES; i++) {
    const x = i * LANE_WIDTH;
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  
  // Draw ground line
  p.stroke(100, 150, 100);
  p.strokeWeight(4);
  p.line(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, CANVAS_HEIGHT - 30);
  
  // Render entities (from back to front)
  const sortedEntities = [...gameState.entities].sort((a, b) => {
    return (b.body?.position.y || 0) - (a.body?.position.y || 0);
  });
  
  sortedEntities.forEach(entity => {
    if (entity.render) entity.render();
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // UI
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Cups: ${gameState.player ? gameState.player.cups.length : 0}`, 10, 10);
  p.text(`Coins: ${gameState.coins}`, 10, 30);
  
  // Progress bar
  const progress = gameState.distanceTraveled / GAME_LENGTH;
  p.fill(100, 200, 100);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 20, (CANVAS_WIDTH - 20) * progress, 10);
  p.stroke(0);
  p.strokeWeight(2);
  p.noFill();
  p.rect(10, CANVAS_HEIGHT - 20, CANVAS_WIDTH - 20, 10);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderServingPhase(p) {
  p.background(245, 222, 179); // Wheat background for cafe
  
  // Draw counter
  p.fill(139, 69, 19);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  // Draw customers
  gameState.customers.forEach(customer => {
    customer.render();
  });
  
  // Draw serving animation
  if (gameState.servingIndex < gameState.player.cups.length) {
    const cup = gameState.player.cups[gameState.servingIndex];
    const customer = gameState.customers[gameState.servingIndex];
    
    // Animate cup moving to customer
    const t = gameState.servingTimer / 30;
    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT - 50;
    const endX = customer.x;
    const endY = customer.y + 30;
    
    const x = p.lerp(startX, endX, t);
    const y = p.lerp(startY, endY, t);
    
    p.push();
    p.translate(x, y);
    
    // Draw cup
    p.fill(255, 250, 240);
    p.stroke(150, 100, 50);
    p.strokeWeight(1);
    p.beginShape();
    p.vertex(-8, 12);
    p.vertex(-10, -12);
    p.vertex(10, -12);
    p.vertex(8, 12);
    p.endShape(p.CLOSE);
    
    if (cup.hasCoffee) {
      p.fill(101, 67, 33);
      p.noStroke();
      p.beginShape();
      p.vertex(-7, 8);
      p.vertex(-9, -8);
      p.vertex(9, -8);
      p.vertex(7, 8);
      p.endShape(p.CLOSE);
    }
    
    if (cup.hasSleeve) {
      p.fill(139, 69, 19);
      p.noStroke();
      p.rect(-9, -2, 18, 8);
    }
    
    if (cup.hasLid) {
      p.fill(255, 255, 255);
      p.stroke(150, 100, 50);
      p.strokeWeight(1);
      p.ellipse(0, -12, 22, 8);
    }
    
    p.pop();
    
    // Show coin value
    if (t > 0.5) {
      p.fill(255, 215, 0);
      p.stroke(0);
      p.strokeWeight(2);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.textStyle(p.BOLD);
      p.text(`+${cup.value}`, endX, endY - 40);
    }
  }
  
  // UI
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(2);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text(`Total Coins: ${gameState.coins}`, 10, 10);
}

export function renderGameOver(p) {
  p.background(50, 50, 70);
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Title
  p.fill(isWin ? 100 : 200, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text(`Coins Earned: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  p.text(`Total Coins: ${gameState.coins}`, CANVAS_WIDTH / 2, 180);
  p.text(`Cups Collected: ${gameState.cupsCollected}`, CANVAS_WIDTH / 2, 210);
  p.text(`Gates Passed: ${gameState.gatesPassed}`, CANVAS_WIDTH / 2, 240);
  p.text(`Obstacles Hit: ${gameState.obstaclesHit}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(255, 200, 0);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}