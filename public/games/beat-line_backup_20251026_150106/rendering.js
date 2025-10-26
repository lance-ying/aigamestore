// rendering.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';

export function renderGame(p) {
  const level = LEVELS[gameState.currentLevel];
  
  // Background
  p.background(...level.backgroundColor);

  // Beat pulse effect
  if (gameState.beatPulse > 0) {
    p.push();
    p.noFill();
    p.stroke(...level.color, gameState.beatPulse * 0.5);
    p.strokeWeight(4);
    p.rect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    p.pop();
  }

  // Track segments
  renderTrack(p, level);

  // Obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.render(p, gameState.cameraOffset);
  }

  // Particles
  for (const particle of gameState.particles) {
    particle.render(p, gameState.cameraOffset);
  }

  // Player
  renderPlayer(p);

  // Tap feedback
  for (const feedback of gameState.tapFeedback) {
    feedback.render(p, gameState.cameraOffset);
  }

  // UI
  renderUI(p, level);
}

function renderTrack(p, level) {
  p.push();
  p.translate(-gameState.cameraOffset, 0);
  
  for (const segment of gameState.trackSegments) {
    p.fill(...level.color);
    p.stroke(100);
    p.strokeWeight(2);
    
    const direction = segment.direction;
    if (direction === "RIGHT" || direction === "LEFT") {
      p.rect(segment.x - 25, segment.y - segment.width / 2, 50, segment.width);
    } else {
      p.rect(segment.x - segment.width / 2, segment.y - 25, segment.width, 50);
    }
  }
  
  p.pop();
}

function renderPlayer(p) {
  if (!gameState.player.alive) return;
  
  p.push();
  p.translate(-gameState.cameraOffset, 0);
  
  // Draw trail
  p.noFill();
  p.strokeWeight(5);
  
  for (let i = 0; i < gameState.player.segments.length - 1; i++) {
    const alpha = (i / gameState.player.segments.length) * 255;
    p.stroke(255, 200, 0, alpha);
    
    const seg = gameState.player.segments[i];
    const nextSeg = gameState.player.segments[i + 1];
    p.line(seg.x, seg.y, nextSeg.x, nextSeg.y);
  }
  
  // Draw head with glow
  if (gameState.player.glowIntensity > 0) {
    p.fill(255, 255, 255, gameState.player.glowIntensity);
    p.noStroke();
    p.circle(gameState.player.x, gameState.player.y, 15);
  }
  
  p.fill(255, 200, 0);
  p.noStroke();
  p.circle(gameState.player.x, gameState.player.y, 8);
  
  p.pop();
}

function renderUI(p, level) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score.toString().padStart(7, '0')}`, CANVAS_WIDTH - 20, 20);
  
  if (gameState.perfectStreak > 0) {
    p.textSize(12);
    p.text(`STREAK: ${gameState.perfectStreak}`, CANVAS_WIDTH - 20, 40);
  }
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel + 1}/${LEVELS.length}`, 20, 20);
  p.textSize(12);
  p.text(level.name, 20, 40);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASE.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 0);
    p.text("PAUSED", CANVAS_WIDTH - 20, 60);
  }
}

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 200, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BEAT LINE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text("Navigate the rhythmic path", CANVAS_WIDTH / 2, 140);
  p.text("Time your turns to the beat", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const startY = 200;
  p.text("SPACE - Turn (tap to the beat!)", 150, startY);
  p.text("ESC - Pause/Unpause", 150, startY + 20);
  p.text("R - Restart to menu", 150, startY + 40);
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 0, 150 + pulse * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
  
  // Levels preview
  p.fill(150);
  p.textSize(11);
  p.text("3 Levels • Increasing Difficulty", CANVAS_WIDTH / 2, 360);
}

export function renderGameOverScreen(p) {
  p.background(0, 0, 0, 200);
  
  const isWin = gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  if (!isWin) {
    p.fill(255, 200, 200);
    p.textSize(16);
    p.text(gameState.gameOverReason, CANVAS_WIDTH / 2, 160);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (isWin) {
    p.fill(200, 255, 200);
    p.textSize(14);
    p.text("You've mastered all levels!", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255, 255, 0);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function renderLevelCompleteScreen(p) {
  p.background(0, 0, 0, 200);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 200);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  if (gameState.currentLevel < LEVELS.length - 1) {
    p.fill(255, 255, 0);
    p.textSize(16);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(255, 255, 0, 150 + pulse * 105);
    p.text("PRESS SPACE FOR NEXT LEVEL", CANVAS_WIDTH / 2, 300);
  }
  
  p.fill(150);
  p.textSize(12);
  p.text("or press R to restart", CANVAS_WIDTH / 2, 340);
}