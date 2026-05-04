// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(230, 240, 255);
  
  // Title
  p.fill(80, 60, 40);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("Sugar, Sugar", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.fill(100);
  p.text("Physics Puzzle Game", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(60);
  
  const instructions = [
    "Guide sugar into cups by drawing lines!",
    "",
    "How to Play:",
    "• Sugar falls from the top continuously",
    "• Draw lines to redirect the sugar flow",
    "• Fill all cups to their target amounts",
    "• Match colored sugar to colored cups",
    "",
    "Controls:",
    "• Arrow Keys: Move cursor",
    "• Space: Place/remove line segment",
    "• Shift: Clear all lines",
    "• ESC: Pause game"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 150, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  
  // Blinking effect
  if (p.frameCount % 60 < 40) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGame(p) {
  // Background
  p.background(245, 240, 235);
  
  // Draw grid
  p.stroke(220, 215, 210);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 50) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity && entity.render) {
      entity.render();
    }
  });
  
  // Render drawn lines
  gameState.drawnLines.forEach(line => {
    if (line && line.render) {
      line.render();
    }
  });
  
  // Render sugar source
  if (gameState.sugarSource) {
    gameState.sugarSource.render();
  }
  
  // Render cursor in HUMAN mode
  if (gameState.controlMode === 'HUMAN' && gameState.gamePhase === GAME_PHASES.PLAYING) {
    p.push();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.noFill();
    p.circle(gameState.cursorX, gameState.cursorY, 10);
    p.line(gameState.cursorX - 8, gameState.cursorY, gameState.cursorX + 8, gameState.cursorY);
    p.line(gameState.cursorX, gameState.cursorY - 8, gameState.cursorX, gameState.cursorY + 8);
    p.pop();
    
    // If drawing line, show preview
    if (gameState.drawingLine) {
      p.push();
      p.stroke(255, 100, 100, 150);
      p.strokeWeight(3);
      p.line(gameState.lineStartX, gameState.lineStartY, gameState.cursorX, gameState.cursorY);
      p.pop();
    }
  }
  
  // UI
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  p.fill(255, 255, 255, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  p.fill(60);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  
  // Level
  p.text(`Level: ${gameState.currentLevel}`, 10, 18);
  
  // Sugar remaining
  const remaining = gameState.maxSugarPerLevel - gameState.totalSugarProduced;
  p.text(`Sugar: ${remaining}/${gameState.maxSugarPerLevel}`, 120, 18);
  
  // Lines budget
  const linesUsed = Math.floor(gameState.lineDrawingUsed);
  const linesBudget = gameState.lineDrawingBudget;
  p.text(`Lines: ${linesUsed}/${linesBudget}`, 280, 18);
  
  // Cup progress
  let allFilled = true;
  gameState.cups.forEach((cup, i) => {
    const progress = cup.getFillPercentage();
    if (progress < 100) allFilled = false;
  });
  
  p.text(`Cups: ${gameState.cups.filter(c => c.isFilled()).length}/${gameState.cups.length}`, 450, 18);
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.pop();
}

export function renderGameOver(p) {
  p.background(245, 240, 235);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.fill(isWin ? [100, 200, 100] : [200, 100, 100]);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(60);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  
  let yPos = 180;
  p.text(`Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, yPos);
  yPos += 40;
  
  // Cup stats
  gameState.cups.forEach((cup, i) => {
    const status = cup.isFilled() ? "✓" : "✗";
    const color = cup.isFilled() ? [100, 200, 100] : [200, 100, 100];
    p.fill(color);
    p.text(`${status} Cup ${i + 1}: ${cup.currentAmount}/${cup.targetAmount}`, CANVAS_WIDTH / 2, yPos);
    yPos += 30;
  });
  
  yPos += 20;
  
  // Instructions
  p.fill(255, 100, 100);
  p.textSize(20);
  p.textStyle(p.BOLD);
  
  if (p.frameCount % 60 < 40) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, yPos);
  }
  
  p.pop();
}