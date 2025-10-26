// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIGS } from './globals.js';

export function drawStartScreen(p) {
  p.background(0, 150, 0);
  
  // Draw field markings
  drawFieldMarkings(p);
  
  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CRAZY KICK!", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.strokeWeight(2);
  p.text("Control the ball and score goals!", CANVAS_WIDTH / 2, 140);
  p.text("Navigate through 5 challenging levels", CANVAS_WIDTH / 2, 165);
  
  // Instructions
  p.textSize(14);
  p.text("Arrow Keys / WASD: Move the ball", CANVAS_WIDTH / 2, 210);
  p.text("Space: Dash", CANVAS_WIDTH / 2, 230);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 250);
  
  // High Score
  p.textSize(18);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 290);
  
  // Start prompt
  p.textSize(24);
  p.fill(255, 255, 0);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

export function drawPlayingScreen(p) {
  p.background(0, 150, 0);
  
  // Draw field markings
  drawFieldMarkings(p);
  
  // Draw goal
  if (gameState.goal) {
    gameState.goal.draw();
  }
  
  // Draw obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.draw();
  }
  
  // Draw opponents
  for (const opponent of gameState.opponents) {
    opponent.draw();
  }
  
  // Draw player (ball)
  if (gameState.player) {
    gameState.player.draw();
  }
  
  // Draw UI
  drawGameUI(p);
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawLevelCompleteScreen(p) {
  p.background(0, 150, 0);
  drawFieldMarkings(p);
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GOAL!", CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(32);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 160);
  
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  const timeBonus = Math.floor(gameState.timeRemaining * 10);
  p.textSize(18);
  p.text(`Time Bonus: +${timeBonus}`, CANVAS_WIDTH / 2, 260);
  
  if (gameState.currentLevel < LEVEL_CONFIGS.length) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 330);
  }
}

export function drawGameOverScreen(p, isWin) {
  p.background(0, 150, 0);
  drawFieldMarkings(p);
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(40);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
    p.textSize(32);
    p.text("WORLD CUP CHAMPIONS!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  } else {
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255, 255, 0);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}

function drawFieldMarkings(p) {
  p.push();
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  
  // Boundary
  p.rect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
  
  // Center line
  p.line(CANVAS_WIDTH / 2, 10, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  
  // Center circle
  p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80);
  
  // Penalty areas
  p.rect(10, CANVAS_HEIGHT / 2 - 60, 80, 120);
  p.rect(CANVAS_WIDTH - 90, CANVAS_HEIGHT / 2 - 60, 80, 120);
  
  p.pop();
}

function drawGameUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  
  // Score
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // High Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`HIGH: ${gameState.highScore}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(18);
  const levelConfig = LEVEL_CONFIGS[gameState.currentLevel - 1];
  p.text(`LEVEL ${gameState.currentLevel}: ${levelConfig.name}`, 10, CANVAS_HEIGHT - 10);
  
  // Tackles
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`TACKLES: ${gameState.tacklesRemaining}/${gameState.maxTackles}`, 10, 40);
  
  // Timer
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.stroke(0);
  p.strokeWeight(3);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}`, CANVAS_WIDTH / 2, 10);
  
  p.pop();
}