// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 40, 70);
  
  // Animated background pattern
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (i * 40 + p.frameCount * 0.5) % (CANVAS_WIDTH + 40);
    const y = p.sin(i * 0.5 + p.frameCount * 0.02) * 20 + CANVAS_HEIGHT / 2;
    p.fill(60, 80, 150, 80);
    p.circle(x, y, 30);
  }
  
  // Title
  p.fill(255, 230, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("TABOO CHALLENGE", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("The Ultimate Word Guessing Game", CANVAS_WIDTH / 2, 100);
  
  // Instructions box
  p.fill(50, 60, 100, 200);
  p.noStroke();
  p.rect(50, 130, CANVAS_WIDTH - 100, 180, 10);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "HOW TO PLAY:",
    "• Describe the TARGET WORD to your team",
    "• Do NOT use any of the TABOO WORDS",
    "• Press SPACE when word is guessed correctly (+1 point)",
    "• Press SPACE to skip difficult words (no penalty)",
    "• Press SHIFT if you use a taboo word (-1 point)",
    "• Complete as many rounds as you can!",
    "",
    "CONTROLS:",
    "Arrow Keys: Navigate menu | Space: Select/Correct | Shift: Incorrect"
  ];
  
  let yPos = 145;
  for (const line of instructions) {
    p.text(line, 70, yPos);
    yPos += 18;
  }
  
  // Round selection
  p.fill(255, 230, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text("SELECT NUMBER OF ROUNDS:", CANVAS_WIDTH / 2, 330);
  
  const options = [3, 4, 5];
  for (let i = 0; i < options.length; i++) {
    const x = CANVAS_WIDTH / 2 - 100 + i * 100;
    const y = 360;
    
    if (gameState.menuSelection === i) {
      p.fill(255, 200, 100);
      p.stroke(255, 230, 100);
      p.strokeWeight(3);
    } else {
      p.fill(80, 100, 150);
      p.stroke(120, 140, 180);
      p.strokeWeight(2);
    }
    
    p.rect(x - 25, y - 15, 50, 30, 5);
    
    p.fill(255);
    p.noStroke();
    p.textSize(20);
    p.text(options[i], x, y);
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const flash = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 255 * flash, 100 * flash);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 390);
}

export function drawPlayingScreen(p) {
  p.background(40, 50, 80);
  
  // Top bar
  p.fill(30, 40, 70);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Round info
  p.fill(255, 230, 100);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text(`ROUND ${gameState.currentRound + 1}/${gameState.totalRounds}`, 20, 20);
  
  // Score
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(22);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 20);
  
  // Timer
  const timeColor = gameState.roundTimeRemaining < 10 ? [255, 100, 100] : [150, 200, 255];
  p.fill(...timeColor);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(20);
  p.text(`TIME: ${Math.ceil(gameState.roundTimeRemaining)}s`, CANVAS_WIDTH - 20, 20);
  
  // Cards info
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Cards: ${gameState.cardsCompleted} ✓  ${gameState.cardsSkipped} ⊗  ${gameState.cardsIncorrect} ✗`, CANVAS_WIDTH / 2, 45);
  
  // Draw current card
  if (gameState.currentCard) {
    gameState.currentCard.x = CANVAS_WIDTH / 2 - gameState.currentCard.width / 2;
    gameState.currentCard.y = 80 + gameState.cardTransition;
    gameState.currentCard.draw(p);
  }
  
  // Action buttons hint
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("SPACE: Correct/Skip", CANVAS_WIDTH / 2 - 120, 375);
  p.text("SHIFT: Incorrect (Taboo)", CANVAS_WIDTH / 2 + 120, 375);
  
  // Feedback message
  if (gameState.feedbackTimer > 0) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.textStyle(p.BOLD);
    
    const alpha = Math.min(gameState.feedbackTimer * 10, 255);
    if (gameState.feedbackMessage === "CORRECT!") {
      p.fill(100, 255, 100, alpha);
    } else if (gameState.feedbackMessage === "SKIPPED") {
      p.fill(255, 200, 100, alpha);
    } else if (gameState.feedbackMessage === "INCORRECT!") {
      p.fill(255, 100, 100, alpha);
    }
    
    const yOffset = p.map(gameState.feedbackTimer, 30, 0, 0, -50);
    p.text(gameState.feedbackMessage, CANVAS_WIDTH / 2, 200 + yOffset);
    p.pop();
  }
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 230, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Small indicator in top right
  p.fill(255, 200, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p) {
  p.background(30, 40, 70);
  
  // Results header
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  p.fill(isWin ? [100, 255, 100] : [255, 150, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(42);
  p.textStyle(p.BOLD);
  p.text(isWin ? "EXCELLENT WORK!" : "GAME OVER", CANVAS_WIDTH / 2, 60);
  
  // Final score
  p.fill(255, 230, 100);
  p.textSize(32);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 120);
  
  // Round breakdown
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text("ROUND BREAKDOWN:", CANVAS_WIDTH / 2, 170);
  
  let yPos = 200;
  for (let i = 0; i < gameState.roundScores.length; i++) {
    const roundData = gameState.roundScores[i];
    p.textSize(16);
    p.fill(180, 180, 220);
    p.text(`Round ${i + 1}: ${roundData.score} points (${roundData.correct} correct, ${roundData.incorrect} incorrect)`, 
           CANVAS_WIDTH / 2, yPos);
    yPos += 25;
  }
  
  // Statistics
  yPos += 20;
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text(`Total Cards Completed: ${gameState.cardsCompleted}`, CANVAS_WIDTH / 2, yPos);
  p.text(`Total Cards Skipped: ${gameState.cardsSkipped}`, CANVAS_WIDTH / 2, yPos + 25);
  p.text(`Total Incorrect: ${gameState.cardsIncorrect}`, CANVAS_WIDTH / 2, yPos + 50);
  
  // Restart prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.textStyle(p.BOLD);
  const flash = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 255 * flash, 100 * flash);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
}