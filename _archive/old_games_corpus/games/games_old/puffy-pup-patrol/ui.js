// ui.js - UI rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';

export function drawStartScreen(p) {
  p.background(220, 240, 255);
  
  // Title
  p.fill(80, 50, 30);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('Puffy Pup Patrol', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(100, 70, 50);
  p.text('Save Your Stressed Pup!', CANVAS_WIDTH / 2, 130);
  
  // Instructions box
  p.fill(255, 250, 240);
  p.stroke(150, 120, 90);
  p.strokeWeight(2);
  p.rect(50, 160, CANVAS_WIDTH - 100, 160, 10);
  
  // Instructions
  p.fill(60, 40, 30);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'HOW TO PLAY:',
    '• Use ARROW KEYS to move your cursor',
    '• Press SPACE to start/confirm drawing',
    '• Trace the glowing patterns over your pup\'s head',
    '• Keep the Swelling Meter below 100%!',
    '• Complete all 5 levels to become Master Healer'
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], 70, 175 + i * 22);
  }
  
  // Start prompt
  p.fill(200, 100, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  const pulse = (p.sin(p.frameCount * 0.1) + 1) / 2;
  p.fill(200, 100, 50, 150 + pulse * 105);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  
  // High score
  if (gameState.highScore > 0) {
    p.fill(100, 70, 50);
    p.textSize(16);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 340);
  }
}

export function drawPlayingUI(p) {
  // Score
  p.fill(60, 40, 30);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);
  
  // Swelling meter
  const meterX = 50;
  const meterY = CANVAS_HEIGHT - 40;
  const meterWidth = CANVAS_WIDTH - 100;
  const meterHeight = 25;
  
  // Meter background
  p.fill(200, 200, 200);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(meterX, meterY, meterWidth, meterHeight, 5);
  
  // Meter fill
  const fillWidth = (gameState.swellingMeter / 100) * meterWidth;
  const meterColor = gameState.swellingMeter < 50 ? [100, 255, 100] :
                     gameState.swellingMeter < 75 ? [255, 200, 100] :
                     [255, 100, 100];
  p.fill(...meterColor);
  p.noStroke();
  p.rect(meterX, meterY, fillWidth, meterHeight, 5);
  
  // Meter label
  p.fill(60, 40, 30);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('Swelling Meter', CANVAS_WIDTH / 2, meterY - 15);
  
  // Heal counter
  const config = LEVEL_CONFIG[gameState.currentLevel - 1];
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`Heals: ${gameState.successfulHeals} / ${config.requiredHeals}`, CANVAS_WIDTH / 2, 35);
  
  // Time limit (if applicable)
  if (config.timeLimit) {
    const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
    const remaining = Math.max(0, config.timeLimit - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 55);
  }
  
  // Feedback message
  if (gameState.feedbackMessage && gameState.feedbackTimer > 0) {
    const alpha = Math.min(255, gameState.feedbackTimer * 8);
    p.fill(255, 255, 255, alpha);
    p.stroke(0, 0, 0, alpha);
    p.strokeWeight(3);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.feedbackMessage, CANVAS_WIDTH / 2, 120);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 10, 35);
  }
}

export function drawGameOverScreen(p, isWin) {
  p.background(isWin ? [200, 255, 200] : [255, 200, 200]);
  
  // Title
  p.fill(60, 40, 30);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(20);
  if (isWin) {
    p.text('Congratulations! You saved your Pup!', CANVAS_WIDTH / 2, 160);
    p.text('You are the Master Healer!', CANVAS_WIDTH / 2, 190);
  } else {
    p.text('Your pup got too stressed!', CANVAS_WIDTH / 2, 160);
    p.text('Try again to improve your skills!', CANVAS_WIDTH / 2, 190);
  }
  
  // Scores
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  p.textSize(18);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(100, 70, 50);
  p.textSize(24);
  const pulse = (p.sin(p.frameCount * 0.1) + 1) / 2;
  p.fill(100, 70, 50, 150 + pulse * 105);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 340);
}

export function drawLevelTransition(p) {
  p.background(240, 240, 255);
  
  const config = LEVEL_CONFIG[gameState.currentLevel - 1];
  
  p.fill(80, 50, 30);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`Level ${config.level}`, CANVAS_WIDTH / 2, 150);
  
  p.textSize(28);
  p.fill(100, 70, 50);
  p.text(config.name, CANVAS_WIDTH / 2, 200);
  
  // Objective
  p.textSize(18);
  p.fill(60, 40, 30);
  p.text(`Heal your pup ${config.requiredHeals} times`, CANVAS_WIDTH / 2, 250);
  
  if (config.timeLimit) {
    p.text(`Time Limit: ${config.timeLimit} seconds`, CANVAS_WIDTH / 2, 280);
  }
  
  // Continue prompt
  p.fill(100, 70, 50);
  p.textSize(20);
  const pulse = (p.sin(p.frameCount * 0.1) + 1) / 2;
  p.fill(100, 70, 50, 150 + pulse * 105);
  p.text('Press SPACE or wait...', CANVAS_WIDTH / 2, 340);
}