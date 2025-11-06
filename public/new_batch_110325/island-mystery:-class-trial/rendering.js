// Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, PLAY_PHASES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 10, 30);
  
  // Animated background
  for (let i = 0; i < 15; i++) {
    const x = (i * 50 + p.frameCount * 0.5) % CANVAS_WIDTH;
    p.fill(100, 50, 150, 30);
    p.rect(x, 0, 30, CANVAS_HEIGHT);
  }
  
  // Title
  p.fill(255, 100, 150);
  p.textSize(36);
  p.textAlign(p.CENTER);
  p.text("ISLAND MYSTERY", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 150, 255);
  p.textSize(20);
  p.text("Chapter 1: Beach Incident", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("INVESTIGATION PHASE:", 80, 160);
  p.textSize(12);
  p.text("• Arrow Keys: Navigate locations", 100, 185);
  p.text("• Space: Examine objects for evidence", 100, 205);
  p.text("• Shift: Quick travel between locations", 100, 225);
  
  p.textSize(14);
  p.text("TRIAL PHASE:", 80, 260);
  p.textSize(12);
  p.text("• Arrow Keys: Select evidence", 100, 285);
  p.text("• Z: Fire evidence at false statement", 100, 305);
  p.text("• Find contradictions to win!", 100, 325);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawInvestigationPhase(p) {
  const location = gameState.locations[gameState.currentLocation];
  
  // Background
  p.background(...location.color);
  
  // Location name bar
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  p.fill(255, 200, 100);
  p.textSize(24);
  p.textAlign(p.LEFT);
  p.text(location.name, 20, 35);
  
  p.fill(200);
  p.textSize(12);
  p.text(location.description, 20, 52);
  
  // Environment decorations
  drawEnvironment(p, location);
  
  // Draw interactables
  location.interactables.forEach(obj => {
    const examined = obj.examined;
    const pulse = Math.sin(p.frameCount * 0.05 + obj.pulseOffset) * 5;
    
    p.push();
    p.translate(obj.x, obj.y);
    
    // Glow effect for unexamined
    if (!examined) {
      p.fill(255, 255, 0, 50 + pulse * 5);
      p.ellipse(0, 0, 50 + pulse, 50 + pulse);
    }
    
    // Object icon
    p.fill(...(examined ? [100, 100, 100] : [255, 200, 50]));
    p.ellipse(0, 0, 30);
    p.fill(0);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("?", 0, 0);
    
    // Label
    if (gameState.player && obj.isNearby(gameState.player.x, gameState.player.y)) {
      p.fill(0, 0, 0, 180);
      p.rect(-40, -50, 80, 25, 5);
      p.fill(255);
      p.textSize(10);
      p.text(obj.name, 0, -38);
      p.textSize(8);
      p.text("SPACE", 0, -28);
    }
    
    p.pop();
  });
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // UI
  drawInvestigationUI(p);
}

function drawEnvironment(p, location) {
  p.push();
  
  if (location.id === 0) { // Beach
    // Sand
    p.fill(230, 210, 150);
    p.rect(0, 250, CANVAS_WIDTH, 150);
    // Water
    p.fill(50, 150, 200, 100);
    for (let i = 0; i < 5; i++) {
      const y = 240 + i * 8 + Math.sin(p.frameCount * 0.03 + i) * 3;
      p.rect(0, y, CANVAS_WIDTH, 8);
    }
  } else if (location.id === 1) { // Hotel Lobby
    // Floor
    p.fill(150, 130, 110);
    p.rect(0, 280, CANVAS_WIDTH, 120);
    // Reception desk
    p.fill(100, 70, 50);
    p.rect(400, 240, 150, 60);
  } else if (location.id === 2) { // Restaurant
    // Tables
    p.fill(80, 60, 40);
    p.ellipse(150, 250, 60, 40);
    p.ellipse(400, 250, 60, 40);
  } else if (location.id === 3) { // Library
    // Bookshelves
    p.fill(60, 40, 30);
    p.rect(50, 150, 80, 150);
    p.rect(470, 150, 80, 150);
  } else if (location.id === 4) { // Pool
    // Pool water
    p.fill(100, 180, 220);
    p.rect(150, 180, 300, 150, 20);
  }
  
  p.pop();
}

function drawInvestigationUI(p) {
  // Evidence counter
  p.fill(0, 0, 0, 180);
  p.rect(10, 70, 180, 60, 5);
  p.fill(255, 200, 100);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Evidence: " + gameState.evidence.length + "/" + gameState.maxEvidence, 20, 90);
  
  // Show evidence icons
  for (let i = 0; i < gameState.evidence.length; i++) {
    const x = 20 + (i % 6) * 25;
    const y = 105 + Math.floor(i / 6) * 20;
    p.fill(255, 200, 50);
    p.rect(x, y, 20, 15, 2);
  }
  
  // Location navigation hint
  p.fill(0, 0, 0, 180);
  p.rect(CANVAS_WIDTH - 190, 70, 180, 60, 5);
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.LEFT);
  p.text("Arrow Keys: Navigate", CANVAS_WIDTH - 180, 88);
  p.text("Shift: Quick Travel", CANVAS_WIDTH - 180, 105);
  p.text("Location: " + (gameState.currentLocation + 1) + "/" + gameState.locations.length, CANVAS_WIDTH - 180, 122);
  
  // Phase indicator
  if (gameState.evidence.length >= 5) {
    p.fill(100, 255, 100, 150 + Math.sin(p.frameCount * 0.1) * 100);
    p.textSize(16);
    p.textAlign(p.CENTER);
    p.text("PRESS SPACE TO BEGIN TRIAL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
}

export function drawTrialPhase(p) {
  p.background(30, 10, 20);
  
  // Courtroom background
  p.fill(80, 40, 40);
  p.rect(0, 0, CANVAS_WIDTH, 100);
  p.fill(50, 20, 20);
  p.rect(0, 100, CANVAS_WIDTH, 300);
  
  // Title
  p.fill(255, 100, 100);
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text("CLASS TRIAL", CANVAS_WIDTH / 2, 35);
  
  // Statement display
  if (gameState.currentStatement < gameState.trialStatements.length) {
    const statement = gameState.trialStatements[gameState.currentStatement];
    
    // Statement box
    p.fill(0, 0, 0, 200);
    p.rect(50, 120, CANVAS_WIDTH - 100, 100, 10);
    
    // Speaker
    p.fill(255, 200, 100);
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(statement.speaker + ":", 70, 145);
    
    // Statement text
    p.fill(255);
    p.textSize(16);
    p.text(statement.text, 70, 175, CANVAS_WIDTH - 140);
    
    // Timer bar
    const timerPercent = gameState.statementTimer / gameState.statementTimeLimit;
    p.fill(255, 0, 0, 100);
    p.rect(50, 230, (CANVAS_WIDTH - 100) * timerPercent, 10, 5);
    
    // Evidence selection UI
    drawEvidenceSelection(p);
  }
  
  // Mistakes display
  p.fill(0, 0, 0, 180);
  p.rect(CANVAS_WIDTH - 140, 10, 130, 40, 5);
  p.fill(255, 100, 100);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Mistakes: " + gameState.mistakes + "/" + gameState.maxMistakes, CANVAS_WIDTH - 130, 30);
  
  // Instructions
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.CENTER);
  p.text("Arrow Keys: Select Evidence | Z: Fire Evidence", CANVAS_WIDTH / 2, 390);
}

function drawEvidenceSelection(p) {
  const startY = 260;
  const itemHeight = 25;
  
  p.fill(0, 0, 0, 200);
  p.rect(50, startY, CANVAS_WIDTH - 100, Math.min(gameState.evidence.length, 4) * itemHeight + 10, 5);
  
  for (let i = 0; i < Math.min(gameState.evidence.length, 4); i++) {
    const evidence = gameState.evidence[i];
    const y = startY + 5 + i * itemHeight;
    
    // Selection highlight
    if (i === gameState.cursorPosition) {
      p.fill(255, 200, 50, 150);
      p.rect(55, y, CANVAS_WIDTH - 110, itemHeight - 2, 3);
    }
    
    // Evidence name
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.LEFT);
    p.text((i + 1) + ". " + evidence.name, 70, y + 17);
  }
}

export function drawPausedScreen(p) {
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.RIGHT);
  p.text("PAUSED", CANVAS_WIDTH - 20, 30);
}

export function drawGameOverScreen(p) {
  p.background(20, 10, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Result message
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(42);
  p.textAlign(p.CENTER);
  p.text(isWin ? "CASE SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text("You identified the killer!", CANVAS_WIDTH / 2, 170);
    p.text("Justice has been served.", CANVAS_WIDTH / 2, 200);
  } else {
    p.text("Too many wrong accusations.", CANVAS_WIDTH / 2, 170);
    p.text("The killer escaped...", CANVAS_WIDTH / 2, 200);
  }
  
  // Score
  p.fill(255, 200, 100);
  p.textSize(24);
  p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 250);
  
  // Stats
  p.fill(200);
  p.textSize(14);
  p.text("Evidence Collected: " + gameState.evidence.length, CANVAS_WIDTH / 2, 290);
  p.text("Mistakes Made: " + gameState.mistakes, CANVAS_WIDTH / 2, 315);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 370);
}