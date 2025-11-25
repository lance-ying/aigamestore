// ui.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(40, 30, 50);
  
  // Animated background
  for (let i = 0; i < 10; i++) {
    p.fill(255, 200, 100, 30);
    p.noStroke();
    const x = (p.frameCount * 2 + i * 60) % (CANVAS_WIDTH + 100);
    p.ellipse(x, 50 + i * 40, 40, 40);
  }
  
  // Title
  p.fill(255, 100, 100);
  p.stroke(150, 50, 50);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PIZZA TOWER", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(255, 215, 0);
  p.noStroke();
  p.textSize(16);
  p.text("Climb to the Top!", CANVAS_WIDTH / 2, 110);
  
  // Instructions box
  p.fill(60, 50, 70, 200);
  p.stroke(255, 215, 0);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH / 2 - 250, 140, 500, 180, 10);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  const instructions = [
    "OBJECTIVE: Reach the exit at the top of the tower!",
    "",
    "CONTROLS:",
    "← → : Move left and right",
    "↑ : Jump",
    "SPACE : Dash (break blocks, speed boost)",
    "Z : Ground Pound (destroy blocks below)",
    "",
    "Collect pizzas for points! Don't fall off the bottom!"
  ];
  
  let yPos = 150;
  for (let line of instructions) {
    if (line.startsWith("OBJECTIVE") || line.startsWith("CONTROLS")) {
      p.fill(255, 215, 0);
    } else {
      p.fill(255);
    }
    p.text(line, CANVAS_WIDTH / 2 - 240, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = 150 + p.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 215, 0, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p, won) {
  p.background(40, 30, 50);
  
  // Result
  if (won) {
    p.fill(100, 255, 100);
    p.stroke(50, 200, 50);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 215, 0);
    p.noStroke();
    p.textSize(24);
    p.text("Tower Conquered!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.stroke(200, 50, 50);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.noStroke();
    p.textSize(20);
    p.text("You fell off the tower!", CANVAS_WIDTH / 2, 150);
  }
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // Stats
  p.textSize(16);
  p.text(`Time: ${(gameState.timeElapsed / 60).toFixed(1)}s`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  const alpha = 150 + p.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 215, 0, alpha);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}

export function renderHUD(p) {
  // Score
  p.fill(255, 215, 0);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Pizza count
  const collected = gameState.pizzas.filter(pizza => pizza.collected).length;
  const total = gameState.pizzas.length;
  p.text(`Pizzas: ${collected}/${total}`, 10, 35);
  
  // Time
  p.text(`Time: ${(gameState.timeElapsed / 60).toFixed(1)}s`, 10, 60);
  
  // Player state indicators
  if (gameState.player) {
    if (gameState.player.dashing) {
      p.fill(255, 150, 50);
      p.text("DASHING!", CANVAS_WIDTH / 2 - 50, 10);
    }
    if (gameState.player.groundPounding) {
      p.fill(255, 100, 100);
      p.text("GROUND POUND!", CANVAS_WIDTH / 2 - 80, 10);
    }
  }
}