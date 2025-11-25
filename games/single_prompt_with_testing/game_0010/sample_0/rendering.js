// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 35, 30);
  
  // Title with decorative border
  p.fill(180, 50, 50);
  p.rect(50, 30, CANVAS_WIDTH - 100, 80);
  p.fill(220, 200, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("GRESTIN BORDER CHECKPOINT", CANVAS_WIDTH / 2, 60);
  p.textSize(14);
  p.text("Glory to Arstotzka", CANVAS_WIDTH / 2, 90);
  
  // Instructions
  p.fill(220, 200, 180);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  let y = 140;
  
  p.text("OBJECTIVE:", 50, y);
  y += 20;
  p.text("Process travelers entering Arstotzka. Check their documents", 50, y);
  y += 15;
  p.text("for discrepancies. Meet your quota with good accuracy.", 50, y);
  y += 25;
  
  p.text("INSPECTION CHECKLIST:", 50, y);
  y += 20;
  p.text("• Passport and Permit names must match", 60, y);
  y += 15;
  p.text("• ID numbers must match exactly", 60, y);
  y += 15;
  p.text("• Documents must not be expired (2024+)", 60, y);
  y += 15;
  p.text("• City must be valid Arstotzkan location", 60, y);
  y += 25;
  
  p.text("CONTROLS:", 50, y);
  y += 20;
  p.text("ARROW KEYS: Select documents/buttons", 60, y);
  y += 15;
  p.text("SHIFT: Toggle inspect mode", 60, y);
  y += 15;
  p.text("SPACE: Approve traveler", 60, y);
  y += 15;
  p.text("Z: Deny traveler", 60, y);
  y += 30;
  
  // Prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 220 * pulse, 100 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawGame(p) {
  // Background
  p.background(60, 55, 50);
  
  // Draw current traveler and documents
  if (gameState.currentTraveler) {
    gameState.currentTraveler.draw(p);
    
    // Highlight selected document
    if (gameState.selectedDocument !== null) {
      const doc = gameState.currentTraveler.documents[gameState.selectedDocument];
      p.noFill();
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
      p.rect(doc.x - 3, doc.y - 3, doc.width + 6, doc.height + 6);
    }
    
    // Inspect mode overlay
    if (gameState.inspectMode && gameState.selectedDocument !== null) {
      p.fill(0, 0, 0, 200);
      p.noStroke();
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const doc = gameState.currentTraveler.documents[gameState.selectedDocument];
      const scale = 1.5;
      const offsetX = CANVAS_WIDTH / 2 - (doc.width * scale) / 2 - doc.x;
      const offsetY = CANVAS_HEIGHT / 2 - (doc.height * scale) / 2 - doc.y;
      
      p.push();
      p.scale(scale);
      doc.draw(p, offsetX / scale, offsetY / scale);
      p.pop();
      
      p.fill(255, 220, 100);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text("INSPECT MODE - Press SHIFT to exit", CANVAS_WIDTH / 2, 20);
    }
  } else {
    // No more travelers
    p.fill(220, 200, 180);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("Processing complete...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // UI Panel
  drawUI(p);
  
  // Message display
  if (gameState.messageTimer > 0) {
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(100, 50, CANVAS_WIDTH - 200, 40);
    
    const correct = gameState.message.includes("CORRECT");
    p.fill(...(correct ? [100, 255, 100] : [255, 100, 100]));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(gameState.message, CANVAS_WIDTH / 2, 70);
  }
  
  // Action buttons
  drawActionButtons(p);
}

export function drawUI(p) {
  // Top UI bar
  p.fill(40, 35, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  p.fill(220, 200, 180);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  p.text(`DAY ${gameState.day} | QUOTA: ${gameState.processed}/${gameState.quota}`, 10, 17);
  
  p.textAlign(p.CENTER, p.CENTER);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 17);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`CREDITS: ${gameState.score}`, CANVAS_WIDTH - 10, 17);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(10);
    p.fill(255, 220, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  }
}

export function drawActionButtons(p) {
  if (!gameState.currentTraveler || gameState.inspectMode) return;
  
  const buttonY = 360;
  const approveX = 150;
  const denyX = 350;
  const buttonW = 100;
  const buttonH = 30;
  
  // Approve button
  const approveSelected = gameState.uiState.selectedButton === "approve";
  p.fill(...(approveSelected ? [100, 180, 100] : [80, 140, 80]));
  p.stroke(220, 200, 180);
  p.strokeWeight(2);
  p.rect(approveX, buttonY, buttonW, buttonH);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("APPROVE", approveX + buttonW / 2, buttonY + buttonH / 2);
  p.textSize(9);
  p.text("(SPACE)", approveX + buttonW / 2, buttonY + buttonH / 2 + 12);
  
  // Deny button
  const denySelected = gameState.uiState.selectedButton === "deny";
  p.fill(...(denySelected ? [180, 80, 80] : [140, 60, 60]));
  p.stroke(220, 200, 180);
  p.strokeWeight(2);
  p.rect(denyX, buttonY, buttonW, buttonH);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("DENY", denyX + buttonW / 2, buttonY + buttonH / 2);
  p.textSize(9);
  p.text("(Z)", denyX + buttonW / 2, buttonY + buttonH / 2 + 12);
}

export function drawGameOver(p) {
  p.background(40, 35, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Result box
  p.fill(...(isWin ? [80, 120, 80] : [120, 60, 60]));
  p.rect(100, 80, CANVAS_WIDTH - 200, 200);
  
  p.fill(220, 200, 180);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text(isWin ? "SHIFT COMPLETE" : "DISMISSED", CANVAS_WIDTH / 2, 120);
  
  p.textSize(14);
  p.text(gameState.message, CANVAS_WIDTH / 2, 160);
  
  p.textSize(12);
  p.text(`Processed: ${gameState.processed}`, CANVAS_WIDTH / 2, 200);
  p.text(`Correct: ${gameState.correctDecisions} | Wrong: ${gameState.wrongDecisions}`, CANVAS_WIDTH / 2, 220);
  p.text(`Final Credits: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(14);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * pulse, 220 * pulse, 100 * pulse);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}