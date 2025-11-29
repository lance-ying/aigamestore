// ui.js - UI rendering

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, CONFIG } from './globals.js';

// Render start screen
export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title with shadow
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Shadow
  p.fill(0, 0, 0, 100);
  p.textSize(52);
  p.text('MOUNT YOUR FRIENDS', CANVAS_WIDTH / 2 + 3, 60 + 3);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(52);
  p.text('MOUNT YOUR FRIENDS', CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(18);
  p.text('A Physics-Based Climbing Challenge', CANVAS_WIDTH / 2, 100);
  
  // Instructions box
  p.fill(40, 50, 70, 200);
  p.stroke(100, 120, 150);
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20, 500, 180, 10);
  
  // Instructions
  p.noStroke();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'HOW TO PLAY:',
    'Climb to the top of the tower before time runs out!',
    '',
    'CONTROLS:',
    '← → : Move / Grab limbs    ↑ : Pull up (when grabbing)',
    '↓ : Let go / Drop           SPACE : Jump',
    'SHIFT : Sprint              Z : Quick grab nearest limb',
    '',
    'TIP: Hold ↑ longer for a powerful fling!'
  ];
  
  let yOffset = CANVAS_HEIGHT / 2 - 60;
  for (const line of instructions) {
    if (line.includes('HOW TO') || line.includes('CONTROLS')) {
      p.fill(255, 220, 100);
      p.textSize(18);
    } else if (line === '') {
      yOffset += 5;
      continue;
    } else {
      p.fill(220, 220, 220);
      p.textSize(14);
    }
    p.text(line, CANVAS_WIDTH / 2 - 240, yOffset);
    yOffset += 22;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(24);
  const blink = Math.sin(gameState.frameCount * 0.1) > 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  p.pop();
}

// Render HUD during gameplay
export function renderHUD(p) {
  // Timer bar
  const timerWidth = CANVAS_WIDTH - 40;
  const timerHeight = 30;
  const timerX = 20;
  const timerY = 20;
  const timerPercent = gameState.roundTimer / (CONFIG.ROUND_TIME * 60);
  
  // Timer background
  p.fill(50, 50, 50, 200);
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.rect(timerX, timerY, timerWidth, timerHeight, 5);
  
  // Timer fill
  let timerColor;
  if (timerPercent > 0.5) {
    timerColor = [100, 255, 100];
  } else if (timerPercent > 0.25) {
    timerColor = [255, 200, 50];
  } else {
    timerColor = [255, 50, 50];
  }
  
  p.fill(timerColor[0], timerColor[1], timerColor[2], 200);
  p.noStroke();
  p.rect(timerX, timerY, timerWidth * timerPercent, timerHeight, 5);
  
  // Timer text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const seconds = Math.ceil(gameState.roundTimer / 60);
  p.text(`TIME: ${seconds}s`, timerX + timerWidth / 2, timerY + timerHeight / 2);
  
  // Round number
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Round ${gameState.currentRound}`, 20, 60);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 60);
  
  // Target height indicator
  if (gameState.targetHeight < CANVAS_HEIGHT) {
    p.push();
    p.stroke(255, 255, 0, 150);
    p.strokeWeight(2);
    p.drawingContext.setLineDash([5, 5]);
    p.line(0, gameState.targetHeight - CONFIG.WIN_HEIGHT_THRESHOLD, CANVAS_WIDTH, gameState.targetHeight - CONFIG.WIN_HEIGHT_THRESHOLD);
    p.drawingContext.setLineDash([]);
    
    p.fill(255, 255, 0);
    p.noStroke();
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(14);
    p.text('TARGET', CANVAS_WIDTH - 10, gameState.targetHeight - CONFIG.WIN_HEIGHT_THRESHOLD - 5);
    p.pop();
  }
  
  // Grab indicator
  if (gameState.isGrabbing) {
    p.fill(255, 255, 100, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text('GRABBING - Hold ↑ to pull', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    
    // Fling charge indicator
    if (gameState.player && gameState.player.flingChargeFrames > 0) {
      const chargePercent = gameState.player.flingChargeFrames / gameState.player.maxFlingCharge;
      p.fill(255, 255 * (1 - chargePercent), 0, 200);
      p.rect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT - 15, 200 * chargePercent, 8, 4);
    }
  }
}

// Render paused overlay
export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(24);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

// Render game over screen
export function renderGameOver(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text(isWin ? 'VICTORY!' : 'ELIMINATED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text(`Rounds Completed: ${gameState.currentRound - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Tower Height: ${gameState.climbers.length + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Restart
  p.textSize(20);
  const blink = Math.sin(gameState.frameCount * 0.1) > 0;
  if (blink) {
    p.fill(255, 255, 100);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
  }
}

// Render ground
export function renderGround(p) {
  // Ground
  p.fill(60, 80, 40);
  p.stroke(40, 60, 20);
  p.strokeWeight(3);
  p.rect(0, gameState.gravity === 0.4 ? 350 : CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Ground pattern
  p.stroke(80, 100, 60);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 20) {
    p.line(i, gameState.gravity === 0.4 ? 350 : CANVAS_HEIGHT - 50, i, CANVAS_HEIGHT);
  }
}

// Render background
export function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(50, 70, 120), p.color(20, 30, 50), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Stars
  p.push();
  p.noStroke();
  p.fill(255, 255, 255, 150);
  for (let i = 0; i < 50; i++) {
    const x = (i * 123.456) % CANVAS_WIDTH;
    const y = (i * 78.901) % (CANVAS_HEIGHT - 100);
    const size = (i % 3) + 1;
    p.circle(x, y, size);
  }
  p.pop();
}