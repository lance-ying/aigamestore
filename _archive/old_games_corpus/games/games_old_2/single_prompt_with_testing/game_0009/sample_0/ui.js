// ui.js - UI rendering and interaction

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  DESIGN_PHASE,
  SIMULATE_PHASE,
  gameState
} from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 40, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FREEWAYS", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200);
  p.textSize(18);
  p.text("Traffic Engineer Simulator", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "Design efficient freeway interchanges to manage traffic flow.",
    "Connect entry points (green) to exit points (red) with roads.",
    "Achieve 3-star ratings by preventing traffic jams!",
    "",
    "DESIGN PHASE:",
    "• Arrow Keys: Navigate",
    "• Space: Place road segment / Start simulation",
    "• Shift: Toggle draw/erase mode",
    "• Z: Undo last segment",
    "",
    "SIMULATION PHASE:",
    "• Watch your design handle traffic for 60 seconds",
    "• Avoid jams (10+ cars stuck for 5+ seconds)",
    "",
    "PRESS ENTER TO START"
  ];
  
  let y = 160;
  for (const line of instructions) {
    if (line.startsWith("•")) {
      p.fill(180, 200, 220);
    } else if (line === "") {
      y += 5;
      continue;
    } else {
      p.fill(255, 220, 100);
    }
    p.text(line, 80, y);
    y += 20;
  }
  
  // Press enter prompt (blinking)
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function drawGameUI(p) {
  // Level info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level ${gameState.currentLevel}`, 10, 10);
  
  if (gameState.designPhase === DESIGN_PHASE) {
    // Design phase UI
    p.text(`Mode: ${gameState.selectedTool}`, 10, 30);
    p.text(`Segments: ${gameState.roadSegments.length}`, 10, 50);
    p.text("Space: Place/Simulate | Shift: Toggle | Z: Undo", 10, 70);
  } else {
    // Simulation phase UI
    const timeLeft = Math.max(0, gameState.levelData.timeLimit - gameState.simulationTime);
    p.text(`Time: ${timeLeft.toFixed(1)}s`, 10, 30);
    p.text(`Completed: ${gameState.completedVehicles}/${gameState.totalVehicles}`, 10, 50);
    p.text(`Efficiency: ${(gameState.efficiency * 100).toFixed(0)}%`, 10, 70);
    
    // Star display
    drawStars(p, gameState.stars, 10, 90);
  }
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawStars(p, count, x, y) {
  p.push();
  for (let i = 0; i < 3; i++) {
    if (i < count) {
      p.fill(255, 220, 0);
    } else {
      p.fill(80, 80, 80);
    }
    drawStar(p, x + i * 25, y, 8, 4, 5);
  }
  p.pop();
}

function drawStar(p, x, y, radius1, radius2, npoints) {
  const angle = p.TWO_PI / npoints;
  const halfAngle = angle / 2.0;
  
  p.beginShape();
  for (let a = -p.HALF_PI; a < p.TWO_PI - p.HALF_PI; a += angle) {
    let sx = x + p.cos(a) * radius1;
    let sy = y + p.sin(a) * radius1;
    p.vertex(sx, sy);
    sx = x + p.cos(a + halfAngle) * radius2;
    sy = y + p.sin(a + halfAngle) * radius2;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

export function drawGameOverScreen(p) {
  p.background(30, 40, 50);
  
  const won = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(...(won ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "LEVEL COMPLETE!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.fill(220);
  p.textSize(20);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 140);
  p.text(`Vehicles Completed: ${gameState.completedVehicles}/${gameState.totalVehicles}`, CANVAS_WIDTH / 2, 170);
  p.text(`Efficiency: ${(gameState.efficiency * 100).toFixed(1)}%`, CANVAS_WIDTH / 2, 200);
  
  // Stars
  drawStars(p, gameState.stars, CANVAS_WIDTH / 2 - 37, 230);
  
  // Message
  p.textSize(16);
  if (won) {
    p.fill(150, 255, 150);
    p.text("Excellent traffic management!", CANVAS_WIDTH / 2, 280);
    if (gameState.currentLevel < 4) {
      p.text("Next level unlocked!", CANVAS_WIDTH / 2, 305);
    } else {
      p.fill(255, 220, 100);
      p.text("You've completed all levels!", CANVAS_WIDTH / 2, 305);
    }
  } else {
    p.fill(255, 150, 150);
    p.text("Traffic congestion was too high.", CANVAS_WIDTH / 2, 280);
    p.text("Try redesigning your interchange!", CANVAS_WIDTH / 2, 305);
  }
  
  // Restart prompt
  p.fill(200);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
}

export function drawEntryExitPoints(p) {
  // Draw entry points (green)
  for (const entry of gameState.entryPoints) {
    p.fill(100, 255, 100);
    p.stroke(50, 200, 50);
    p.strokeWeight(2);
    p.circle(entry.x, entry.y, 20);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("IN", entry.x, entry.y);
  }
  
  // Draw exit points (red)
  for (const exit of gameState.exitPoints) {
    p.fill(255, 100, 100);
    p.stroke(200, 50, 50);
    p.strokeWeight(2);
    p.circle(exit.x, exit.y, 20);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("OUT", exit.x, exit.y);
  }
}