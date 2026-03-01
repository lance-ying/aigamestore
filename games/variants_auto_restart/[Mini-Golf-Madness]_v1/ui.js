// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_POWER } from './globals.js';

export function renderStartScreen(p) {
  // Background
  p.background(20, 80, 40);
  
  // Start prompt - now serving as the main title
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(28); // Slightly larger for main title
  const alpha = (Math.sin(p.frameCount * 0.1) + 1) / 2 * 255;
  p.fill(255, 255, 0, alpha);
  p.text('press enter to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60); // Centered where the old title was
}

export function renderUI(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 60);
  
  // Hole info
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Hole: ${gameState.currentHole + 1}/${gameState.totalHoles}`, 10, 10);
  
  // Strokes
  p.textSize(18);
  const currentHole = gameState.holes[gameState.currentHole];
  const par = currentHole ? currentHole.par : 3;
  p.text(`Strokes: ${gameState.strokes} (Par ${par})`, 10, 35);
  
  // Total strokes
  const totalStrokes = gameState.holeStrokes.reduce((a, b) => a + b, 0) + gameState.strokes;
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Total: ${totalStrokes}`, CANVAS_WIDTH - 10, 10);
  
  // Previous holes score
  if (gameState.holeStrokes.length > 0) {
    p.textSize(14);
    p.text(`Previous: ${gameState.holeStrokes.join(', ')}`, CANVAS_WIDTH - 10, 35);
  }
  
  // Aim indicator
  if (gameState.isAiming && gameState.ball && !gameState.ball.isMoving()) {
    renderAimIndicator(p);
  }
  
  // Power meter
  if (gameState.isCharging) {
    renderPowerMeter(p);
  }
  
  // Status message
  if (gameState.ball && gameState.ball.inWater) {
    p.fill(100, 150, 255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text('IN WATER - SLOWER MOVEMENT', CANVAS_WIDTH / 2, 65);
  }
}

function renderAimIndicator(p) {
  const ball = gameState.ball;
  if (!ball) return;
  
  const aimLength = 60;
  const endX = ball.x + Math.cos(gameState.aimAngle) * aimLength;
  const endY = ball.y + Math.sin(gameState.aimAngle) * aimLength;
  
  // Aim line
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.line(ball.x, ball.y, endX, endY);
  
  // Arrow head
  const arrowSize = 10;
  const arrowAngle1 = gameState.aimAngle + Math.PI * 0.8;
  const arrowAngle2 = gameState.aimAngle - Math.PI * 0.8;
  
  p.line(endX, endY, 
         endX + Math.cos(arrowAngle1) * arrowSize,
         endY + Math.sin(arrowAngle1) * arrowSize);
  p.line(endX, endY,
         endX + Math.cos(arrowAngle2) * arrowSize,
         endY + Math.sin(arrowAngle2) * arrowSize);
  
  // Aim angle text
  p.fill(255, 255, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  const angleDegrees = Math.round((gameState.aimAngle * 180 / Math.PI + 360) % 360);
  p.text(`${angleDegrees}°`, ball.x, ball.y - 25);
}

function renderPowerMeter(p) {
  const meterX = CANVAS_WIDTH / 2 - 100;
  const meterY = CANVAS_HEIGHT - 40;
  const meterWidth = 200;
  const meterHeight = 20;
  
  // Background
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(meterX, meterY, meterWidth, meterHeight, 5);
  
  // Power fill
  const powerRatio = gameState.power / MAX_POWER;
  const fillColor = p.lerpColor(
    p.color(0, 255, 0),
    p.color(255, 0, 0),
    powerRatio
  );
  p.fill(fillColor);
  p.rect(meterX, meterY, meterWidth * powerRatio, meterHeight, 5);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(meterX, meterY, meterWidth, meterHeight, 5);
  
  // Text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`POWER: ${Math.round(powerRatio * 100)}%`, CANVAS_WIDTH / 2, meterY + meterHeight / 2);
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? 255 : 255, isWin ? 215 : 100, isWin ? 0 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'COURSE COMPLETE!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  if (isWin) {
    // Final score
    p.fill(255);
    p.textSize(24);
    p.text(`Total Strokes: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    
    // Hole breakdown
    p.textSize(18);
    for (let i = 0; i < gameState.holeStrokes.length; i++) {
      const hole = gameState.holes[i];
      const strokes = gameState.holeStrokes[i];
      const par = hole ? hole.par : 3;
      const diff = strokes - par;
      let scoreText = 'Par';
      let color = p.color(255, 255, 255);
      
      if (diff < 0) {
        scoreText = diff === -1 ? 'Birdie' : diff === -2 ? 'Eagle' : 'Albatross';
        color = p.color(0, 255, 0);
      } else if (diff > 0) {
        scoreText = diff === 1 ? 'Bogey' : `+${diff}`;
        color = p.color(255, 100, 100);
      }
      
      p.fill(color);
      p.text(`Hole ${i + 1}: ${strokes} (${scoreText})`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10 + i * 25);
    }
  }
  
  // Restart instruction
  p.fill(255);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}