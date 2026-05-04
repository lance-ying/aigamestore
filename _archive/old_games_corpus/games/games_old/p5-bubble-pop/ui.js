// ui.js - UI rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, DANGER_LINE_Y, gameState } from './globals.js';

export function renderUI(p) {
  const state = gameState;
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${state.score}`, 10, 10);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${state.currentLevel}`, CANVAS_WIDTH - 10, 10);
  
  // Shots remaining
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(14);
  const shotsColor = state.shotsRemaining < 5 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...shotsColor);
  p.text(`SHOTS: ${state.shotsRemaining}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
  
  // Power-ups
  renderPowerupUI(p, state);
  
  // Danger line
  p.stroke(255, 0, 0, 100);
  p.strokeWeight(2);
  p.line(0, DANGER_LINE_Y, CANVAS_WIDTH, DANGER_LINE_Y);
  p.noStroke();
  
  // Paused indicator
  if (state.gamePhase === 'PAUSED') {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 0);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 35);
  }
}

function renderPowerupUI(p, state) {
  // Bomb power-up
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.fill(255, 150, 0);
  p.text(`BOMB (Z): ${state.bombPowerups}`, 10, CANVAS_HEIGHT - 5);
  
  // Draw bomb icon
  if (state.bombPowerups > 0) {
    p.fill(255, 150, 0);
    p.ellipse(15, CANVAS_HEIGHT - 25, 12);
    p.fill(255, 100, 0);
    p.ellipse(15, CANVAS_HEIGHT - 25, 6);
  }
  
  // Beam power-up
  p.textAlign(p.LEFT, p.BOTTOM);
  p.fill(0, 255, 255);
  p.text(`BEAM (SHIFT): ${state.beamPowerups}`, 10, CANVAS_HEIGHT - 25);
  
  // Draw beam icon
  if (state.beamPowerups > 0) {
    p.stroke(0, 255, 255);
    p.strokeWeight(3);
    p.line(15, CANVAS_HEIGHT - 45, 35, CANVAS_HEIGHT - 45);
    p.noStroke();
  }
}

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('BUBBLE POP!', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 220, 255);
  p.textSize(20);
  p.text('Puzzle Challenge', CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'HOW TO PLAY:',
    '• Match 3+ bubbles of the same color',
    '• Clear all bubbles before shots run out',
    '• Detached bubbles fall for bonus points',
    '',
    'CONTROLS:',
    '• Arrow Keys: Aim launcher',
    '• Space: Fire bubble',
    '• Z: Use BOMB power-up',
    '• Shift: Use BEAM power-up',
    '• ESC: Pause',
    '• R: Restart'
  ];
  
  let y = 170;
  for (const line of instructions) {
    if (line.startsWith('•')) {
      p.fill(200);
    } else {
      p.fill(255, 255, 0);
    }
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function renderGameOverScreen(p, win) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (win) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('LEVEL CLEARED!', CANVAS_WIDTH / 2, 100);
    
    // Stars
    p.textSize(20);
    p.fill(255, 255, 0);
    p.text(`★ ${gameState.starsEarned} STARS ★`, CANVAS_WIDTH / 2, 160);
    
    // Draw stars
    const starY = 200;
    for (let i = 0; i < 3; i++) {
      const filled = i < gameState.starsEarned;
      p.fill(...(filled ? [255, 255, 0] : [100, 100, 100]));
      drawStar(p, CANVAS_WIDTH / 2 - 50 + i * 50, starY, 15);
    }
    
    p.fill(255);
    p.textSize(18);
    p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 250);
    p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 280);
    
    if (gameState.currentLevel < 4) {
      p.fill(100, 200, 255);
      p.textSize(16);
      p.text('PRESS ENTER for next level', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    } else {
      p.fill(255, 200, 100);
      p.textSize(20);
      p.text('ALL LEVELS COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
      p.fill(100, 200, 255);
      p.textSize(16);
      p.text('PRESS ENTER to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    
    p.fill(255, 200, 100);
    p.textSize(16);
    p.text('PRESS ENTER to retry', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  }
  
  p.fill(200);
  p.textSize(14);
  p.text('PRESS R to return to menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function drawStar(p, x, y, size) {
  p.push();
  p.translate(x, y);
  p.beginShape();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size / 2;
    p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  p.endShape(p.CLOSE);
  p.pop();
}