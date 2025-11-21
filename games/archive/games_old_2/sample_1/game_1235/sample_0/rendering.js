// rendering.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_TIME_LIMIT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 25, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(100, 200, 255, 30);
  p.text('BUBBLE CASH', CANVAS_WIDTH / 2 + 3, 80 + 3);
  p.fill(100, 200, 255);
  p.text('BUBBLE CASH', CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Decorative bubbles
  const bubblePositions = [
    [100, 100], [500, 120], [150, 280], [450, 300], [300, 150]
  ];
  const colors = [[255, 100, 100], [100, 150, 255], [100, 255, 150], [255, 200, 100], [255, 100, 255]];
  
  for (let i = 0; i < bubblePositions.length; i++) {
    const [x, y] = bubblePositions[i];
    const pulse = Math.sin(p.frameCount * 0.03 + i) * 0.2 + 1;
    p.fill(...colors[i], 150);
    p.noStroke();
    p.circle(x, y, 30 * pulse);
  }
  
  // Description
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(200, 210, 230);
  p.text('Compete in a tournament-style bubble shooter!', CANVAS_WIDTH / 2, 140);
  p.text('Match 3+ bubbles of the same color to pop them.', CANVAS_WIDTH / 2, 160);
  p.text('Clear all bubbles and rank top 3 to win!', CANVAS_WIDTH / 2, 180);
  p.pop();
  
  // Instructions box
  p.push();
  p.fill(30, 35, 50, 200);
  p.noStroke();
  p.rect(CANVAS_WIDTH / 2 - 180, 210, 360, 110, 10);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(13);
  p.fill(255, 255, 100);
  p.text('CONTROLS:', CANVAS_WIDTH / 2 - 160, 230);
  p.fill(220, 220, 220);
  p.text('← → : Aim laser guide', CANVAS_WIDTH / 2 - 160, 252);
  p.text('SPACE : Launch bubble', CANVAS_WIDTH / 2 - 160, 274);
  p.text('ESC : Pause/Unpause', CANVAS_WIDTH / 2 - 160, 296);
  p.pop();
  
  // Start prompt with animation
  p.push();
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 255, 150, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  p.pop();
}

export function drawPauseIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOver(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Result box
  p.fill(30, 35, 50, 250);
  p.rect(CANVAS_WIDTH / 2 - 200, 100, 400, 200, 15);
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.fill(...(isWin ? [100, 255, 150] : [255, 100, 100]));
  p.text(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 140);
  
  // Rank
  p.textSize(20);
  p.fill(220, 220, 220);
  const rankText = isWin ? `Rank: ${gameState.playerRank}/4` : `Rank: ${gameState.playerRank}/4`;
  p.text(rankText, CANVAS_WIDTH / 2, 180);
  
  // Score
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  
  // Stats
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Bubbles Cleared: ${gameState.bubblesCleared}`, CANVAS_WIDTH / 2, 235);
  
  // Restart prompt
  p.textSize(16);
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.fill(100, 200, 255, alpha);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 270);
  
  p.pop();
}

export function drawUI(p) {
  // Top bar background
  p.push();
  p.fill(20, 25, 40, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`Score: ${gameState.score}`, 15, 25);
  
  // Timer
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const timeColor = gameState.timeRemaining < 20 ? [255, 100, 100] : [100, 200, 255];
  p.fill(...timeColor);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  p.text(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 25);
  
  // Level
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(150, 255, 150);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH - 15, 25);
  
  p.pop();
  
  // Opponent progress bars
  drawOpponentProgress(p);
}

export function drawOpponentProgress(p) {
  p.push();
  const barWidth = 120;
  const barHeight = 15;
  const startY = 60;
  const spacing = 25;
  
  p.textSize(10);
  
  for (let i = 0; i < gameState.opponents.length; i++) {
    const opp = gameState.opponents[i];
    const y = startY + i * spacing;
    
    // Background
    p.fill(40, 45, 60);
    p.noStroke();
    p.rect(CANVAS_WIDTH - barWidth - 15, y, barWidth, barHeight, 3);
    
    // Progress
    const progress = opp.progress / 100;
    p.fill(100, 150, 255);
    p.rect(CANVAS_WIDTH - barWidth - 15, y, barWidth * progress, barHeight, 3);
    
    // Name
    p.fill(200, 200, 200);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(opp.name, CANVAS_WIDTH - barWidth - 20, y + barHeight / 2);
    
    // Bubbles remaining
    p.textAlign(p.LEFT, p.CENTER);
    p.fill(255, 255, 150);
    p.text(`${opp.bubblesRemaining}`, CANVAS_WIDTH - 10, y + barHeight / 2);
  }
  
  p.pop();
}

export function drawShooter(p, x, y) {
  p.push();
  
  // Base platform
  p.fill(50, 60, 80);
  p.noStroke();
  p.rect(x - 40, y + 15, 80, 20, 5);
  
  // Cannon
  p.fill(70, 80, 100);
  p.rect(x - 15, y - 10, 30, 30, 5);
  
  // Highlight
  p.fill(100, 110, 130);
  p.rect(x - 10, y - 5, 20, 10, 3);
  
  p.pop();
}

export function drawLaserGuide(p, points) {
  if (points.length < 2) return;
  
  p.push();
  p.stroke(255, 100, 100, 150);
  p.strokeWeight(2);
  
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    
    // Dashed line effect
    if (i % 3 !== 0) {
      p.line(curr.x, curr.y, next.x, next.y);
    }
  }
  
  // Target circle at end
  if (points.length > 0) {
    const last = points[points.length - 1];
    p.noFill();
    p.stroke(255, 100, 100, 200);
    p.strokeWeight(2);
    p.circle(last.x, last.y, 30);
  }
  
  p.pop();
}