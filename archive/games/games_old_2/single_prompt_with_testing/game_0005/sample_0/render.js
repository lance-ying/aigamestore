// render.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MATERIAL_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("POLY BRIDGE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 255);
  p.textSize(14);
  p.text("Build bridges to guide vehicles across gaps", CANVAS_WIDTH / 2, 140);
  p.text("Use different materials with unique properties", CANVAS_WIDTH / 2, 160);
  p.text("Stay within budget and make sure your bridge holds!", CANVAS_WIDTH / 2, 180);
  
  // Controls
  p.fill(255, 255, 150);
  p.textSize(12);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 220);
  p.fill(255);
  p.textSize(11);
  p.text("Arrow Keys: Move cursor", CANVAS_WIDTH / 2, 245);
  p.text("SPACE: Place/Connect node", CANVAS_WIDTH / 2, 265);
  p.text("A/D: Cycle materials", CANVAS_WIDTH / 2, 285);
  p.text("S: Start simulation", CANVAS_WIDTH / 2, 305);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw terrain
  gameState.terrain.forEach(terrain => {
    terrain.render(p);
  });
  
  // Draw start and end zones
  p.fill(100, 200, 100, 100);
  p.noStroke();
  p.rect(gameState.startPoint.x - 40, gameState.startPoint.y - 60, 80, 80);
  
  p.fill(255, 200, 100, 100);
  p.rect(gameState.endPoint.x - 40, gameState.endPoint.y - 60, 80, 80);
  
  // Draw anchor points
  gameState.anchorPoints.forEach(anchor => {
    anchor.render(p);
  });
  
  // Draw placed nodes
  gameState.placedNodes.forEach(node => {
    node.render(p);
  });
  
  // Draw segments
  gameState.segments.forEach(segment => {
    segment.render(p);
  });
  
  // Draw vehicles
  gameState.vehicles.forEach(vehicle => {
    vehicle.render(p);
  });
  
  // Draw cursor (only when not simulating)
  if (!gameState.isSimulating) {
    p.push();
    p.fill(255, 255, 0, 150);
    p.noStroke();
    p.circle(gameState.cursor.x, gameState.cursor.y, 16);
    p.stroke(255, 255, 0);
    p.strokeWeight(2);
    p.line(gameState.cursor.x - 12, gameState.cursor.y, gameState.cursor.x + 12, gameState.cursor.y);
    p.line(gameState.cursor.x, gameState.cursor.y - 12, gameState.cursor.x, gameState.cursor.y + 12);
    p.pop();
  }
  
  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  // Budget display
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(5, 5, 200, 80, 5);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Budget: $${gameState.budget - gameState.spentBudget}`, 15, 15);
  p.text(`Spent: $${gameState.spentBudget}`, 15, 35);
  
  // Material display
  if (!gameState.isSimulating) {
    const mat = MATERIAL_TYPES[gameState.currentMaterial];
    p.fill(mat.color);
    p.text(`Material: ${mat.name} ($${mat.cost})`, 15, 55);
  }
  
  // Vehicle counter
  p.fill(0, 0, 0, 150);
  p.rect(395, 5, 200, 40, 5);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Vehicles: ${gameState.vehiclesSpawned}/${gameState.totalVehicles}`, 405, 15);
  
  // Instructions
  if (!gameState.simulationStarted) {
    p.fill(255, 255, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("Press S to start simulation", CANVAS_WIDTH / 2, 380);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "SUCCESS!" : "BRIDGE FAILED!", CANVAS_WIDTH / 2, 100);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text("All vehicles crossed safely!", CANVAS_WIDTH / 2, 160);
    p.text(`Budget used: $${gameState.spentBudget}`, CANVAS_WIDTH / 2, 190);
  } else {
    p.text("Your bridge couldn't support the vehicles", CANVAS_WIDTH / 2, 160);
    p.text("Try a stronger design!", CANVAS_WIDTH / 2, 190);
  }
  
  // Stats
  p.textSize(14);
  p.text(`Vehicles crossed: ${gameState.vehicles.filter(v => v.crossed).length}/${gameState.totalVehicles}`, CANVAS_WIDTH / 2, 230);
  p.text(`Segments placed: ${gameState.segments.length}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  const alpha = 128 + 127 * Math.sin(p.frameCount * 0.1);
  p.fill(100, 200, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}