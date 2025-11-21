// rendering.js - Rendering functions for different game phases

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("NUMBER SURGE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(20);
  p.text("Action-Puzzle Runner", CANVAS_WIDTH / 2, 130);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Control a numbered block racing forward.\nAbsorb smaller numbers to grow your value.\nAvoid larger numbers and deadly hazards!\nBreak walls at the end of each level.";
  let yPos = 170;
  for (let line of desc.split('\n')) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Controls
  p.fill(150, 255, 150);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  yPos = 270;
  p.text("Controls:", 80, yPos);
  yPos += 25;
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text("← → : Move left/right", 80, yPos);
  yPos += 20;
  p.text("SHIFT : Pause", 80, yPos);
  yPos += 20;
  p.text("ESC : Pause", 80, yPos);
  yPos += 20;
  p.text("R : Restart", 80, yPos);
  
  // High Score
  if (gameState.highScore > 0) {
    p.fill(255, 200, 50);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 360);
  }
  
  // Start prompt
  p.fill(255, 255, 150);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
}

export function drawPlayingScreen(p) {
  // Background
  const levelData = gameState.levelData;
  const bgColor = levelData.backgroundColor;
  p.background(...bgColor);
  
  // Draw scrolling background pattern
  drawScrollingBackground(p);
  
  // Draw track boundaries
  drawTrack(p);
  
  // Draw entities
  for (let entity of gameState.entities) {
    entity.draw();
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.draw();
  }
  
  // Draw UI
  drawGameUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawScrollingBackground(p) {
  p.push();
  p.noStroke();
  p.fill(255, 255, 255, 30);
  
  const spacing = 40;
  const offset = gameState.backgroundOffset % spacing;
  
  for (let y = -spacing + offset; y < CANVAS_HEIGHT + spacing; y += spacing) {
    for (let x = 0; x < CANVAS_WIDTH; x += spacing * 2) {
      p.rect(x, y, spacing * 0.8, spacing * 0.3);
    }
  }
  
  p.pop();
}

function drawTrack(p) {
  p.push();
  p.stroke(50, 50, 50);
  p.strokeWeight(4);
  p.line(100, 0, 100, CANVAS_HEIGHT);
  p.line(500, 0, 500, CANVAS_HEIGHT);
  
  // Draw dashed center line
  p.stroke(100, 100, 100);
  p.strokeWeight(2);
  p.drawingContext.setLineDash([10, 10]);
  p.line(300, 0, 300, CANVAS_HEIGHT);
  p.drawingContext.setLineDash([]);
  
  p.pop();
}

function drawGameUI(p) {
  // Score
  p.fill(0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level: ${gameState.currentLevel}`, 10, 10);
  
  // Player number
  if (gameState.player) {
    p.fill(255, 255, 100);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(24);
    p.text(`Number: ${gameState.player.value}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
}

export function drawGameOverScreen(p) {
  p.background(40, 20, 20);
  
  // Game Over text
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text("GAME OVER!", CANVAS_WIDTH / 2, 120);
  
  // Final score
  p.fill(255, 200, 200);
  p.textSize(28);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  // Level reached
  p.fill(200, 200, 200);
  p.textSize(20);
  p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 240);
  
  // High score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 280);
  }
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawWinLevelScreen(p) {
  p.background(20, 60, 20);
  
  // Level complete text
  p.fill(150, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(255, 255, 150);
  p.textSize(28);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(20);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  }
  
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawGameWinScreen(p) {
  p.background(40, 20, 60);
  
  // Victory text
  p.fill(255, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("NUMBER MASTER!", CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  p.fill(200, 150, 255);
  p.textSize(28);
  p.text("YOU WIN!", CANVAS_WIDTH / 2, 150);
  
  // Final score
  p.fill(255, 255, 150);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // High score
  p.fill(255, 200, 100);
  p.textSize(24);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 270);
  
  // Congratulations message
  p.fill(220, 220, 220);
  p.textSize(18);
  p.text("Congratulations on completing all levels!", CANVAS_WIDTH / 2, 320);
  
  // Instructions
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}