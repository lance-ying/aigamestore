import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function drawUI(p) {
  // Money display
  p.push();
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`$${gameState.money.toLocaleString()}`, 10, 10);
  
  // Assets
  if (gameState.assets > 0) {
    p.fill(100, 255, 100);
    p.text(`Assets: $${gameState.assets.toLocaleString()}`, 10, 30);
  }
  
  // Life Points
  p.fill(255, 150, 255);
  p.text(`Life Points: ${gameState.lifePoints}`, 10, 50);
  
  // Career level
  if (gameState.careerLevel > 0) {
    p.fill(255, 180, 50);
    p.text(`Career Lvl: ${gameState.careerLevel}`, 10, 70);
  }
  
  // Progress
  p.fill(200);
  p.textSize(12);
  p.text(`Space ${gameState.currentSpace + 1}/${gameState.totalSpaces}`, CANVAS_WIDTH - 100, 10);
  
  p.pop();
}

export function drawPauseIndicator(p) {
  p.push();
  p.fill(255, 255, 0);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawDecisionUI(p, options, selectedIndex) {
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2;
  
  // Background
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Decision box
  p.fill(40);
  p.stroke(255);
  p.strokeWeight(3);
  p.rectMode(p.CENTER);
  p.rect(x, y, 450, 250, 10);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text("Make Your Choice", x, y - 100);
  
  // Options
  p.textSize(14);
  const optionY = y - 50;
  const spacing = 40;
  
  for (let i = 0; i < options.length; i++) {
    const yPos = optionY + i * spacing;
    
    if (i === selectedIndex) {
      p.fill(255, 215, 0);
      p.text("→ ", x - 180, yPos);
    } else {
      p.fill(200);
    }
    
    p.textAlign(p.LEFT, p.CENTER);
    p.text(options[i].text, x - 160, yPos);
    p.pop();
  }
  
  // Instructions
  p.push();
  p.fill(150);
  p.noStroke();
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text("Use ↑↓ or ←→ to select, SPACE to confirm", x, y + 110);
  p.pop();
}