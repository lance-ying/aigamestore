import { gameState, GAME_PHASES, PLAY_STATES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
  }
}

function renderGameUI(p) {
  p.push();
  
  // Energy bar (top-left)
  p.fill(40);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(10, 10, 150, 25);
  
  const energyRatio = gameState.currentEnergy / gameState.maxEnergy;
  p.fill(energyRatio > 0.3 ? [100, 200, 100] : [200, 100, 100]);
  p.noStroke();
  p.rect(12, 12, 146 * energyRatio, 21);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Energy: ${gameState.currentEnergy}/${gameState.maxEnergy}`, 15, 22);
  
  // Attributes (top-right)
  p.fill(40);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 160, 10, 150, 25);
  
  p.fill(255);
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`C:${gameState.courageLevel} E:${gameState.empathyLevel} K:${gameState.knowledgeLevel}`, 
         CANVAS_WIDTH - 155, 22);
  
  // Score (top-center)
  p.fill(40);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH/2 - 75, 10, 150, 25);
  
  p.fill(220, 200, 100);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const scoreStr = String(gameState.score).padStart(5, '0');
  p.text(`SCORE: ${scoreStr}`, CANVAS_WIDTH/2, 22);
  
  // Year/Chapter (bottom-left)
  p.fill(40);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(10, CANVAS_HEIGHT - 35, 150, 25);
  
  p.fill(255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`YEAR: ${gameState.currentYear} | CH: ${gameState.currentChapter}`, 
         15, CANVAS_HEIGHT - 22);
  
  // Task progress
  if (gameState.activeTask && gameState.playState === PLAY_STATES.EXPLORATION) {
    p.fill(20, 20, 40, 220);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH/2 - 150, CANVAS_HEIGHT - 35, 300, 25);
    
    p.fill(255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    const progress = Math.min(gameState.taskProgressEnergySpent, gameState.activeTask.taskEnergy);
    p.text(`${gameState.activeTask.taskDescription} (${progress}/${gameState.activeTask.taskEnergy})`, 
           CANVAS_WIDTH/2, CANVAS_HEIGHT - 22);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 200, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.push();
  
  // Background
  p.background(20, 15, 35);
  
  // Decorative stars
  p.randomSeed(42);
  for (let i = 0; i < 50; i++) {
    p.fill(255, 255, 200, p.random(100, 255));
    p.noStroke();
    p.circle(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), p.random(1, 3));
  }
  
  // Title
  p.fill(220, 180, 100);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("HOGWARTS SPELLBOUND", CANVAS_WIDTH/2, 80);
  
  p.fill(180, 150, 80);
  p.textSize(18);
  p.text("The Cursed Scrolls", CANVAS_WIDTH/2, 115);
  
  // Description
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Unravel the mystery of the Cursed Vaults\nthrough three years at Hogwarts.\n\nComplete tasks, cast spells, and develop\nyour magical abilities.";
  p.text(desc, CANVAS_WIDTH/2, 150);
  
  // Instructions
  p.fill(180, 160, 100);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "CONTROLS:",
    "• SPACE - Advance dialogue, confirm choices",
    "• ARROW UP/DOWN - Navigate options",
    "• W/A/S/D - Spell tracing mini-games",
    "• ESC - Pause/Unpause",
    "• R - Restart from Game Over"
  ];
  
  let yPos = 240;
  for (const line of instructions) {
    p.text(line, 80, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(255, 220, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 360);
  
  p.pop();
}

export function renderGameOver(p, isWin) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(36);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("VICTORY!", CANVAS_WIDTH/2, 120);
    
    p.fill(200);
    p.textSize(14);
    p.text("You've solved the mystery of the Cursed Vaults!", CANVAS_WIDTH/2, 170);
    p.text("Hogwarts is safe once more!", CANVAS_WIDTH/2, 195);
  } else {
    p.fill(255, 100, 100);
    p.textSize(36);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH/2, 120);
    
    p.fill(200);
    p.textSize(14);
    p.text("You failed a critical spell!", CANVAS_WIDTH/2, 170);
  }
  
  // Final score
  p.fill(220, 200, 100);
  p.textSize(20);
  const scoreStr = String(gameState.score).padStart(5, '0');
  p.text(`FINAL SCORE: ${scoreStr}`, CANVAS_WIDTH/2, 230);
  
  // Stats
  p.fill(180);
  p.textSize(12);
  p.text(`Courage: ${gameState.courageLevel} | Empathy: ${gameState.empathyLevel} | Knowledge: ${gameState.knowledgeLevel}`, 
         CANVAS_WIDTH/2, 260);
  
  // Restart prompt
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 320);
  
  p.pop();
}

export function renderLevelTransition(p) {
  p.push();
  
  // Background
  p.fill(10, 10, 30, 240);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(220, 180, 100);
  p.textSize(28);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Year ${gameState.currentYear - 1} Complete!`, CANVAS_WIDTH/2, 140);
  
  p.fill(180);
  p.textSize(18);
  p.text(`Advancing to Year ${gameState.currentYear}`, CANVAS_WIDTH/2, 180);
  
  // Score bonus
  p.fill(100, 255, 100);
  p.textSize(16);
  p.text("+500 YEAR COMPLETION BONUS", CANVAS_WIDTH/2, 220);
  
  // Continue prompt
  p.fill(255, 220, 100);
  p.textSize(14);
  const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(255, 220, 100, pulse * 255);
  p.text("PRESS SPACE TO CONTINUE", CANVAS_WIDTH/2, 280);
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 100);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
  
  p.fill(200);
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
  
  p.pop();
}