import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === 'START') {
    drawStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    drawPlayingUI(p);
  } else if (gameState.gamePhase === 'PAUSED') {
    drawPlayingUI(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 100);
  p.stroke(0, 100, 200);
  p.strokeWeight(4);
  p.text('OCEAN HUNTER', CANVAS_WIDTH / 2, 80);
  
  p.textSize(28);
  p.fill(100, 200, 255);
  p.text('Cannon Fury', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(16);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'OBJECTIVE:',
    '  Complete all 4 levels by reaching the target score',
    '  before time runs out!',
    '',
    'FISH TYPES:',
    '  Sardine (Blue) - 10 pts',
    '  Tuna (Green) - 25 pts',
    '  Manta Ray (Orange) - 50 pts',
    '  Shark (Grey) - 200 pts',
    '  Giant Squid (Purple) - 500 pts',
    '',
    'CONTROLS:',
    '  Arrow Keys - Aim cannon',
    '  SPACE - Fire',
    '  ESC - Pause',
    '  R - Restart (from game over)'
  ];
  
  let y = 160;
  for (const line of instructions) {
    p.text(line, 40, y);
    y += 20;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 0);
  const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

function drawPlayingUI(p) {
  p.push();
  p.textSize(18);
  p.fill(255);
  p.noStroke();
  
  // Score (top-left)
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, 10, 10);
  
  // Level (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  const currentLevel = LEVELS[gameState.level - 1];
  if (currentLevel) {
    p.text(`LEVEL ${currentLevel.number}: ${currentLevel.name}`, CANVAS_WIDTH - 10, 10);
    
    // Target score
    p.textSize(14);
    p.text(`Target: ${currentLevel.targetScore}`, CANVAS_WIDTH - 10, 35);
  }
  
  // Time remaining (top-center)
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
  
  p.pop();
}

function drawPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 0);
  p.stroke(0);
  p.strokeWeight(4);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.noStroke();
  p.fill(255);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.stroke(0);
  p.strokeWeight(4);
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 80);
  
  // Final score
  p.textSize(24);
  p.fill(255);
  p.noStroke();
  p.text(`Final Score: ${gameState.totalGameScore}`, CANVAS_WIDTH / 2, 150);
  
  // Level reached
  if (!isWin) {
    p.textSize(18);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 180);
  }
  
  // High scores
  p.textSize(20);
  p.text('HIGH SCORES', CANVAS_WIDTH / 2, 220);
  
  p.textSize(16);
  for (let i = 0; i < Math.min(5, gameState.highScores.length); i++) {
    p.text(`${i + 1}. ${gameState.highScores[i]}`, CANVAS_WIDTH / 2, 250 + i * 25);
  }
  
  // Restart prompt
  p.textSize(24);
  const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}