// ui.js - UI rendering

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  PACKAGES_TO_DELIVER, TREASURES_TO_WIN
} from './globals.js';

export function renderUI(p) {
  const phase = gameState.gamePhase;
  
  if (phase === PHASE_START) {
    renderStartScreen(p);
  } else if (phase === PHASE_PLAYING) {
    renderGameUI(p);
  } else if (phase === PHASE_PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Background
  p.background(100, 150, 200);
  
  // Decorative elements
  for (let i = 0; i < 8; i++) {
    p.fill(255, 255, 255, 30);
    p.noStroke();
    const x = 100 + i * 70;
    const y = 100 + Math.sin(p.frameCount * 0.02 + i) * 20;
    p.ellipse(x, y, 40, 40);
  }
  
  // Title
  p.fill(255, 255, 100);
  p.stroke(200, 150, 0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WOBBLY WORLD", CANVAS_WIDTH / 2, 80);
  
  // Description box
  p.fill(255, 255, 255, 200);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(50, 140, CANVAS_WIDTH - 100, 140, 10);
  
  // Description
  p.fill(50, 50, 50);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Welcome to Wobbly World!", CANVAS_WIDTH / 2, 150);
  p.textSize(12);
  p.text("Help the wobbly residents by delivering packages", CANVAS_WIDTH / 2, 175);
  p.text("and collecting treasures scattered across the island!", CANVAS_WIDTH / 2, 195);
  p.textSize(13);
  p.fill(100, 50, 150);
  p.text(`Deliver ${PACKAGES_TO_DELIVER} packages and collect ${TREASURES_TO_WIN} treasures to win!`, CANVAS_WIDTH / 2, 220);
  
  // Instructions
  p.fill(255, 255, 255, 200);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(50, 295, CANVAS_WIDTH - 100, 75, 10);
  
  p.fill(50, 50, 50);
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("CONTROLS:", 70, 305);
  p.text("Arrow Keys: Move  |  Space: Jump  |  Shift: Sprint", 70, 325);
  p.text("Z: Pick up packages / Deliver to customers", 70, 345);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 255, 255, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  
  p.pop();
}

function renderGameUI(p) {
  p.push();
  
  // Semi-transparent background for UI
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 200, 90, 5);
  
  // Score and stats
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Money: $${gameState.money}`, 20, 20);
  p.text(`Score: ${gameState.score}`, 20, 40);
  p.text(`Deliveries: ${gameState.deliveriesCompleted}/${PACKAGES_TO_DELIVER}`, 20, 60);
  p.text(`Treasures: ${gameState.treasuresCollected}/${TREASURES_TO_WIN}`, 20, 80);
  
  // Progress bars
  const barWidth = 180;
  const barHeight = 8;
  
  // Delivery progress
  p.fill(50, 50, 50);
  p.rect(220, 20, barWidth, barHeight, 4);
  p.fill(100, 200, 100);
  const deliveryProgress = (gameState.deliveriesCompleted / PACKAGES_TO_DELIVER) * barWidth;
  p.rect(220, 20, deliveryProgress, barHeight, 4);
  
  // Treasure progress
  p.fill(50, 50, 50);
  p.rect(220, 40, barWidth, barHeight, 4);
  p.fill(255, 215, 0);
  const treasureProgress = (gameState.treasuresCollected / TREASURES_TO_WIN) * barWidth;
  p.rect(220, 40, treasureProgress, barHeight, 4);
  
  // Held package indicator
  if (gameState.player && gameState.player.holdingPackage) {
    p.fill(255, 200, 100, 200);
    p.rect(10, 110, 200, 30, 5);
    p.fill(100, 50, 0);
    p.textSize(12);
    p.text("Holding Package!", 20, 120);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  // Dim overlay
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause indicator
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  const won = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Background
  if (won) {
    p.background(100, 200, 150);
  } else {
    p.background(150, 100, 100);
  }
  
  // Decorative elements
  for (let i = 0; i < 10; i++) {
    p.fill(255, 255, 255, 20);
    p.noStroke();
    const x = 50 + i * 60;
    const y = 80 + Math.sin(p.frameCount * 0.03 + i) * 30;
    p.ellipse(x, y, 50, 50);
  }
  
  // Result box
  p.fill(255, 255, 255, 220);
  p.stroke(100, 100, 100);
  p.strokeWeight(3);
  p.rect(50, 100, CANVAS_WIDTH - 100, 200, 10);
  
  // Title
  p.fill(won ? 50, 150, 50 : 150, 50, 50);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.text(won ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 140);
  
  // Stats
  p.fill(50, 50, 50);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  p.text(`Money Earned: $${gameState.money}`, CANVAS_WIDTH / 2, 215);
  p.text(`Deliveries: ${gameState.deliveriesCompleted}`, CANVAS_WIDTH / 2, 240);
  p.text(`Treasures: ${gameState.treasuresCollected}`, CANVAS_WIDTH / 2, 265);
  
  // Restart prompt
  p.fill(100, 100, 100);
  p.textSize(14);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(50, 50, 50, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  
  p.pop();
}