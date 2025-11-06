// rendering.js - All rendering functions

import { gameState, GAME_PHASES, DEDUCTION_STAGES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 20, 50);
  
  // Title with glow effect
  p.fill(180, 120, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MYSTERIUM", CANVAS_WIDTH / 2, 80);
  
  p.fill(150, 100, 200);
  p.textSize(20);
  p.text("Digital Deduction", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 190, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "You are a Psychic solving a murder mystery.\nThe Ghost sends you vision cards as clues.\nMatch the visions to identify the Suspect,\nLocation, and Weapon.";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(220, 200, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Controls:", 100, 260);
  p.textSize(12);
  p.fill(180, 170, 200);
  p.text("← → : Navigate cards", 100, 285);
  p.text("SPACE: Select card", 100, 305);
  p.text("Z: View vision (hold)", 100, 325);
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulse = 200 + p.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 220, 100, pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  // Decorative elements
  drawMysticalParticles(p);
}

export function drawPlayingScreen(p) {
  p.background(45, 35, 65);
  
  // Draw UI background
  p.fill(30, 25, 45);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Draw current stage indicator
  drawStageIndicator(p);
  
  // Draw score
  p.fill(255, 220, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 20, 30);
  
  // Draw round info
  p.fill(180, 200, 255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Stage ${gameState.stagesCompleted + 1}/3`, CANVAS_WIDTH - 20, 30);
  
  // Draw vision card (left side)
  if (gameState.visionCard) {
    p.push();
    p.translate(80, 130);
    gameState.visionCard.draw(p, false, 1);
    p.pop();
    
    p.fill(200, 180, 220);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("Ghost's Vision", 140, 300);
  }
  
  // Draw current stage cards
  drawStageCards(p);
  
  // Draw player character
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw instruction
  p.fill(180, 170, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text("Use ← → to select, SPACE to confirm", CANVAS_WIDTH / 2, 375);
}

function drawStageIndicator(p) {
  const stages = ['SUSPECT', 'LOCATION', 'WEAPON'];
  const stageX = 250;
  
  for (let i = 0; i < stages.length; i++) {
    const x = stageX + i * 70;
    const y = 30;
    
    // Draw stage bubble
    if (stages[i] === gameState.currentStage) {
      p.fill(100, 200, 255);
      p.stroke(150, 220, 255);
    } else if (i < gameState.stagesCompleted) {
      p.fill(80, 180, 100);
      p.stroke(100, 200, 120);
    } else {
      p.fill(60, 55, 80);
      p.stroke(80, 75, 100);
    }
    
    p.strokeWeight(2);
    p.circle(x, y, 24);
    
    // Draw checkmark if completed
    if (i < gameState.stagesCompleted) {
      p.stroke(255);
      p.strokeWeight(2);
      p.line(x - 5, y, x - 2, y + 4);
      p.line(x - 2, y + 4, x + 5, y - 4);
    }
  }
}

function drawStageCards(p) {
  const currentCards = getCurrentCards();
  if (!currentCards || currentCards.length === 0) return;
  
  const startX = 280;
  const startY = 130;
  const spacing = 95;
  
  for (let i = 0; i < currentCards.length; i++) {
    const card = currentCards[i];
    const x = startX + (i % 2) * spacing;
    const y = startY + Math.floor(i / 2) * 120;
    
    p.push();
    p.translate(x, y);
    card.draw(p, i === gameState.currentSelection, 1);
    p.pop();
  }
}

function getCurrentCards() {
  switch (gameState.currentStage) {
    case DEDUCTION_STAGES.SUSPECT:
      return gameState.suspectCards;
    case DEDUCTION_STAGES.LOCATION:
      return gameState.locationCards;
    case DEDUCTION_STAGES.WEAPON:
      return gameState.weaponCards;
    default:
      return [];
  }
}

export function drawPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 35);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(100, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42);
    p.text("MYSTERY SOLVED!", CANVAS_WIDTH / 2, 80);
    
    p.fill(80, 200, 120);
    p.textSize(18);
    p.text("The spirits rest easy now...", CANVAS_WIDTH / 2, 130);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42);
    p.text("MYSTERY UNSOLVED", CANVAS_WIDTH / 2, 80);
    
    p.fill(200, 80, 80);
    p.textSize(18);
    p.text("The truth remains hidden...", CANVAS_WIDTH / 2, 130);
  }
  
  // Results
  p.fill(200, 190, 220);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Correct: ${gameState.correctGuesses}/3`, CANVAS_WIDTH / 2, 210);
  p.text(`Incorrect: ${gameState.incorrectGuesses}/3`, CANVAS_WIDTH / 2, 240);
  
  // Show answers
  p.textSize(14);
  p.fill(180, 170, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Your Deductions:", 100, 280);
  
  p.textSize(12);
  const suspectCorrect = gameState.selectedSuspect === gameState.correctSuspect;
  const locationCorrect = gameState.selectedLocation === gameState.correctLocation;
  const weaponCorrect = gameState.selectedWeapon === gameState.correctWeapon;
  
  p.fill(...(suspectCorrect ? [100, 255, 150] : [255, 100, 100]));
  p.text(`Suspect: Card ${gameState.selectedSuspect + 1} ${suspectCorrect ? '✓' : '✗'}`, 120, 305);
  
  p.fill(...(locationCorrect ? [100, 255, 150] : [255, 100, 100]));
  p.text(`Location: Card ${gameState.selectedLocation + 1} ${locationCorrect ? '✓' : '✗'}`, 120, 325);
  
  p.fill(...(weaponCorrect ? [100, 255, 150] : [255, 100, 100]));
  p.text(`Weapon: Card ${gameState.selectedWeapon + 1} ${weaponCorrect ? '✓' : '✗'}`, 120, 345);
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const pulse = 200 + p.sin(p.frameCount * 0.1) * 55;
  p.fill(255, 220, 100, pulse);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
}

function drawMysticalParticles(p) {
  for (let i = 0; i < 30; i++) {
    const x = (p.frameCount * 0.5 + i * 50) % CANVAS_WIDTH;
    const y = 100 + p.sin((p.frameCount + i * 30) * 0.02) * 150;
    const size = 2 + p.sin((p.frameCount + i * 20) * 0.05) * 2;
    const alpha = 100 + p.sin((p.frameCount + i * 15) * 0.03) * 100;
    
    p.fill(180, 150, 255, alpha);
    p.noStroke();
    p.circle(x, y, size);
  }
}

export function drawUI(p) {
  // Additional UI elements if needed
}