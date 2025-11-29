// ui.js - User interface rendering
import { gameState } from './globals.js';
import { levels } from './levels.js';

export function drawStartScreen(p) {
  p.background(20, 25, 35);
  
  // Title
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("SAKAMOTO'S", p.width / 2, 80);
  p.textSize(52);
  p.text("DEADLY DELIVERY", p.width / 2, 130);
  
  // Description
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.CENTER);
  const desc = "Guide the deadly package to the drop-off zone!\nPlace blocks, ramps, and springs strategically.";
  p.text(desc, p.width / 2, 190);
  
  // Instructions
  p.fill(180, 220, 255);
  p.textSize(13);
  p.textAlign(p.LEFT);
  const instructions = [
    "Z/X: Select Block/Ramp (Arrow keys to rotate)",
    "SPACE: Start/Stop Simulation",
    "SHIFT: Reset Level",
    "ESC: Pause"
  ];
  let yPos = 250;
  instructions.forEach(inst => {
    p.text(inst, 120, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text("PRESS ENTER TO START", p.width / 2, 360);
}

export function drawPauseIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", p.width - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rectMode(p.CORNER);
  p.rect(0, 0, p.width, p.height);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    if (gameState.currentLevel >= levels.length) {
      // Game complete
      p.textSize(40);
      p.fill(255, 220, 100);
      p.text("ALL MISSIONS COMPLETE!", p.width / 2, 120);
      p.textSize(24);
      p.fill(255);
      p.text("FINAL SCORE: " + gameState.totalScore, p.width / 2, 180);
    } else {
      // Level complete
      p.textSize(36);
      p.fill(100, 255, 100);
      p.text("LEVEL COMPLETE!", p.width / 2, 140);
      p.textSize(20);
      p.fill(255);
      p.text("Score: " + gameState.score, p.width / 2, 200);
      p.text("Total: " + gameState.totalScore, p.width / 2, 230);
    }
  } else {
    // Level failed
    p.textSize(36);
    p.fill(255, 100, 100);
    p.text("MISSION FAILED!", p.width / 2, 150);
    p.textSize(20);
    p.fill(255);
    p.text("Score: " + gameState.score, p.width / 2, 210);
  }
  
  p.textSize(18);
  p.fill(200);
  p.text("PRESS R TO RESTART", p.width / 2, 320);
  p.pop();
}

export function drawHUD(p) {
  p.push();
  
  // Level indicator
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel + 1}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.totalScore}`, p.width - 10, 10);
  
  // Timer
  if (gameState.simulationRunning) {
    p.textAlign(p.CENTER, p.TOP);
    const timeLeft = Math.max(0, Math.ceil(gameState.timeRemaining));
    p.fill(timeLeft < 10 ? [255, 100, 100] : [255, 255, 255]);
    p.text(`TIME: ${timeLeft}`, p.width / 2, 10);
  }
  
  // Object selection UI
  if (gameState.designPhase) {
    const level = levels[gameState.currentLevel];
    const objTypes = ['block', 'ramp', 'spring'];
    const objNames = ['Block (Z)', 'Ramp (X)', 'Spring'];
    const spacing = 150;
    const startX = (p.width - spacing * 3) / 2 + spacing / 2;
    
    objTypes.forEach((type, idx) => {
      const x = startX + idx * spacing;
      const y = p.height - 40;
      const remaining = level.maxObjects[type] - gameState.objectsPlaced[type];
      const isSelected = gameState.selectedObject === type;
      
      // Box
      p.fill(isSelected ? [100, 150, 255] : [60, 60, 80]);
      p.stroke(255);
      p.strokeWeight(isSelected ? 3 : 1);
      p.rectMode(p.CENTER);
      p.rect(x, y, 120, 30, 5);
      
      // Text
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(`${objNames[idx]}: ${remaining}`, x, y);
    });
    
    // Phase indicator
    p.fill(200, 200, 100);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("DESIGN PHASE - SPACE to simulate", 10, 35);
  } else if (gameState.simulationRunning) {
    p.fill(255, 200, 100);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("SIMULATION RUNNING - SPACE to stop", 10, 35);
  }
  
  p.pop();
}

export function drawGhostObject(p, mouseX, mouseY) {
  if (!gameState.designPhase) return;
  
  const level = levels[gameState.currentLevel];
  const remaining = level.maxObjects[gameState.selectedObject] - gameState.objectsPlaced[gameState.selectedObject];
  
  if (remaining <= 0) return;
  
  p.push();
  p.translate(mouseX, mouseY);
  p.rotate(gameState.rotationAngle);
  
  p.strokeWeight(2);
  p.stroke(100, 255, 100, 150);
  p.fill(120, 120, 120, 100);
  
  switch (gameState.selectedObject) {
    case 'block':
      p.rectMode(p.CENTER);
      p.rect(0, 0, 50, 50);
      break;
    case 'ramp':
      p.beginShape();
      p.vertex(-50, 25);
      p.vertex(50, 25);
      p.vertex(50, -25);
      p.endShape(p.CLOSE);
      break;
    case 'spring':
      p.fill(50, 100, 200, 100);
      p.rectMode(p.CENTER);
      p.rect(0, 0, 80, 20);
      break;
  }
  
  p.pop();
}